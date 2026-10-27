import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActionButton, Chip, Eyebrow, Panel } from '@/components/Primitives';
import { BrainVisual, brainStageForScrolls, brainStageName } from '@/components/BrainVisual';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useTracking } from '@/lib/tracking-context';
import { useGetAeroProfile } from '@workspace/api-client-react';

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  if (minutes < 60) return `${minutes}m ${String(remaining).padStart(2, '0')}s`;
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, '0')}m`;
}

function RoastModal({
  visible,
  scrolls,
  message,
  onClose,
}: {
  visible: boolean;
  scrolls: number;
  message: string;
  onClose: () => void;
}) {
  const colors = useColors();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalShade, { backgroundColor: colors.overlay }]}>
        <Panel style={styles.roastPanel}>
          <View style={styles.roastTop}>
            <View style={[styles.roastIcon, { backgroundColor: colors.accent }]}>
              <Feather name="alert-triangle" size={18} color={colors.accentForeground} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Dismiss roast"
              onPress={onClose}
              hitSlop={12}
              style={styles.closeButton}
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>
          <Eyebrow>SCROLL MILESTONE · {scrolls}</Eyebrow>
          <Text style={[styles.roastTitle, { color: colors.foreground }]}>
            Brain status update.
          </Text>
          <Text style={[styles.roastMessage, { color: colors.secondaryForeground }]}>
            {message}
          </Text>
          <ActionButton title="I heard you" onPress={onClose} />
        </Panel>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const profile = useGetAeroProfile({ query: { enabled: isAuthenticated } });
  const {
    scrolls,
    activeSeconds,
    sessionSeconds,
    targetApps,
    isTracking,
    isLoading,
    error,
    roast,
    startTracking,
    pauseTracking,
    addScroll,
    dismissRoast,
    refresh,
  } = useTracking();
  const stage = brainStageForScrolls(scrolls);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const stageColor = [
    colors.brainHealthy,
    colors.brainTired,
    colors.brainStrained,
    colors.brainCracked,
    colors.brainRotted,
  ][stage];

  if (!isAuthenticated) return null;

  return (
    <>
      <ScreenFrame tabbed>
        <View style={styles.topbar}>
          <View>
            <Text style={[styles.brand, { color: colors.foreground }]}>AEROFOCUS</Text>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {profile.data?.profile?.username
                ? `@${profile.data.profile.username}`
                : 'ATTENTION RECOVERY'}
            </Text>
          </View>
          <View
            style={[
              styles.simulationBadge,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
          >
            <View style={[styles.badgeDot, { backgroundColor: isTracking ? colors.primary : colors.mutedForeground }]} />
            <Text style={[styles.badgeText, { color: colors.secondaryForeground }]}>
              SIMULATED
            </Text>
          </View>
        </View>

        <View style={styles.headlineArea}>
          <Eyebrow>THE DAILY TOLL</Eyebrow>
          <Text style={[styles.headline, { color: colors.foreground }]}>
            You vs. your{'\n'}own thumb.
          </Text>
        </View>

        <Panel style={styles.brainPanel}>
          <View style={styles.brainHeading}>
            <View>
              <Eyebrow>BRAIN DECAY METER</Eyebrow>
              <Text style={[styles.brainState, { color: stageColor }]}>
                {brainStageName(stage)}
              </Text>
            </View>
            <View style={[styles.stageCounter, { borderColor: colors.border }]}>
              <Text style={[styles.stageNumber, { color: colors.foreground }]}>
                0{stage + 1}
              </Text>
              <Text style={[styles.stageSlash, { color: colors.mutedForeground }]}> / 05</Text>
            </View>
          </View>
          <View style={styles.brainArt}>
            <BrainVisual scrolls={scrolls} size={220} />
          </View>
          <View style={styles.decayTrack}>
            {[0, 1, 2, 3, 4].map((part) => (
              <View
                key={part}
                style={[
                  styles.decaySegment,
                  {
                    backgroundColor: part <= stage ? stageColor : colors.secondary,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.brainCaption, { color: colors.mutedForeground }]}>
            Scroll count changes the brain. This is a simulator, not device usage data.
          </Text>
        </Panel>

        <View style={styles.metrics}>
          <Panel
            style={[
              styles.metricPanel,
              { borderColor: colors.primary, borderWidth: 1 },
            ]}
          >
            <Eyebrow>SCROLLS TODAY</Eyebrow>
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={[styles.metricValue, { color: colors.primary }]}>
                {scrolls.toLocaleString()}
              </Text>
            )}
            <Text style={[styles.metricFoot, { color: colors.mutedForeground }]}>
              {isTracking ? 'counting live' : 'simulated total'}
            </Text>
          </Panel>
          <Panel style={styles.metricPanel}>
            <Eyebrow>SCREEN TIME</Eyebrow>
            <Text style={[styles.metricValueSmall, { color: colors.foreground }]}>
              {formatDuration(activeSeconds)}
            </Text>
            <Text style={[styles.metricFoot, { color: colors.mutedForeground }]}>
              session {formatDuration(sessionSeconds)}
            </Text>
          </Panel>
        </View>

        <Panel style={styles.trackerPanel}>
          <View style={styles.trackerHeading}>
            <View>
              <Eyebrow>MOCK OVERLAY TRACKER</Eyebrow>
              <Text style={[styles.trackerTitle, { color: colors.foreground }]}>
                {isTracking ? 'Your thumb is on the clock.' : 'Ready when you are.'}
              </Text>
            </View>
            <View style={[styles.fab, { backgroundColor: colors.primary }]}>
              <Feather
                name={isTracking ? 'activity' : 'play'}
                size={18}
                color={colors.primaryForeground}
              />
            </View>
          </View>
          <View style={styles.targetRow}>
            {targetApps.length ? (
              targetApps.map((app) => (
                <Chip key={app} label={app} selected onPress={() => undefined} />
              ))
            ) : (
              <Text style={[styles.metricFoot, { color: colors.mutedForeground }]}>
                No target apps selected.
              </Text>
            )}
          </View>
          <View style={styles.actions}>
            <ActionButton
              title={isTracking ? 'Pause tracker' : 'Start tracker'}
              onPress={isTracking ? pauseTracking : startTracking}
              icon={
                <Feather
                  name={isTracking ? 'pause' : 'play'}
                  size={16}
                  color={colors.primaryForeground}
                />
              }
              style={styles.flexButton}
              testID="tracker-toggle"
            />
            <ActionButton
              title="Log scroll"
              onPress={() => void addScroll()}
              secondary
              icon={<Feather name="plus" size={16} color={colors.secondaryForeground} />}
              style={styles.flexButton}
              testID="add-scroll"
            />
          </View>
        </Panel>

        {error ? (
          <Panel style={styles.errorPanel}>
            <Text style={[styles.errorText, { color: colors.accent }]}>{error}</Text>
            <Pressable onPress={() => void refresh()} accessibilityRole="button">
              <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
            </Pressable>
          </Panel>
        ) : null}

        <View style={styles.footer}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            The floating control is simulated. No other apps are monitored.
          </Text>
        </View>
      </ScreenFrame>

      <RoastModal
        visible={!!roast}
        scrolls={roast?.scrolls ?? 0}
        message={roast?.message ?? ''}
        onClose={dismissRoast}
      />
    </>
  );
}

const styles = StyleSheet.create({
  topbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { fontSize: 12, letterSpacing: 2, fontWeight: '800' },
  greeting: { marginTop: 4, fontSize: 10, letterSpacing: 1, fontWeight: '600' },
  simulationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  headlineArea: { gap: 9, marginTop: 10, marginBottom: 2 },
  headline: { fontSize: 34, lineHeight: 38, fontWeight: '800', letterSpacing: -1.2 },
  brainPanel: { gap: 14, padding: 16 },
  brainHeading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  brainState: { marginTop: 6, fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
  stageCounter: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  stageNumber: { fontSize: 12, fontWeight: '800' },
  stageSlash: { fontSize: 10 },
  brainArt: { alignItems: 'center', marginTop: -3, marginBottom: -4 },
  decayTrack: { flexDirection: 'row', gap: 5 },
  decaySegment: { flex: 1, height: 5, borderRadius: 99 },
  brainCaption: { textAlign: 'center', fontSize: 10, lineHeight: 15 },
  metrics: { flexDirection: 'row', gap: 11 },
  metricPanel: { flex: 1, gap: 8, minHeight: 116, justifyContent: 'space-between' },
  metricValue: { fontSize: 31, letterSpacing: -1.1, fontWeight: '800' },
  metricValueSmall: { fontSize: 22, letterSpacing: -0.6, fontWeight: '800', marginTop: 9 },
  metricFoot: { fontSize: 11, lineHeight: 15 },
  trackerPanel: { gap: 16 },
  trackerHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  trackerTitle: { marginTop: 6, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  fab: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  targetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  actions: { flexDirection: 'row', gap: 9 },
  flexButton: { flex: 1, minHeight: 49, paddingHorizontal: 9 },
  errorPanel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18 },
  retryText: { fontSize: 12, fontWeight: '700' },
  footer: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', paddingHorizontal: 3 },
  footerText: { flex: 1, fontSize: 10, lineHeight: 15 },
  modalShade: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  roastPanel: { width: '100%', maxWidth: 390, gap: 13, padding: 21 },
  roastTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roastIcon: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  closeButton: { padding: 4 },
  roastTitle: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  roastMessage: { fontSize: 15, lineHeight: 23, marginBottom: 5 },
});
