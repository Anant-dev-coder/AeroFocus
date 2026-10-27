import React, { type ReactNode } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function ScreenFrame({
  children,
  scroll = true,
  tabbed = false,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  tabbed?: boolean;
  contentStyle?: ViewStyle;
}) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const web = Platform.OS === 'web';
  const top = web ? Math.max(67, insets.top) : insets.top;
  const bottom = web ? (tabbed ? 108 : 34) : Math.max(insets.bottom, 18);
  const padding = {
    paddingTop: top + 14,
    paddingBottom: bottom + 24,
    paddingHorizontal: 22,
  };

  if (!scroll) {
    return (
      <View
        style={[
          styles.frame,
          padding,
          { backgroundColor: colors.background },
          contentStyle,
        ]}
      >
        <View style={styles.content}>{children}</View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.frame, { backgroundColor: colors.background }]}
      contentContainerStyle={[padding, styles.content, contentStyle]}
      contentInsetAdjustmentBehavior="never"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1 },
  content: {
    width: '100%',
    maxWidth: 510,
    alignSelf: 'center',
    gap: 18,
  },
});
