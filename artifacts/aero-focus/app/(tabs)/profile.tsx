import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAeroDashboardQueryKey,
  getGetAeroProfileQueryKey,
  useGetAeroProfile,
  useSaveAeroProfile,
} from '@workspace/api-client-react';
import { Chip, ErrorNote, Eyebrow, Panel } from '@/components/Primitives';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';

const APP_CHOICES = ['Instagram', 'TikTok', 'YouTube Shorts'] as const;
type TargetApp = (typeof APP_CHOICES)[number];

export default function ProfileScreen() {
  const colors = useColors();
  const { user, isAuthenticated, logout } = useAuth();
  const queryClient = useQueryClient();
  const profileQuery = useGetAeroProfile({
    query: { enabled: isAuthenticated },
  });
  const saveProfile = useSaveAeroProfile();
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const profile = profileQuery.data?.profile;

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const toggleApp = async (app: TargetApp) => {
    if (!profile) return;
    const currentTargets = profile.targetApps as TargetApp[];
    const nextTargets = currentTargets.includes(app)
      ? currentTargets.filter((target) => target !== app)
      : [...currentTargets, app];

    if (!nextTargets.length) {
      setSaveError('Keep at least one app on your watch list.');
      return;
    }

    setSaveError(null);
    setSavedNote(null);
    try {
      await saveProfile.mutateAsync({
        data: {
          username: profile.username,
          targetApps: nextTargets,
          onboardingComplete: true,
        },
      });
      setSavedNote('Watch list updated.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetAeroProfileQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetAeroDashboardQueryKey() }),
      ]);
    } catch (requestError) {
      setSaveError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not update your watch list.',
      );
    }
  };

  const signOut = async () => {
    queryClient.clear();
    await logout();
    router.replace('/');
  };

  if (!isAuthenticated) return null;

  return (
    <ScreenFrame tabbed>
      <View style={styles.header}>
        <Eyebrow>YOUR SETTINGS, YOUR CONSEQUENCES</Eyebrow>
        <Text style={[styles.title, { color: colors.foreground }]}>Your profile</Text>
      </View>

      <Panel style={styles.identityPanel}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
            {(profile?.username?.[0] ?? user?.firstName?.[0] ?? 'A').toUpperCase()}
          </Text>
        </View>
        <View style={styles.identity}>
          <Eyebrow>YOUR BATTLE HANDLE</Eyebrow>
          <Text style={[styles.handle, { color: colors.foreground }]}>
            @{profile?.username ?? 'loading'}
          </Text>
          <Text style={[styles.accountText, { color: colors.mutedForeground }]}>
            {user?.email ?? 'Signed-in account'}
          </Text>
        </View>
        {profileQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
      </Panel>

      <Panel style={styles.watchPanel}>
        <View style={styles.panelHeading}>
          <View>
            <Eyebrow>WATCH LIST</Eyebrow>
            <Text style={[styles.panelTitle, { color: colors.foreground }]}>
              The usual suspects
            </Text>
          </View>
          <Feather name="sliders" size={18} color={colors.primary} />
        </View>
        <View style={styles.chips}>
          {APP_CHOICES.map((app) => (
            <Chip
              key={app}
              label={app}
              selected={profile?.targetApps.includes(app) ?? false}
              onPress={() => void toggleApp(app)}
            />
          ))}
        </View>
        <Text style={[styles.helper, { color: colors.mutedForeground }]}>
          Changes save to your profile as soon as you tap.
        </Text>
        {saveProfile.isPending ? (
          <ActivityIndicator color={colors.primary} />
        ) : null}
        {saveError ? <ErrorNote>{saveError}</ErrorNote> : null}
        {savedNote ? (
          <Text style={[styles.success, { color: colors.primary }]}>{savedNote}</Text>
        ) : null}
      </Panel>

      <Panel style={styles.infoPanel}>
        <View style={styles.infoRow}>
          <Feather name="smartphone" size={16} color={colors.cyan} />
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
            Tracker data is simulated and stored to your account.
          </Text>
        </View>
        <View style={styles.infoRow}>
          <Feather name="shield" size={16} color={colors.cyan} />
          <Text style={[styles.infoText, { color: colors.secondaryForeground }]}>
            No other apps are monitored or blocked in this build.
          </Text>
        </View>
      </Panel>

      <Pressable
        accessibilityRole="button"
        onPress={() => void signOut()}
        style={({ pressed }) => [
          styles.logout,
          { borderColor: colors.border, opacity: pressed ? 0.68 : 1 },
        ]}
        testID="sign-out"
      >
        <Feather name="log-out" size={17} color={colors.accent} />
        <Text style={[styles.logoutText, { color: colors.accent }]}>Sign out</Text>
      </Pressable>
    </ScreenFrame>
  );
}

const styles = StyleSheet.create({
  header: { gap: 10, marginBottom: 4 },
  title: { fontSize: 33, lineHeight: 39, letterSpacing: -1, fontWeight: '800' },
  identityPanel: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  identity: { flex: 1, gap: 4 },
  handle: { fontSize: 17, fontWeight: '800' },
  accountText: { fontSize: 11 },
  watchPanel: { gap: 15 },
  panelHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 17, fontWeight: '700', marginTop: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  helper: { fontSize: 11, lineHeight: 16 },
  success: { fontSize: 12, fontWeight: '700' },
  infoPanel: { gap: 13 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 17,
  },
  logoutText: { fontSize: 14, fontWeight: '700' },
});
