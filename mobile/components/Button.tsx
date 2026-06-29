import { TouchableOpacity, Text, ActivityIndicator, View } from "react-native";
import type { ReactNode } from "react";
import { Ionicons } from "@expo/vector-icons";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<ButtonVariant, { bg: string; text: string; loading: string }> = {
  primary: {
    bg: "bg-primary-300",
    text: "text-bg",
    loading: "#181818",
  },
  secondary: {
    bg: "bg-bg-surface",
    text: "text-text-primary",
    loading: "#f8f8f8",
  },
  danger: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    loading: "#f87171",
  },
  ghost: {
    bg: "bg-transparent",
    text: "text-text-secondary",
    loading: "#a0a0a0",
  },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "py-2 px-3 rounded-lg",
  md: "py-3 px-4 rounded-xl",
  lg: "py-4 px-6 rounded-xl",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export default function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  children,
}: ButtonProps) {
  const styles = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const textSize = textSizeStyles[size];

  return (
    <TouchableOpacity
      className={`${styles.bg} ${sizeStyle} items-center flex-row justify-center active:opacity-80 ${disabled || loading ? "opacity-50" : ""} ${className}`}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={styles.loading} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={size === "sm" ? 16 : 20} color={variant === "primary" ? "#181818" : undefined} style={title ? { marginRight: 8 } : undefined} />}
          {title ? <Text className={`${styles.text} ${textSize} font-semibold`}>{title}</Text> : null}
          {children}
        </>
      )}
    </TouchableOpacity>
  );
}
