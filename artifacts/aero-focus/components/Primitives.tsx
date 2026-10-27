import React, { type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type PressableProps,
  type ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

export function Panel({
  children,
  style,
  className = '',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const colors = useColors();
  return (
    <View
      className={`rounded-3xl border border-line bg-card ${className}`}
      style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
      {children}
    </Text>
  );
}

export function ActionButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  secondary = false,
  icon,
  style,
  testID,
}: {
  title: string;
  onPress: PressableProps['onPress'];
  disabled?: boolean;
  loading?: boolean;
  secondary?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  const colors = useColors();
  const backgroundColor = secondary ? colors.secondary : colors.primary;
  const foregroundColor = secondary
    ? colors.secondaryForeground
    : colors.primaryForeground;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor,
          opacity: disabled ? 0.45 : pressed ? 0.78 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, { color: foregroundColor }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? colors.primary : colors.secondary,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.76 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          {
            color: selected ? colors.primaryForeground : colors.secondaryForeground,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.errorBox,
        { backgroundColor: colors.accentForeground, borderColor: colors.accent },
      ]}
    >
      <Text style={[styles.errorText, { color: colors.accent }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  button: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 15,
    paddingVertical: 11,
    minHeight: 42,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
  },
});
