import * as SelectPrimitive from "@rn-primitives/select";
import * as React from "react";
import { Platform, ScrollView, StyleSheet, View, Text, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { Check } from "~/lib/icons/Check";
import { ChevronDown } from "~/lib/icons/ChevronDown";
import { ChevronUp } from "~/lib/icons/ChevronUp";
import { cn } from "~/lib/utils";

type Option = SelectPrimitive.Option;

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  ref,
  className,
  children,
  ...props
}: SelectPrimitive.TriggerProps & {
  ref?: React.RefObject<SelectPrimitive.TriggerRef>;
  children?: React.ReactNode;
}) {
  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-row h-10 native:h-12 items-center text-sm justify-between rounded-md border border-input bg-background px-3 py-2 web:ring-offset-background text-muted-foreground web:focus:outline-none web:focus:ring-2 web:focus:ring-ring web:focus:ring-offset-2 [&>span]:line-clamp-1",
        props.disabled && "web:cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronDown size={16} aria-hidden={true} className="text-foreground opacity-50" />
    </SelectPrimitive.Trigger>
  );
}

/**
 * Platform: WEB ONLY
 */
function SelectScrollUpButton({ className, ...props }: SelectPrimitive.ScrollUpButtonProps) {
  if (Platform.OS !== "web") {
    return null;
  }
  return (
    <SelectPrimitive.ScrollUpButton
      className={cn("flex web:cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronUp size={14} className="text-foreground" />
    </SelectPrimitive.ScrollUpButton>
  );
}

/**
 * Platform: WEB ONLY
 */
function SelectScrollDownButton({ className, ...props }: SelectPrimitive.ScrollDownButtonProps) {
  if (Platform.OS !== "web") {
    return null;
  }
  return (
    <SelectPrimitive.ScrollDownButton
      className={cn("flex web:cursor-default items-center justify-center py-1", className)}
      {...props}
    >
      <ChevronDown size={14} className="text-foreground" />
    </SelectPrimitive.ScrollDownButton>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  portalHost,
  style,
  ...props
}: SelectPrimitive.ContentProps & {
  ref?: React.RefObject<SelectPrimitive.ContentRef>;
  className?: string;
  portalHost?: string;
}) {
  const { open, triggerPosition } = SelectPrimitive.useRootContext();
  const { height: windowHeight } = useWindowDimensions();
  const nativeMaxHeight =
    Platform.OS === "web" || !triggerPosition
      ? undefined
      : Math.max(
          160,
          Math.min(384, windowHeight - triggerPosition.pageY - triggerPosition.height - 32),
        );
  const viewportClassName = cn(
    "p-1",
    position === "popper" &&
      "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
  );
  const contentStyle =
    Platform.OS === "web"
      ? style
      : StyleSheet.flatten([
          {
            maxHeight: nativeMaxHeight,
            width: triggerPosition?.width,
          },
          style,
        ]);

  return (
    <SelectPrimitive.Portal hostName={portalHost}>
      <SelectPrimitive.Overlay style={Platform.OS !== "web" ? StyleSheet.absoluteFill : undefined}>
        <Animated.View className="z-50" entering={FadeIn} exiting={FadeOut}>
          <SelectPrimitive.Content
            className={cn(
              "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover shadow-md shadow-foreground/10 py-2 px-1 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
              position === "popper" &&
                "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
              open
                ? "web:zoom-in-95 web:animate-in web:fade-in-0"
                : "web:zoom-out-95 web:animate-out web:fade-out-0",
              className,
            )}
            position={position}
            style={contentStyle}
            {...props}
          >
            <SelectScrollUpButton />
            {Platform.OS === "web" ? (
              <SelectPrimitive.Viewport className={viewportClassName}>
                {children}
              </SelectPrimitive.Viewport>
            ) : (
              <ScrollView
                style={{ maxHeight: nativeMaxHeight }}
                contentContainerStyle={{ padding: 4 }}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
              </ScrollView>
            )}
            <SelectScrollDownButton />
          </SelectPrimitive.Content>
        </Animated.View>
      </SelectPrimitive.Overlay>
    </SelectPrimitive.Portal>
  );
}

function SelectLabel({
  className,
  ...props
}: SelectPrimitive.LabelProps & {
  ref?: React.RefObject<SelectPrimitive.LabelRef>;
}) {
  return (
    <SelectPrimitive.Label
      className={cn(
        "py-1.5 native:pb-2 pl-8 native:pl-10 pr-2 text-popover-foreground text-sm native:text-base font-semibold",
        className,
      )}
      {...props}
    />
  );
}

function SelectItem({
  className,
  icon,
  description,
  ...props
}: SelectPrimitive.ItemProps & {
  ref?: React.RefObject<SelectPrimitive.ItemRef>;
  icon?: React.ReactNode;
  description?: string;
}) {
  return (
    <SelectPrimitive.Item
      className={cn(
        "relative web:group flex flex-row w-full min-w-0 web:cursor-default web:select-none items-center rounded-sm py-1.5 native:py-2 pl-8 native:pl-10 pr-2 web:hover:bg-accent/50 active:bg-accent web:outline-none web:focus:bg-accent",
        props.disabled && "web:pointer-events-none opacity-50",
        className,
      )}
      {...props}
    >
      <View className="absolute left-2 native:left-3.5 flex h-3.5 native:pt-px w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={16} strokeWidth={3} className="text-popover-foreground" />
        </SelectPrimitive.ItemIndicator>
      </View>
      {icon}
      <View className="flex-1 min-w-0">
        <SelectPrimitive.ItemText
          numberOfLines={1}
          className="text-sm native:text-lg text-popover-foreground web:group-focus:text-accent-foreground"
        />
        {description && (
          <Text numberOfLines={2} className="text-xs text-muted-foreground">
            {description}
          </Text>
        )}
      </View>
    </SelectPrimitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: SelectPrimitive.SeparatorProps & {
  ref?: React.RefObject<SelectPrimitive.SeparatorRef>;
}) {
  return (
    <SelectPrimitive.Separator className={cn("-mx-1 my-1 h-px bg-muted", className)} {...props} />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  type Option,
};
