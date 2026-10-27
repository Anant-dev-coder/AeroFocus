import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import * as Haptics from 'expo-haptics';
import {
  getGetAeroDashboardQueryKey,
  useGetAeroDashboard,
  useRecordAeroScrolls,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { ROAST_THRESHOLDS, getRoastAtThreshold } from '@/constants/roasts';
import { useAuth } from '@/lib/auth';

interface RoastAlert {
  scrolls: number;
  message: string;
}

interface TrackingContextValue {
  scrolls: number;
  activeSeconds: number;
  sessionSeconds: number;
  targetApps: string[];
  isTracking: boolean;
  isLoading: boolean;
  error: string | null;
  roast: RoastAlert | null;
  startTracking: () => void;
  pauseTracking: () => void;
  addScroll: () => Promise<void>;
  dismissRoast: () => void;
  refresh: () => Promise<void>;
}

const TrackingContext = createContext<TrackingContextValue | null>(null);
const TRACKER_TICK_SECONDS = 20;

export function TrackingProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const dashboard = useGetAeroDashboard({
    query: { enabled: isAuthenticated, refetchInterval: 30_000 },
  });
  const recordMutation = useRecordAeroScrolls();
  const [scrolls, setScrolls] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [pendingSeconds, setPendingSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [roast, setRoast] = useState<RoastAlert | null>(null);
  const scrollsRef = useRef(0);
  const pendingSecondsRef = useRef(0);
  const recordScrollRef = useRef<(activeSeconds: number) => Promise<void>>(
    async () => undefined,
  );
  const dashboardKey = getGetAeroDashboardQueryKey();

  useEffect(() => {
    scrollsRef.current = dashboard.data?.scrolls ?? 0;
    setScrolls(dashboard.data?.scrolls ?? 0);
  }, [dashboard.data?.scrolls, user?.id]);

  useEffect(() => {
    setIsTracking(false);
    setSessionSeconds(0);
    setPendingSeconds(0);
    pendingSecondsRef.current = 0;
    scrollsRef.current = dashboard.data?.scrolls ?? 0;
    setScrolls(dashboard.data?.scrolls ?? 0);
    setRoast(null);
  }, [user?.id]);

  const recordScroll = useCallback(
    async (activeSeconds: number) => {
      const previousCount = scrollsRef.current;
      const nextCount = previousCount + 1;
      scrollsRef.current = nextCount;
      setScrolls(nextCount);
      setError(null);

      const crossedThreshold = ROAST_THRESHOLDS.find(
        (threshold) => previousCount < threshold && nextCount >= threshold,
      );
      if (crossedThreshold) {
        setRoast({
          scrolls: crossedThreshold,
          message: getRoastAtThreshold(crossedThreshold),
        });
      }

      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );

      try {
        const saved = await recordMutation.mutateAsync({
          data: { scrolls: 1, activeSeconds },
        });
        const committedCount = Math.max(scrollsRef.current, saved.scrolls);
        scrollsRef.current = committedCount;
        setScrolls(committedCount);
        queryClient.setQueryData(
          dashboardKey,
          (current: typeof dashboard.data) =>
            current
              ? {
                  ...current,
                  scrolls: Math.max(current.scrolls, saved.scrolls),
                  activeSeconds: Math.max(
                    current.activeSeconds,
                    saved.activeSeconds,
                  ),
                }
              : current,
        );
        await queryClient.invalidateQueries({ queryKey: dashboardKey });
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Your scroll count could not be saved.',
        );
        void dashboard.refetch();
      }
    },
    [dashboard, dashboardKey, queryClient, recordMutation],
  );

  useEffect(() => {
    recordScrollRef.current = recordScroll;
  }, [recordScroll]);

  useEffect(() => {
    if (!isTracking || !isAuthenticated) return undefined;

    const timer = setInterval(() => {
      setSessionSeconds((current) => current + 1);
      const nextPendingSeconds = pendingSecondsRef.current + 1;
      if (nextPendingSeconds >= TRACKER_TICK_SECONDS) {
        pendingSecondsRef.current = 0;
        setPendingSeconds(0);
        void recordScrollRef.current(TRACKER_TICK_SECONDS);
      } else {
        pendingSecondsRef.current = nextPendingSeconds;
        setPendingSeconds(nextPendingSeconds);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isAuthenticated, isTracking]);

  const startTracking = useCallback(() => {
    setError(null);
    setIsTracking(true);
  }, []);

  const pauseTracking = useCallback(() => {
    setIsTracking(false);
  }, []);

  const addScroll = useCallback(async () => {
    await recordScroll(0);
  }, [recordScroll]);

  const dismissRoast = useCallback(() => setRoast(null), []);
  const refresh = useCallback(async () => {
    await dashboard.refetch();
  }, [dashboard]);

  const value = useMemo<TrackingContextValue>(
    () => ({
      scrolls,
      activeSeconds: (dashboard.data?.activeSeconds ?? 0) + pendingSeconds,
      sessionSeconds,
      targetApps: dashboard.data?.targetApps ?? [],
      isTracking,
      isLoading: dashboard.isLoading,
      error,
      roast,
      startTracking,
      pauseTracking,
      addScroll,
      dismissRoast,
      refresh,
    }),
    [
      scrolls,
      dashboard.data?.activeSeconds,
      dashboard.data?.targetApps,
      dashboard.isLoading,
      pendingSeconds,
      sessionSeconds,
      isTracking,
      error,
      roast,
      startTracking,
      pauseTracking,
      addScroll,
      dismissRoast,
      refresh,
    ],
  );

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking(): TrackingContextValue {
  const context = useContext(TrackingContext);
  if (!context) {
    throw new Error('useTracking must be used within TrackingProvider.');
  }
  return context;
}
