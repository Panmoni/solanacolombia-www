// Reputation scoring. Pure functions over the stored activity, evaluated as of
// a given moment, so levels can be compared week over week.
//
// Points: a vouched ship is worth 10 to its author, a vouch given is worth 1 to
// the voucher, a gracias received is worth 2. Points older than 90 days count
// half. Chat messages and reactions earn nothing.

export const SHIP_POINTS = 10;
export const VOUCH_GIVEN_POINTS = 1;
export const THANKS_RECEIVED_POINTS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;
export const DECAY_WINDOW_MS = 90 * DAY_MS;

export const LEVELS = ['Visitante', 'Constructor', 'Shipper', 'Núcleo'] as const;
export type Level = (typeof LEVELS)[number];

export interface MemberInfo {
  id: number;
  username: string | null;
  firstName: string | null;
}

/** Everything that earns points, as stored. Timestamps are ISO strings. */
export interface Activity {
  members: MemberInfo[];
  /** A ship counts from the moment it is vouched. */
  vouchedShips: { memberId: number; link: string; vouchedAt: string }[];
  vouchesGiven: { memberId: number; at: string }[];
  thanksReceived: { memberId: number; at: string }[];
}

export interface MemberScore {
  member: MemberInfo;
  points: number;
  level: Level;
}

const weighted = (base: number, at: string, asOf: Date): number => {
  const time = Date.parse(at);
  if (time > asOf.getTime()) {
    return 0;
  }
  return asOf.getTime() - time > DECAY_WINDOW_MS ? base / 2 : base;
};

export const pointsFor = (activity: Activity, memberId: number, asOf: Date): number => {
  let points = 0;
  for (const ship of activity.vouchedShips) {
    if (ship.memberId === memberId) {
      points += weighted(SHIP_POINTS, ship.vouchedAt, asOf);
    }
  }
  for (const vouch of activity.vouchesGiven) {
    if (vouch.memberId === memberId) {
      points += weighted(VOUCH_GIVEN_POINTS, vouch.at, asOf);
    }
  }
  for (const thanks of activity.thanksReceived) {
    if (thanks.memberId === memberId) {
      points += weighted(THANKS_RECEIVED_POINTS, thanks.at, asOf);
    }
  }
  return points;
};

/**
 * Constructor = 1 vouched ship, Shipper = 3, Núcleo = 3+ vouched ships in the
 * last 90 days plus 3+ gracias received (all time).
 */
export const levelFor = (activity: Activity, memberId: number, asOf: Date): Level => {
  const now = asOf.getTime();
  let ships = 0;
  let recentShips = 0;
  for (const ship of activity.vouchedShips) {
    const time = Date.parse(ship.vouchedAt);
    if (ship.memberId !== memberId || time > now) {
      continue;
    }
    ships += 1;
    if (now - time <= DECAY_WINDOW_MS) {
      recentShips += 1;
    }
  }
  const thanks = activity.thanksReceived.filter(
    (entry) => entry.memberId === memberId && Date.parse(entry.at) <= now,
  ).length;

  if (recentShips >= 3 && thanks >= 3) {
    return 'Núcleo';
  }
  if (ships >= 3) {
    return 'Shipper';
  }
  if (ships >= 1) {
    return 'Constructor';
  }
  return 'Visitante';
};

export const levelRank = (level: Level): number => LEVELS.indexOf(level);

/** Every member with points, highest first; ties break on member id. */
export const leaderboard = (activity: Activity, asOf: Date): MemberScore[] =>
  activity.members
    .map((member) => ({
      member,
      points: pointsFor(activity, member.id, asOf),
      level: levelFor(activity, member.id, asOf),
    }))
    .filter((score) => score.points > 0)
    .sort((a, b) => b.points - a.points || a.member.id - b.member.id);

/** 12 → "12", 12.5 → "12.5". */
export const formatPoints = (points: number): string =>
  Number.isInteger(points) ? String(points) : points.toFixed(1);

export const displayName = (member: MemberInfo): string =>
  member.username ? `@${member.username}` : (member.firstName ?? `usuario ${member.id}`);
