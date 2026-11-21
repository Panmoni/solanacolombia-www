// Handles one Telegram update for the Solana Colombia group. Commands work in
// the group only; everything else the bot receives is ignored.
import { markdownToTelegramHtml } from './format.ts';
import {
  displayName,
  formatPoints,
  leaderboard,
  levelFor,
  type MemberInfo,
  pointsFor,
} from './scoring.ts';
import {
  countVouchedShips,
  findMemberByUsername,
  getMember,
  insertShip,
  insertThanksIfAllowed,
  insertVouch,
  isUpdateProcessed,
  latestUnvouchedShip,
  loadActivity,
  markJoined,
  markUpdateProcessed,
  recordJoinMessage,
  shipVouchedByMessage,
  thanksExistsForMessage,
  upsertMember,
} from './store.ts';
import type { BotDeps, TgMessage, TgUpdate, TgUser } from './types.ts';

export const TOP_LIMIT = 10;

export const REPLIES = {
  shipNeedsLink: 'Para registrar un ship necesito un link público: /ship https://…',
  shipRecorded: 'Ship registrado ✅ Cuenta cuando alguien con un ship confirmado le dé /vouch.',
  shipVideoConsent: 'Gracias por dejarnos mostrarlo en videos 🎬',
  vouchUsage: 'Usa /vouch @usuario.',
  vouchSelf: 'No puedes darte /vouch a ti mismo.',
  vouchNotEligible:
    'Tu /vouch cuenta cuando tengas un ship confirmado. Manda el tuyo con /ship <link>.',
  graciasUsage: 'Usa /gracias @usuario.',
  graciasSelf: 'No puedes darte las gracias a ti mismo.',
  topEmpty: 'Todavía no hay puntos. Manda tu primer /ship.',
} as const;

const unknownMember = (mention: string): string =>
  `No conozco a ${mention} todavía. Tiene que haber escrito en el grupo.`;

interface Command {
  name: string;
  args: string;
}

/** `/Ship@SolanaColombiaBot https://x` → { name: 'ship', args: 'https://x' }. */
export const parseCommand = (text: string): Command | null => {
  const match = text.match(/^\/([A-Za-z0-9_]+)(?:@[A-Za-z0-9_]+)?(?:\s+([\s\S]*))?$/);
  if (!match) {
    return null;
  }
  return { name: match[1].toLowerCase(), args: (match[2] ?? '').trim() };
};

const isHttpUrl = (token: string): boolean => {
  if (!/^https?:\/\//i.test(token)) {
    return false;
  }
  try {
    const url = new URL(token);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

export interface ParsedShip {
  link: string;
  videoConsent: boolean;
  note: string | null;
}

/** Finds the first http(s) link; a separate `video` word records video consent. */
export const parseShipArgs = (args: string): ParsedShip | null => {
  const tokens = args.split(/\s+/).filter(Boolean);
  const linkIndex = tokens.findIndex(isHttpUrl);
  if (linkIndex === -1) {
    return null;
  }
  const rest = tokens.filter((_, index) => index !== linkIndex);
  const videoConsent = rest.some((token) => token.toLowerCase() === 'video');
  const note = rest.filter((token) => token.toLowerCase() !== 'video').join(' ');
  return { link: tokens[linkIndex], videoConsent, note: note || null };
};

type Target =
  | { kind: 'member'; member: MemberInfo }
  | { kind: 'unknown'; mention: string }
  | { kind: 'none' };

/**
 * The member a /vouch or /gracias points at: a text mention, an @username the
 * bot has seen, or the author of the replied-to message.
 */
const resolveTarget = async (deps: BotDeps, message: TgMessage): Promise<Target> => {
  const text = message.text ?? '';
  for (const entity of message.entities ?? []) {
    if (entity.type === 'text_mention' && entity.user && !entity.user.is_bot) {
      await upsertMember(deps.db, entity.user, deps.now());
      return { kind: 'member', member: userInfo(entity.user) };
    }
    if (entity.type === 'mention') {
      const mention = text.slice(entity.offset, entity.offset + entity.length);
      const member = await findMemberByUsername(deps.db, mention.replace(/^@/, ''));
      return member ? { kind: 'member', member } : { kind: 'unknown', mention };
    }
  }
  const repliedTo = message.reply_to_message?.from;
  if (repliedTo && !repliedTo.is_bot) {
    await upsertMember(deps.db, repliedTo, deps.now());
    return { kind: 'member', member: userInfo(repliedTo) };
  }
  return { kind: 'none' };
};

const userInfo = (user: TgUser): MemberInfo => ({
  id: user.id,
  username: user.username ?? null,
  firstName: user.first_name,
});

const reply = (deps: BotDeps, message: TgMessage, text: string) =>
  deps.telegram.sendMessage(message.chat.id, text, { replyTo: message.message_id });

const handleShip = async (deps: BotDeps, message: TgMessage, from: TgUser, args: string) => {
  const ship = parseShipArgs(args);
  if (!ship) {
    await reply(deps, message, REPLIES.shipNeedsLink);
    return;
  }
  await insertShip(
    deps.db,
    { memberId: from.id, messageId: message.message_id, ...ship },
    deps.now(),
  );
  const text = ship.videoConsent
    ? `${REPLIES.shipRecorded}\n${REPLIES.shipVideoConsent}`
    : REPLIES.shipRecorded;
  await reply(deps, message, text);
};

const handleVouch = async (deps: BotDeps, message: TgMessage, from: TgUser) => {
  const target = await resolveTarget(deps, message);
  if (target.kind === 'none') {
    await reply(deps, message, REPLIES.vouchUsage);
    return;
  }
  if (target.kind === 'unknown') {
    await reply(deps, message, unknownMember(target.mention));
    return;
  }
  if (target.member.id === from.id) {
    await reply(deps, message, REPLIES.vouchSelf);
    return;
  }
  const isGeorge = from.id === deps.config.georgeId;
  if (!isGeorge && (await countVouchedShips(deps.db, from.id)) < 1) {
    await reply(deps, message, REPLIES.vouchNotEligible);
    return;
  }
  const name = displayName(target.member);
  const confirmed = await shipVouchedByMessage(deps.db, message.message_id);
  if (confirmed) {
    // A redelivery of a /vouch that already counted: answer it again.
    await reply(deps, message, `✅ Vouch registrado para el ship de ${name}: ${confirmed.link}`);
    return;
  }
  const ship = await latestUnvouchedShip(deps.db, target.member.id);
  const vouch = ship && { shipId: ship.id, voucherId: from.id, messageId: message.message_id };
  if (!(ship && vouch && (await insertVouch(deps.db, vouch, deps.now())))) {
    await reply(deps, message, `${name} no tiene ships pendientes de /vouch.`);
    return;
  }
  await reply(deps, message, `✅ Vouch registrado para el ship de ${name}: ${ship.link}`);
};

const handleGracias = async (deps: BotDeps, message: TgMessage, from: TgUser) => {
  const target = await resolveTarget(deps, message);
  if (target.kind === 'none') {
    await reply(deps, message, REPLIES.graciasUsage);
    return;
  }
  if (target.kind === 'unknown') {
    await reply(deps, message, unknownMember(target.mention));
    return;
  }
  if (target.member.id === from.id) {
    await reply(deps, message, REPLIES.graciasSelf);
    return;
  }
  const name = displayName(target.member);
  const credited =
    (await thanksExistsForMessage(deps.db, message.message_id)) ||
    (await insertThanksIfAllowed(
      deps.db,
      { fromId: from.id, toId: target.member.id, messageId: message.message_id },
      deps.now(),
    ));
  await reply(
    deps,
    message,
    credited
      ? `🙏 Gracias registradas para ${name}.`
      : `Ya le diste las gracias a ${name} en los últimos 7 días.`,
  );
};

export const formatRep = (member: MemberInfo, points: number, level: string): string =>
  `${displayName(member)}: ${formatPoints(points)} puntos · nivel ${level}`;

const handleRep = async (deps: BotDeps, message: TgMessage, from: TgUser) => {
  const activity = await loadActivity(deps.db);
  const now = deps.now();
  const text = formatRep(
    userInfo(from),
    pointsFor(activity, from.id, now),
    levelFor(activity, from.id, now),
  );
  await reply(deps, message, text);
};

/** The top 10 lines, or null when nobody has points yet. */
export const formatTop = (scores: ReturnType<typeof leaderboard>): string | null => {
  if (scores.length === 0) {
    return null;
  }
  return scores
    .slice(0, TOP_LIMIT)
    .map(
      (score, index) =>
        `${index + 1}. ${displayName(score.member)} — ${formatPoints(score.points)} pts (${score.level})`,
    )
    .join('\n');
};

const handleTop = async (deps: BotDeps, message: TgMessage) => {
  const lines = formatTop(leaderboard(await loadActivity(deps.db), deps.now()));
  await reply(
    deps,
    message,
    lines ? `🏆 Top ${TOP_LIMIT} Solana Colombia\n${lines}` : REPLIES.topEmpty,
  );
};

const handleReglas = async (deps: BotDeps, message: TgMessage, from: TgUser) => {
  if (from.id !== deps.config.georgeId) {
    return;
  }
  const sent = await deps.telegram.sendMessage(
    message.chat.id,
    markdownToTelegramHtml(deps.texts.reglas),
    { html: true },
  );
  try {
    await deps.telegram.pinChatMessage(message.chat.id, sent.message_id);
  } catch (error) {
    // The rules are posted; tell George instead of failing the update, which
    // would post them a second time on redelivery.
    console.error('telegram /reglas: could not pin the rules', error);
    const reason = error instanceof Error ? error.message : String(error);
    await deps.telegram.sendMessage(
      deps.config.georgeId,
      `Publiqué las reglas, pero no pude fijarlas: ${reason}. ¿El bot es admin con permiso para fijar mensajes?`,
    );
  }
};

const handleNewMembers = async (deps: BotDeps, message: TgMessage, members: TgUser[]) => {
  const humans = members.filter((member) => !member.is_bot);
  if (humans.length === 0) {
    return;
  }
  for (const member of humans) {
    await markJoined(deps.db, member, deps.now());
  }
  await deps.telegram.sendMessage(message.chat.id, markdownToTelegramHtml(deps.texts.primerEnvio), {
    replyTo: message.message_id,
    html: true,
  });
};

const handleCommand = async (deps: BotDeps, message: TgMessage, from: TgUser, text: string) => {
  const command = parseCommand(text);
  switch (command?.name) {
    case 'ship':
      return handleShip(deps, message, from, command.args);
    case 'vouch':
      return handleVouch(deps, message, from);
    case 'gracias':
      return handleGracias(deps, message, from);
    case 'rep':
      return handleRep(deps, message, from);
    case 'top':
      return handleTop(deps, message);
    case 'reglas':
      return handleReglas(deps, message, from);
    default:
      return;
  }
};

export const handleUpdate = async (update: TgUpdate, deps: BotDeps): Promise<void> => {
  const message = update.message;
  if (!message || message.chat.id !== deps.config.groupId) {
    return;
  }
  if (await isUpdateProcessed(deps.db, update.update_id)) {
    return;
  }
  // Marked only after success: if the handler throws or the Worker dies,
  // Telegram redelivers the update. Writes are keyed on message_id, so the
  // retry records nothing twice.
  await handleGroupMessage(deps, message);
  await markUpdateProcessed(deps.db, update.update_id, deps.now());
};

const handleGroupMessage = async (deps: BotDeps, message: TgMessage): Promise<void> => {
  if (message.new_chat_members?.length) {
    await handleNewMembers(deps, message, message.new_chat_members);
    return;
  }

  const from = message.from;
  if (!from || from.is_bot) {
    return;
  }
  const existing = await getMember(deps.db, from.id);
  await upsertMember(deps.db, from, deps.now());

  // The join message is the member's first real message; commands don't count.
  const text = message.text ?? message.caption ?? '';
  if (existing?.awaiting_join_message === 1 && text && !text.startsWith('/')) {
    await recordJoinMessage(deps.db, from.id, text, message.message_id, deps.now());
  }

  if (message.text?.startsWith('/')) {
    await handleCommand(deps, message, from, message.text);
  }
};
