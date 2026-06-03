import type { BarkFeeEstimate } from "~/lib/paymentsApi";
import { Text } from "~/components/ui/text";
import { formatBip177 } from "~/lib/utils";
import { COLORS } from "~/lib/styleConstants";
import { FeeEstimateBox, FeeEstimateRow, FeeEstimateSeparator } from "~/components/FeeEstimateBox";

type FeeEstimateSummaryProps = {
  estimate?: BarkFeeEstimate;
  isLoading?: boolean;
  error?: Error | null;
  compact?: boolean;
  title?: string;
  netLabel?: string;
  feeLabel?: string;
  grossLabel?: string;
  unavailableText?: string;
  note?: string | null;
  feeValueClassName?: string;
};

export const FeeEstimateSummary = ({
  estimate,
  isLoading = false,
  error = null,
  compact = false,
  title = "Fee estimate",
  netLabel = "Recipient gets",
  feeLabel = "Estimated fee",
  grossLabel = "Total deducted",
  unavailableText = "Fee estimate unavailable. The final fee will be calculated when you send.",
  note = null,
  feeValueClassName,
}: FeeEstimateSummaryProps) => {
  if (!estimate && !isLoading && !error) {
    return null;
  }

  return (
    <FeeEstimateBox title={title} isLoading={isLoading} compact={compact}>
      {estimate ? (
        <>
          <FeeEstimateRow
            label={netLabel}
            value={formatBip177(estimate.net_amount_sat)}
            compact={compact}
          />
          <FeeEstimateSeparator />
          <FeeEstimateRow
            label={feeLabel}
            value={formatBip177(estimate.fee_sat)}
            compact={compact}
            valueClassName={feeValueClassName}
          />
          <FeeEstimateSeparator />
          <FeeEstimateRow
            label={grossLabel}
            value={formatBip177(estimate.gross_amount_sat)}
            compact={compact}
          />
          {estimate.vtxos_spent.length > 0 ? (
            <Text className="mt-2 text-xs text-muted-foreground">
              Spending {estimate.vtxos_spent.length} VTXO
              {estimate.vtxos_spent.length === 1 ? "" : "s"}
            </Text>
          ) : null}
          {note ? <Text className="mt-2 text-xs text-muted-foreground">{note}</Text> : null}
        </>
      ) : error ? (
        <Text className="text-sm leading-5" style={{ color: COLORS.BITCOIN_ORANGE }}>
          {unavailableText}
        </Text>
      ) : (
        <Text className="text-sm text-muted-foreground">Estimating fee...</Text>
      )}
    </FeeEstimateBox>
  );
};
