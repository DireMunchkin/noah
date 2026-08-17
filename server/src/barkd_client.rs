use std::time::Duration;

use anyhow::{Context, Result};
use async_trait::async_trait;
use reqwest::header::{AUTHORIZATION, HeaderValue};
use serde::{Deserialize, Serialize};

const CREATE_INVOICE_FOR_ADDRESS_PATH: &str = "api/v1/lightning/receives/invoice/for-address";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ForwardingInvoice {
    pub invoice: String,
}

#[async_trait]
pub trait ForwardingInvoiceProvider: Send + Sync {
    async fn create_invoice_for_address(
        &self,
        address: &str,
        amount_sat: u64,
        description: Option<&str>,
    ) -> Result<ForwardingInvoice>;
}

#[derive(Clone)]
pub struct BarkdClient {
    client: reqwest::Client,
    base_url: reqwest::Url,
    authorization: HeaderValue,
}

impl BarkdClient {
    pub fn new(base_url: &str, auth_token: &str, request_timeout: Duration) -> Result<Self> {
        if request_timeout.is_zero() {
            anyhow::bail!("barkd request timeout must be greater than zero");
        }
        if auth_token.trim().is_empty() {
            anyhow::bail!("barkd auth token must not be empty");
        }

        let mut base_url = reqwest::Url::parse(base_url).context("invalid barkd base URL")?;
        if !matches!(base_url.scheme(), "http" | "https") || base_url.cannot_be_a_base() {
            anyhow::bail!("barkd base URL must use HTTP or HTTPS");
        }
        if !base_url.path().ends_with('/') {
            let path = format!("{}/", base_url.path());
            base_url.set_path(&path);
        }

        let mut authorization = HeaderValue::from_str(&format!("Bearer {auth_token}"))
            .context("invalid barkd auth token")?;
        authorization.set_sensitive(true);

        let client = reqwest::Client::builder()
            .connect_timeout(request_timeout)
            .timeout(request_timeout)
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .context("failed to build barkd HTTP client")?;

        Ok(Self {
            client,
            base_url,
            authorization,
        })
    }

    fn endpoint(&self, path: &str) -> Result<reqwest::Url> {
        self.base_url
            .join(path)
            .context("failed to build barkd endpoint URL")
    }
}

#[derive(Debug, Serialize)]
struct CreateInvoiceForAddressRequest<'a> {
    address: &'a str,
    amount_sat: u64,
    description: Option<&'a str>,
}

#[derive(Debug, Deserialize)]
struct InvoiceResponse {
    invoice: String,
}

#[async_trait]
impl ForwardingInvoiceProvider for BarkdClient {
    async fn create_invoice_for_address(
        &self,
        address: &str,
        amount_sat: u64,
        description: Option<&str>,
    ) -> Result<ForwardingInvoice> {
        let response = self
            .client
            .post(self.endpoint(CREATE_INVOICE_FOR_ADDRESS_PATH)?)
            .header(AUTHORIZATION, self.authorization.clone())
            .json(&CreateInvoiceForAddressRequest {
                address,
                amount_sat,
                description,
            })
            .send()
            .await
            .context("barkd invoice request failed")?;

        let status = response.status();
        if !status.is_success() {
            anyhow::bail!("barkd invoice request returned HTTP {status}");
        }

        let response: InvoiceResponse = response
            .json()
            .await
            .context("barkd invoice response was invalid")?;
        if response.invoice.trim().is_empty() {
            anyhow::bail!("barkd invoice response was empty");
        }

        Ok(ForwardingInvoice {
            invoice: response.invoice,
        })
    }
}

#[cfg(test)]
mod tests {
    use std::time::Duration;

    use axum::Router;
    use axum::http::{HeaderMap, StatusCode};
    use axum::response::IntoResponse;
    use axum::routing::post;
    use serde::Deserialize;
    use serde_json::json;

    use super::{BarkdClient, ForwardingInvoiceProvider};

    #[derive(Deserialize)]
    struct ReceivedInvoiceRequest {
        address: String,
        amount_sat: u64,
        description: Option<String>,
    }

    async fn spawn_server(app: Router) -> String {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move {
            axum::serve(listener, app).await.unwrap();
        });
        format!("http://{address}")
    }

    #[tokio::test]
    async fn creates_an_authenticated_invoice_for_the_supplied_address() {
        let app = Router::new().route(
            "/api/v1/lightning/receives/invoice/for-address",
            post(
                |headers: HeaderMap,
                 axum::Json(body): axum::Json<ReceivedInvoiceRequest>| async move {
                    if headers.get("authorization").and_then(|value| value.to_str().ok())
                        != Some("Bearer secret-token")
                    {
                        return StatusCode::UNAUTHORIZED.into_response();
                    }
                    if body.address != "ark-address"
                        || body.amount_sat != 330
                        || body.description.as_deref() != Some("Paying test@noahwallet.io")
                    {
                        return StatusCode::BAD_REQUEST.into_response();
                    }
                    axum::Json(json!({ "invoice": "lnbc-test-invoice" })).into_response()
                },
            ),
        );
        let base_url = spawn_server(app).await;
        let client = BarkdClient::new(&base_url, "secret-token", Duration::from_secs(1)).unwrap();

        let result = client
            .create_invoice_for_address("ark-address", 330, Some("Paying test@noahwallet.io"))
            .await
            .unwrap();

        assert_eq!(result.invoice, "lnbc-test-invoice");
    }

    #[tokio::test]
    async fn reports_status_without_exposing_the_response_body() {
        let app = Router::new().route(
            "/api/v1/lightning/receives/invoice/for-address",
            post(|| async {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    "sensitive upstream details",
                )
            }),
        );
        let base_url = spawn_server(app).await;
        let client = BarkdClient::new(&base_url, "secret-token", Duration::from_secs(1)).unwrap();

        let error = client
            .create_invoice_for_address("ark-address", 330, None)
            .await
            .unwrap_err()
            .to_string();

        assert!(error.contains("HTTP 500 Internal Server Error"));
        assert!(!error.contains("sensitive upstream details"));
        assert!(!error.contains("secret-token"));
    }

    #[tokio::test]
    async fn rejects_invalid_or_empty_invoice_responses() {
        for response in ["not-json", r#"{"invoice":""}"#] {
            let body = response.to_string();
            let app = Router::new().route(
                "/api/v1/lightning/receives/invoice/for-address",
                post(move || {
                    let body = body.clone();
                    async move { body }
                }),
            );
            let base_url = spawn_server(app).await;
            let client =
                BarkdClient::new(&base_url, "secret-token", Duration::from_secs(1)).unwrap();

            assert!(
                client
                    .create_invoice_for_address("ark-address", 330, None)
                    .await
                    .is_err()
            );
        }
    }

    #[tokio::test]
    async fn enforces_the_total_request_timeout() {
        let app = Router::new().route(
            "/api/v1/lightning/receives/invoice/for-address",
            post(|| async {
                tokio::time::sleep(Duration::from_millis(100)).await;
                axum::Json(json!({ "invoice": "late-invoice" }))
            }),
        );
        let base_url = spawn_server(app).await;
        let client =
            BarkdClient::new(&base_url, "secret-token", Duration::from_millis(10)).unwrap();

        let error = client
            .create_invoice_for_address("ark-address", 330, None)
            .await
            .unwrap_err();

        assert!(error.to_string().contains("barkd invoice request failed"));
    }

    #[test]
    fn validates_constructor_inputs() {
        assert!(BarkdClient::new("not a URL", "token", Duration::from_secs(1)).is_err());
        assert!(
            BarkdClient::new("http://localhost", "bad\ntoken", Duration::from_secs(1)).is_err()
        );
        assert!(BarkdClient::new("ftp://localhost", "token", Duration::from_secs(1)).is_err());
        assert!(BarkdClient::new("http://localhost", " ", Duration::from_secs(1)).is_err());
        assert!(BarkdClient::new("http://localhost", "token", Duration::ZERO).is_err());
    }
}
