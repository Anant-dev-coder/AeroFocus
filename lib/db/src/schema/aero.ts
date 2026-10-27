import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessionsTable = pgTable("sessions", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { withTimezone: true }).notNull(),
});

export const aeroProfilesTable = pgTable("aero_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  targetApps: jsonb("target_apps").$type<string[]>().notNull(),
  onboardingComplete: boolean("onboarding_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aeroDailyUsageTable = pgTable(
  "aero_daily_usage",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    scrolls: integer("scrolls").notNull().default(0),
    activeSeconds: integer("active_seconds").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.day] })],
);

export const aeroFriendshipsTable = pgTable(
  "aero_friendships",
  {
    userId: text("user_id")
      .notNull()
      .references(() => aeroProfilesTable.userId, { onDelete: "cascade" }),
    friendUserId: text("friend_user_id")
      .notNull()
      .references(() => aeroProfilesTable.userId, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.friendUserId] }),
  ],
);
