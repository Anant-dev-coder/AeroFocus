import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetAeroFriendsQueryKey,
  useAddAeroFriend,
  useGetAeroFriends,
  useGetAeroProfile,
} from '@workspace/api-client-react';
import { ActionButton, Chip, ErrorNote, Eyebrow, Panel } from '@/components/Primitives';
import { ScreenFrame } from '@/components/ScreenFrame';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/lib/auth';
import { useTracking } from '@/lib/tracking-context';

export default function BattlesScreen() {
  const colors = useColors();
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [username, setUsername] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const friendsQuery = useGetAeroFriends({
    query: { enabled: isAuthenticated, refetchInterval: 15_000 },
  });
  const profileQuery = useGetAeroProfile({ query: { enabled: isAuthenticated } });
  const addFriend = useAddAeroFriend();
  const { scrolls } = useTracking();
  const friends = friendsQuery.data?.friends ?? [];
  const handle = profileQuery.data?.profile?.username ?? 'you';

  useEffect(() => {
    if (!isAuthenticated) router.replace('/');
  }, [isAuthenticated]);

  const submitFriend = async () => {
    const clean = username.trim().replace(/^@/, '').toLowerCase();
    if (!clean) {
      setError('Enter your friend’s AeroFocus handle.');
      setNotice(null);
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await addFriend.mutateAsync({ data: { username: clean } });
      setUsername('');
      setNotice(`@${clean} is in your battle list.`);
      await queryClient.invalidateQueries({ queryKey: getGetAeroFriendsQueryKey() });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Could not add that friend. Check the username.',
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
      <ScreenFrame tabbed>
        <View style={styles.header}>
          <Eyebrow>FRIENDLY COMPETITION. HOSTILE NUMBERS.</Eyebrow>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Scroll Battles
          </Text>
          <Text style={[styles.copy, { color: colors.mutedForeground }]}>
            Add a handle. Compare today’s damage. The bigger number gets the
            crown nobody wants.
          </Text>
        </View>

        <Panel style={styles.addPanel}>
          <View style={styles.panelHead}>
            <View>
              <Eyebrow>ADD A RIVAL</Eyebrow>
              <Text style={[styles.panelTitle, { color: colors.foreground }]}>
                Know their handle?
              </Text>
            </View>
            <Feather name="user-plus" size={19} color={colors.primary} />
          </View>
          <View
            style={[
              styles.inputRow,
              { backgroundColor: colors.input, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.atSign, { color: colors.mutedForeground }]}>@</Text>
            <TextInput
              accessibilityLabel="Friend username"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setUsername}
              onSubmitEditing={() => void submitFriend()}
              placeholder="friend_handle"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="done"
              style={[styles.input, { color: colors.foreground }]}
              value={username}
              testID="friend-username"
            />
          </View>
          <ActionButton
            title="Add to battle"
            onPress={() => void submitFriend()}
            loading={addFriend.isPending}
            disabled={addFriend.isPending}
            icon={<Feather name="plus" size={16} color={colors.primaryForeground} />}
            testID="add-friend"
          />
          {error ? <ErrorNote>{error}</ErrorNote> : null}
          {notice ? (
            <Text style={[styles.success, { color: colors.primary }]}>{notice}</Text>
          ) : null}
        </Panel>

        <View style={styles.liveTitle}>
          <View>
            <Eyebrow>UPDATING EVERY 15 SECONDS</Eyebrow>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Today’s live battles
            </Text>
          </View>
          <View style={[styles.livePill, { backgroundColor: colors.secondary }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.liveText, { color: colors.secondaryForeground }]}>
              LIVE
            </Text>
          </View>
        </View>

        {friendsQuery.isLoading ? (
          <Panel style={styles.loadingPanel}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Finding your rivals…
            </Text>
          </Panel>
        ) : friendsQuery.isError ? (
          <Panel style={styles.loadingPanel}>
            <Text style={[styles.copy, { color: colors.accent }]}>
              Battle scores did not load.
            </Text>
            <Pressable onPress={() => void friendsQuery.refetch()}>
              <Text style={[styles.retry, { color: colors.primary }]}>Try again</Text>
            </Pressable>
          </Panel>
        ) : friends.length === 0 ? (
          <Panel style={styles.emptyPanel}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="users" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              No rivals. Suspiciously peaceful.
            </Text>
            <Text style={[styles.copy, { color: colors.mutedForeground }]}>
              Share @{handle} with a friend, then add their handle above. You
              need another player for the shame to work.
            </Text>
            <Chip
              label={`YOUR HANDLE · @${handle}`}
              selected
              onPress={() => undefined}
            />
          </Panel>
        ) : (
          friends.map((friend) => {
            const total = Math.max(scrolls, friend.scrolls, 1);
            const youLead = scrolls > friend.scrolls;
            const friendLeads = friend.scrolls > scrolls;
            const tie = scrolls === friend.scrolls;
            const maxWidth = Math.max(scrolls, friend.scrolls);
            const userWidth = `${Math.max(4, (scrolls / total) * 100)}%` as `${number}%`;
            const friendWidth = `${Math.max(4, (friend.scrolls / total) * 100)}%` as `${number}%`;

            return (
              <Panel key={friend.userId} style={styles.battlePanel}>
                <View style={styles.battleTop}>
                  <View>
                    <Eyebrow>LIVE BATTLE</Eyebrow>
                    <Text style={[styles.rivalName, { color: colors.foreground }]}>
                      @{handle} <Text style={{ color: colors.mutedForeground }}>vs</Text> @{friend.username}
                    </Text>
                  </View>
                  <Feather name="zap" size={18} color={colors.accent} />
                </View>

                <View style={styles.scoreLine}>
                  <Text style={[styles.scoreLabel, { color: colors.secondaryForeground }]}>
                    YOU · {scrolls}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: colors.secondaryForeground }]}>
                    @{friend.username} · {friend.scrolls}
                  </Text>
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
                  <View
                    style={[
                      styles.userBar,
                      { width: userWidth, backgroundColor: colors.primary },
                    ]}
                  />
                </View>
                <View style={[styles.barTrack, { backgroundColor: colors.secondary }]}>
                  <View
                    style={[
                      styles.friendBar,
                      { width: friendWidth, backgroundColor: colors.accent },
                    ]}
                  />
                </View>

                {tie ? (
                  <View style={[styles.resultBox, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                      Neck and neck. Both thumbs are implicated.
                    </Text>
                    <Text style={[styles.resultCopy, { color: colors.mutedForeground }]}>
                      First one to put the phone down wins.
                    </Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.resultBox,
                      {
                        backgroundColor: friendLeads
                          ? colors.accentForeground
                          : colors.secondary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.champion,
                        { color: friendLeads ? colors.accent : colors.primary },
                      ]}
                    >
                      BRAINROT CHAMPION · {friendLeads ? `@${friend.username}` : `@${handle}`}
                    </Text>
                    <Text style={[styles.resultCopy, { color: colors.secondaryForeground }]}>
                      {friendLeads
                        ? `@${friend.username} has the higher scroll count. You are losing to their thumb.`
                        : `You have the higher scroll count. @${friend.username} is doing the better job today.`}
                    </Text>
                  </View>
                )}
                <Text style={[styles.smallNote, { color: colors.mutedForeground }]}>
                  {maxWidth.toLocaleString()} scrolls is the current high score.
                </Text>
              </Panel>
            );
          })
        )}
      </ScreenFrame>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { gap: 11, marginBottom: 3 },
  title: { fontSize: 34, lineHeight: 38, letterSpacing: -1.2, fontWeight: '800' },
  copy: { fontSize: 13, lineHeight: 19 },
  addPanel: { gap: 13 },
  panelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { marginTop: 5, fontSize: 17, fontWeight: '700' },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 16,
  },
  atSign: { fontSize: 15, fontWeight: '700', marginRight: 5 },
  input: { flex: 1, minHeight: 50, fontSize: 14, fontWeight: '600' },
  success: { fontSize: 12, fontWeight: '700' },
  liveTitle: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 3 },
  sectionTitle: { marginTop: 5, fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 99 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },
  liveText: { fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  loadingPanel: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: 12 },
  retry: { fontSize: 12, fontWeight: '700' },
  emptyPanel: { alignItems: 'flex-start', gap: 12 },
  emptyIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15 },
  emptyTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  battlePanel: { gap: 15 },
  battleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rivalName: { fontSize: 14, fontWeight: '700', marginTop: 6 },
  scoreLine: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  scoreLabel: { fontSize: 10, fontWeight: '700' },
  barTrack: { height: 9, borderRadius: 99, overflow: 'hidden' },
  userBar: { height: 9, borderRadius: 99 },
  friendBar: { height: 9, borderRadius: 99 },
  resultBox: { borderRadius: 15, padding: 13, gap: 5 },
  champion: { fontSize: 9, letterSpacing: 1, fontWeight: '800' },
  resultTitle: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  resultCopy: { fontSize: 12, lineHeight: 18 },
  smallNote: { fontSize: 10, textAlign: 'right' },
});
