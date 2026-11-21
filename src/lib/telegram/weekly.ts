// The weekly Cron Trigger: a group post (top 10, Reto, opportunity) and a DM
// to George listing everyone who moved up a level that week.
import { formatTop, TOP_LIMIT } from './bot.ts';
import {
  type Activity,
  displayName,
  type Level,
  leaderboard,
  levelFor,
  levelRank,
  type MemberInfo,
} from './scoring.ts';
import {
  loadActivity,
  markQueueItemPosted,
  nextQueueItem,
  pruneProcessedUpdates,
  type QueueItem,
} from './store.ts';
import type { BotDeps } from './types.ts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const PROCESSED_UPDATES_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

/** The group post. Missing Reto or opportunity lines are left out. */
export const buildWeeklyPost = (
  topLines: string | null,
  reto: QueueItem | null,
  opportunity: QueueItem | null,
): string => {
  const sections = [
    `🏆 Top ${TOP_LIMIT} de la semana\n${topLines ?? 'Todavía no hay puntos. Manda tu primer /ship.'}`,
  ];
  if (reto) {
    sections.push(`🎯 Reto de la semana\n${reto.body}`);
  }
  if (opportunity) {
    sections.push(`💼 Oportunidad de la semana\n${opportunity.body}`);
  }
  return sections.join('\n\n');
};

export interface LevelUp {
  member: MemberInfo;
  from: Level;
  to: Level;
  links: string[];
}

/** Members whose level is higher now than a week ago. */
export const levelUps = (activity: Activity, now: Date): LevelUp[] => {
  const weekAgo = new Date(now.getTime() - WEEK_MS);
  const result: LevelUp[] = [];
  for (const member of activity.members) {
    const from = levelFor(activity, member.id, weekAgo);
    const to = levelFor(activity, member.id, now);
    if (levelRank(to) > levelRank(from)) {
      const links = activity.vouchedShips
        .filter(
          (ship) => ship.memberId === member.id && Date.parse(ship.vouchedAt) <= now.getTime(),
        )
        .map((ship) => ship.link);
      result.push({ member, from, to, links });
    }
  }
  return result;
};

export const buildDigest = (ups: LevelUp[]): string => {
  if (ups.length === 0) {
    return 'Resumen semanal: nadie subió de nivel esta semana.';
  }
  const lines = ups.map((up) => {
    const links = up.links.map((link) => `   ${link}`).join('\n');
    return `• ${displayName(up.member)}: ${up.from} → ${up.to}${links ? `\n${links}` : ''}`;
  });
  return `Resumen semanal: subieron de nivel\n${lines.join('\n')}`;
};

export const runWeekly = async (deps: BotDeps): Promise<void> => {
  const now = deps.now();
  const activity = await loadActivity(deps.db);
  const reto = await nextQueueItem(deps.db, 'reto');
  const opportunity = await nextQueueItem(deps.db, 'oportunidad');

  const post = buildWeeklyPost(formatTop(leaderboard(activity, now)), reto, opportunity);
  await deps.telegram.sendMessage(deps.config.groupId, post);
  for (const item of [reto, opportunity]) {
    if (item) {
      await markQueueItemPosted(deps.db, item.id, now);
    }
  }

  await deps.telegram.sendMessage(deps.config.georgeId, buildDigest(levelUps(activity, now)));
  await pruneProcessedUpdates(deps.db, new Date(now.getTime() - PROCESSED_UPDATES_RETENTION_MS));
};
