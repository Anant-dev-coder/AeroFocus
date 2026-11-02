import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Chip, ErrorNote, Eyebrow, Panel } from '@/components/Primitives';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import {
  getGetAeroDashboardQueryKey,
  getGetAeroProfileQueryKey,
  useGetAeroProfile,
  useSaveAeroProfile,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { SaveAeroProfileBody } from '@workspace/api-zod';

const APP_CHOICES = ['Instagram', 'TikTok', 'YouTube Shorts'] as const;
type TargetApp = (typeof APP_CHOICES)[number];

function suggestedHandle(userId: string | undefined): string {
  const suffix = (userId ?? 'focus-user')
    .slice(-6)
    .replace(/[^a-zA-Z0-9_]/g, '')
    .toLowerCase();
  return `aero${suffix || 'user'}`.slice(0, 18);
}

export default function OnboardingScreen() {
  const colors = useColors();
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useGetAeroProfile({
    query: { enabled: isAuthenticated },
  });
  const saveProfile = useSaveAeroProfile();
  const [username, setUsername] = useState(() => suggestedHandle(user?.id));
  const [targets, setTargets] = useState<TargetApp[]>(['TikTok', 'Instagram']);
  const [error, setError] = useState<string | null>(null);
  const ctaScale = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const toggleTarget = (target: TargetApp) => {
    setTargets((current) =>
      current.includes(target)
        ? current.filter((item) => item !== target)
        : [...current, target],
    );
  };

  const submit = async () => {
    const payload = SaveAeroProfileBody.safeParse({
      username: username.trim().replace(/^@/, '').toLowerCase(),
      targetApps: targets,
      onboardingComplete: true,
    });
    if (!payload.success) {
      const issue = payload.error.issues[0];
      setError(
        issue?.path[0] === 'username'
          ? 'Use 3–18 lowercase letters, numbers, or underscores for your handle.'
          : 'Choose at least one app from the list.',
      );
      return;
    }
    setError(null);

    try {
      await saveProfile.mutateAsync({
        data: payload.data,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAeroProfileQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAeroDashboardQueryKey() }),
      ]);
      router.replace('/home');
    } catch (requestError) {
      const responseError =
        typeof requestError === 'object' &&
        requestError !== null &&
        'data' in requestError
          ? (requestError as { data?: { error?: unknown } }).data?.error
          : null;
      setError(
        typeof responseError === 'string'
          ? responseError
          : 'We could not save your setup. Check your connection and try again.',
      );
    }
  };

  if (!isAuthenticated) return null;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <LinearGradient
          colors={['#172515', '#0D130D', '#080B08']}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <ScreenFrame transparent contentStyle={styles.content}>
          <View style={styles.header}>
            <View style={styles.kickerRow}>
              <Eyebrow>FIRST, BE HONEST</Eyebrow>
              <View style={[styles.stepBadge, { borderColor: colors.border }]}>
                <Text style={[styles.stepText, { color: colors.primary }]}>
                  01 / 02
                </Text>
              </View>
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Put your scroll{'\n'}on the record.
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Pick your usual suspects and claim a handle. We will keep score;
              you can keep pretending it was only five minutes.
            </Text>
          </View>

          <Panel style={styles.panel}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Your battle handle
            </Text>
            <View
              style={[
                styles.inputWrap,
                { backgroundColor: colors.input, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={18}
                onChangeText={setUsername}
                placeholder="your_handle"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="done"
                style={[styles.input, { color: colors.foreground }]}
                value={username}
                accessibilityLabel="Your battle handle"
                testID="onboarding-username"
              />
            </View>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Friends will use this to find you.
            </Text>
          </Panel>

          <Panel style={styles.panel}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Pick your targets
            </Text>
            <View style={styles.chips}>
              {APP_CHOICES.map((app) => (
                <Chip
                  key={app}
                  label={app}
                  selected={targets.includes(app)}
                  onPress={() => toggleTarget(app)}
                />
              ))}
            </View>
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              You can change this anytime.
            </Text>
          </Panel>

          {error ? <ErrorNote>{error}</ErrorNote> : null}
          {profileQuery.isError ? (
            <ErrorNote>
              Your profile could not be checked. Your setup will still be saved
              when you continue.
            </ErrorNote>
          ) : null}
          <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{
                disabled: saveProfile.isPending || !targets.length,
              }}
              disabled={saveProfile.isPending || !targets.length}
              onPress={() => void submit()}
              onPressIn={() =>
                Animated.spring(ctaScale, {
                  toValue: 0.975,
                  useNativeDriver: true,
                  speed: 30,
                }).start()
              }
              onPressOut={() =>
                Animated.spring(ctaScale, {
                  toValue: 1,
                  useNativeDriver: true,
                  speed: 24,
                }).start()
              }
              testID="onboarding-submit"
              style={({ pressed }) => [
                styles.cta,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              {saveProfile.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Text
                    style={[styles.ctaText, { color: colors.primaryForeground }]}
                  >
                    Build my dashboard
                  </Text>
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={colors.primaryForeground}
                  />
                </>
              )}
            </Pressable>
          </Animated.View>
          <Text style={[styles.footer, { color: colors.mutedForeground }]}>
            No phone usage permissions are requested in this simulator build.
          </Text>
        </ScreenFrame>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 22 },
  header: { gap: 12, marginBottom: 8 },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 99,
    backgroundColor: 'rgba(201,255,85,0.06)',
  },
  stepText: { fontSize: 10, letterSpacing: 1.1, fontWeight: '800' },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1.4, fontWeight: '900' },
  copy: { fontSize: 14, lineHeight: 21, maxWidth: 360 },
  panel: {
    gap: 14,
    backgroundColor: 'rgba(18,23,17,0.92)',
    borderColor: 'rgba(201,255,85,0.12)',
  },
  fieldLabel: { fontSize: 14, fontWeight: '700' },
  inputWrap: {
    minHeight: 54,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  atSign: { fontSize: 16, fontWeight: '700', marginRight: 5 },
  input: { flex: 1, minHeight: 52, fontSize: 15, fontWeight: '600' },
  helper: { fontSize: 12, lineHeight: 17 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  cta: {
    minHeight: 58,
    borderRadius: 18,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { fontSize: 15, fontWeight: '800', letterSpacing: 0.1 },
  footer: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 330,
    alignSelf: 'center',
  },
});
