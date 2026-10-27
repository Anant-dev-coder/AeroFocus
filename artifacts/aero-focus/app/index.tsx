import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { KeyboardAvoidingView as KeyboardControllerView } from 'react-native-keyboard-controller';
import { ActionButton, ErrorNote, Eyebrow } from '@/components/Primitives';
import { ScreenFrame } from '@/components/ScreenFrame';
import { BrainVisual } from '@/components/BrainVisual';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useGetAeroProfile } from '@workspace/api-client-react';

export default function WelcomeScreen() {
  const colors = useColors();
  const {
    isAuthenticated,
    isLoading: authLoading,
    isReady,
    isLoginPending,
    error: authError,
    login,
  } = useAuth();
  const profile = useGetAeroProfile({
    query: { enabled: isAuthenticated },
  });

  useEffect(() => {
    if (!isAuthenticated || profile.isLoading || profile.isError) return;
    router.replace(
      profile.data?.profile?.onboardingComplete ? '/home' : '/onboarding',
    );
  }, [
    isAuthenticated,
    profile.data?.profile?.onboardingComplete,
    profile.isError,
    profile.isLoading,
  ]);

  const waiting =
    authLoading ||
    (isAuthenticated && profile.isLoading) ||
    (isAuthenticated && !profile.isError);

  return (
    <KeyboardControllerView
      style={styles.keyboardFrame}
      behavior={Platform.OS === 'web' ? undefined : 'padding'}
      keyboardVerticalOffset={0}
    >
      <ScreenFrame contentStyle={styles.screen}>
        <View style={styles.brandLine}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.icon}
            accessibilityLabel="AeroFocus icon"
          />
          <View>
            <Text style={[styles.brand, { color: colors.foreground }]}>
              AEROFOCUS
            </Text>
            <Text style={[styles.brandTag, { color: colors.mutedForeground }]}>
              ATTENTION RECOVERY
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <Eyebrow>THE FEED IS NOT YOUR FRIEND</Eyebrow>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            Your thumb is busy.{'\n'}
            <Text style={{ color: colors.primary }}>Your life is waiting.</Text>
          </Text>
          <Text style={[styles.subhead, { color: colors.mutedForeground }]}>
            Track the doomscroll. Watch your brain decay. Get roasted before
            another hour disappears.
          </Text>
        </View>

        <View style={styles.brainSpot}>
          <BrainVisual scrolls={0} size={242} />
          <View
            style={[
              styles.brainTag,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.brainTagText, { color: colors.secondaryForeground }]}>
              CURRENT BRAIN STATUS · ALLEGEDLY FINE
            </Text>
          </View>
        </View>

        {authError ? <ErrorNote>{authError}</ErrorNote> : null}
        {profile.isError ? (
          <ErrorNote>
            We could not load your profile. Check your connection and try again.
          </ErrorNote>
        ) : null}

        <ActionButton
          title={isLoginPending ? 'Opening sign-in…' : 'Get started'}
          onPress={() => void login()}
          disabled={!isReady || authLoading || isAuthenticated}
          loading={waiting || isLoginPending}
          icon={
            !waiting && !isLoginPending ? (
              <Feather name="arrow-up-right" size={18} color={colors.primaryForeground} />
            ) : undefined
          }
          testID="welcome-continue"
        />

        {profile.isError ? (
          <ActionButton
            title="Retry"
            onPress={() => void profile.refetch()}
            secondary
          />
        ) : null}

        <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>
          First run uses a clearly labeled simulator. Device-level usage tracking
          is not enabled.
        </Text>
      </ScreenFrame>
    </KeyboardControllerView>
  );
}

const styles = StyleSheet.create({
  keyboardFrame: { flex: 1 },
  screen: { flexGrow: 1, justifyContent: 'space-between', gap: 0 },
  brandLine: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 42, height: 42, borderRadius: 12 },
  brand: { fontSize: 13, letterSpacing: 2.1, fontWeight: '800' },
  brandTag: { fontSize: 8, letterSpacing: 1.2, marginTop: 3, fontWeight: '700' },
  hero: { gap: 13, marginTop: 34 },
  headline: {
    fontSize: 36,
    lineHeight: 41,
    letterSpacing: -1.5,
    fontWeight: '800',
  },
  subhead: { fontSize: 15, lineHeight: 23, maxWidth: 340 },
  brainSpot: { alignItems: 'center', justifyContent: 'center', marginVertical: 12 },
  brainTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 99,
    borderWidth: 1,
    marginTop: -2,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  brainTagText: { fontSize: 9, letterSpacing: 0.65, fontWeight: '700' },
  disclaimer: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    paddingHorizontal: 12,
    marginTop: 3,
  },
});
