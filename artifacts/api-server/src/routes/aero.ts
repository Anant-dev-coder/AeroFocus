import {
  AddAeroFriendBody,
  RecordAeroScrollsBody,
  SaveAeroProfileBody,
} from "@workspace/api-zod";
import {
  aeroDailyUsageTable,
  aeroFriendshipsTable,
  aeroProfilesTable,
  db,
} from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

function todayUtc(): string {
  return new Date().toISOString().slice(0, 10);
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

router.get("/aero/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const [profile] = await db
    .select({
      username: aeroProfilesTable.username,
      targetApps: aeroProfilesTable.targetApps,
      onboardingComplete: aeroProfilesTable.onboardingComplete,
    })
    .from(aeroProfilesTable)
    .where(eq(aeroProfilesTable.userId, req.user.id))
    .limit(1);

  res.json({
    profile: profile
      ? {
          ...profile,
          targetApps: profile.targetApps as string[],
        }
      : null,
  });
});

router.put("/aero/profile", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const parsed = SaveAeroProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check your username and target apps." });
    return;
  }

  const username = parsed.data.username.trim().replace(/^@/, "").toLowerCase();
  if (!/^[a-z0-9_]{3,18}$/.test(username)) {
    res.status(400).json({
      error: "Usernames must use 3–18 letters, numbers, or underscores.",
    });
    return;
  }

  try {
    const [profile] = await db
      .insert(aeroProfilesTable)
      .values({
        userId: req.user.id,
        username,
        targetApps: parsed.data.targetApps,
        onboardingComplete: parsed.data.onboardingComplete,
      })
      .onConflictDoUpdate({
        target: aeroProfilesTable.userId,
        set: {
          username,
          targetApps: parsed.data.targetApps,
          onboardingComplete: parsed.data.onboardingComplete,
          updatedAt: new Date(),
        },
      })
      .returning({
        username: aeroProfilesTable.username,
        targetApps: aeroProfilesTable.targetApps,
        onboardingComplete: aeroProfilesTable.onboardingComplete,
      });

    res.json({
      ...profile,
      targetApps: profile.targetApps as string[],
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: "That username is already taken." });
      return;
    }
    throw error;
  }
});

router.get("/aero/dashboard", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const day = todayUtc();
  const [usage] = await db
    .select({
      scrolls: aeroDailyUsageTable.scrolls,
      activeSeconds: aeroDailyUsageTable.activeSeconds,
    })
    .from(aeroDailyUsageTable)
    .where(
      and(
        eq(aeroDailyUsageTable.userId, req.user.id),
        eq(aeroDailyUsageTable.day, day),
      ),
    )
    .limit(1);
  const [profile] = await db
    .select({ targetApps: aeroProfilesTable.targetApps })
    .from(aeroProfilesTable)
    .where(eq(aeroProfilesTable.userId, req.user.id))
    .limit(1);

  res.json({
    scrolls: usage?.scrolls ?? 0,
    activeSeconds: usage?.activeSeconds ?? 0,
    targetApps: (profile?.targetApps as string[] | undefined) ?? [],
    day,
  });
});

router.post("/aero/scrolls", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const parsed = RecordAeroScrollsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid scroll activity." });
    return;
  }

  const day = todayUtc();
  const [usage] = await db
    .insert(aeroDailyUsageTable)
    .values({
      userId: req.user.id,
      day,
      scrolls: parsed.data.scrolls,
      activeSeconds: parsed.data.activeSeconds,
    })
    .onConflictDoUpdate({
      target: [aeroDailyUsageTable.userId, aeroDailyUsageTable.day],
      set: {
        scrolls: sql`${aeroDailyUsageTable.scrolls} + ${parsed.data.scrolls}`,
        activeSeconds: sql`${aeroDailyUsageTable.activeSeconds} + ${parsed.data.activeSeconds}`,
        updatedAt: new Date(),
      },
    })
    .returning({
      scrolls: aeroDailyUsageTable.scrolls,
      activeSeconds: aeroDailyUsageTable.activeSeconds,
    });

  res.json(usage);
});

router.get("/aero/friends", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const day = todayUtc();
  const rows = await db
    .select({
      userId: aeroProfilesTable.userId,
      username: aeroProfilesTable.username,
      scrolls: aeroDailyUsageTable.scrolls,
      activeSeconds: aeroDailyUsageTable.activeSeconds,
    })
    .from(aeroFriendshipsTable)
    .innerJoin(
      aeroProfilesTable,
      eq(aeroProfilesTable.userId, aeroFriendshipsTable.friendUserId),
    )
    .leftJoin(
      aeroDailyUsageTable,
      and(
        eq(aeroDailyUsageTable.userId, aeroProfilesTable.userId),
        eq(aeroDailyUsageTable.day, day),
      ),
    )
    .where(eq(aeroFriendshipsTable.userId, req.user.id))
    .orderBy(aeroProfilesTable.username);

  res.json({
    friends: rows.map((friend) => ({
      userId: friend.userId,
      username: friend.username,
      scrolls: friend.scrolls ?? 0,
      activeSeconds: friend.activeSeconds ?? 0,
    })),
  });
});

router.post("/aero/friends", async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }

  const parsed = AddAeroFriendBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Enter a valid AeroFocus username." });
    return;
  }

  const username = parsed.data.username.trim().replace(/^@/, "").toLowerCase();
  const [friendProfile] = await db
    .select({
      userId: aeroProfilesTable.userId,
      username: aeroProfilesTable.username,
    })
    .from(aeroProfilesTable)
    .where(eq(aeroProfilesTable.username, username))
    .limit(1);

  if (!friendProfile) {
    res.status(404).json({ error: "No AeroFocus user found with that name." });
    return;
  }
  if (friendProfile.userId === req.user.id) {
    res.status(400).json({ error: "You cannot battle yourself." });
    return;
  }

  await db
    .insert(aeroFriendshipsTable)
    .values([
      { userId: req.user.id, friendUserId: friendProfile.userId },
      { userId: friendProfile.userId, friendUserId: req.user.id },
    ])
    .onConflictDoNothing();

  const day = todayUtc();
  const [usage] = await db
    .select({
      scrolls: aeroDailyUsageTable.scrolls,
      activeSeconds: aeroDailyUsageTable.activeSeconds,
    })
    .from(aeroDailyUsageTable)
    .where(
      and(
        eq(aeroDailyUsageTable.userId, friendProfile.userId),
        eq(aeroDailyUsageTable.day, day),
      ),
    )
    .limit(1);

  res.json({
    friend: {
      ...friendProfile,
      scrolls: usage?.scrolls ?? 0,
      activeSeconds: usage?.activeSeconds ?? 0,
    },
  });
});

export default router;
