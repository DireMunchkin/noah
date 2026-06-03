import type React from "react";
import { View } from "react-native";
import { Text } from "~/components/ui/text";
import { NoahActivityIndicator } from "~/components/ui/NoahActivityIndicator";
import { cn } from "~/lib/utils";
import { useThemeColors } from "~/hooks/useTheme";

type FeeEstimateBoxProps = {
  title: string;
  isLoading?: boolean;
  compact?: boolean;
  children: React.ReactNode;
};

export const FeeEstimateBox = ({
  title,
  isLoading = false,
  compact = false,
  children,
}: FeeEstimateBoxProps) => {
  const colors = useThemeColors();

  return (
    <View
      className={`${compact ? "mt-3 rounded-[18px] px-3 py-3" : "mt-4 rounded-[20px] px-4 py-4"} border`}
      style={{
        borderColor: `${colors.mutedForeground}22`,
        backgroundColor: `${colors.card}CC`,
      }}
    >
      <View className={`${compact ? "mb-1" : "mb-2"} flex-row items-center justify-between`}>
        <Text className="text-xs font-semibold uppercase tracking-[2px] text-muted-foreground">
          {title}
        </Text>
        {isLoading ? <NoahActivityIndicator size="small" /> : null}
      </View>

      {children}
    </View>
  );
};

export const FeeEstimateRow = ({
  label,
  value,
  compact = false,
  valueClassName,
}: {
  label: string;
  value: string;
  compact?: boolean;
  valueClassName?: string;
}) => (
  <View className={`flex-row items-center justify-between ${compact ? "py-1" : "py-2"}`}>
    <Text className="text-sm text-muted-foreground">{label}</Text>
    <Text className={cn("text-sm font-semibold text-foreground", valueClassName)}>{value}</Text>
  </View>
);

export const FeeEstimateSeparator = ({ className }: { className?: string }) => (
  <View className={cn("h-px bg-border/70", className)} />
);
