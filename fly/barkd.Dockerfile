# syntax=docker/dockerfile:1

FROM debian:bookworm-slim AS downloader

ARG BARK_VERSION=0.6.1
ARG BARKD_SHA256=41ca75ae2e474b3a3dbb33f51af95175926abb2286134fcb435fb47b995a1efd

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl --fail --location --show-error \
        "https://gitlab.com/ark-bitcoin/bark/-/releases/bark-${BARK_VERSION}/downloads/barkd-${BARK_VERSION}-linux-x86_64" \
        --output /barkd \
    && echo "${BARKD_SHA256}  /barkd" | sha256sum --check \
    && chmod 0755 /barkd

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install --yes --no-install-recommends ca-certificates gosu \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system barkd \
    && useradd --system --gid barkd --home-dir /data --no-create-home barkd \
    && install --directory --owner barkd --group barkd --mode 0700 /data

COPY --from=downloader /barkd /usr/local/bin/barkd
COPY fly/barkd-entrypoint.sh /usr/local/bin/barkd-entrypoint

ENV BARKD_DATADIR=/data \
    BARKD_BIND_HOST=:: \
    BARKD_BIND_PORT=3000

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/barkd-entrypoint"]
CMD ["barkd"]
