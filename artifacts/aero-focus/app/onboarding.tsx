import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActionButton, Chip, ErrorNote, Eyebrow, Panel } from '@/components/Primitives';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useGetAeroProfile, useSaveAeroProfile } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { getGetAeroDashboardQueryKey, getGetAeroProfileQueryKey } from '@workspace/api-client-react';

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
    const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
    if (!/^[a-z0-9_]{3,18}$/.test(cleanUsername)) {
      setError('Use 3–18 letters, numbers, or underscores for your username.');
      return;
    }
    if (!targets.length) {
      setError('Pick at least one app to put on the watch list.');
      return;
    }
    setError(null);

    try {
      await saveProfile.mutateAsync({
        data: {
          username: cleanUsername,
          targetApps: targets,
          onboardingComplete: true,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAeroProfileQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAeroDashboardQueryKey() }),
      ]);
      router.replace('/home');
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not save your setup. Try another username.',
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
      <ScreenFrame>
        <View style={styles.header}>
          <Eyebrow>FIRST, BE HONEST</Eyebrow>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Which apps are stealing your time?
          </Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            Pick the usual suspects. We will keep score; you keep making
            questionable choices.
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
        <ActionButton
          title="Build my dashboard"
          onPress={() => void submit()}
          loading={saveProfile.isPending}
          disabled={saveProfile.isPending || !targets.length}
          icon={<Feather name="arrow-right" size={17} color={colors.primaryForeground} />}
          testID="onboarding-submit"
        />
        <Text style={[styles.footer, { color: colors.mutedForeground }]}>
          No phone usage permissions are requested in this simulator build.
        </Text>
      </ScreenFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: 12, marginBottom: 8 },
  title: { fontSize: 29, lineHeight: 34, letterSpacing: -0.8, fontWeight: '800' },
  copy: { fontSize: 14, lineHeight: 21 },
  panel: { gap: 14 },
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
  footer: { fontSize: 11, textAlign: 'center', lineHeight: 16 },
});
