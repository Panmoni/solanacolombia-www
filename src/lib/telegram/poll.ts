// The monthly builder-wants poll (PAN-435): the Cron Trigger posts the poll
// from content/telegram/encuesta.md, and each poll_answer update is stored in
// tg_poll_results for the monthly summary.
import { deletePollAnswer, getPoll, insertPoll, savePollAnswer, upsertMember } from './store.ts';
import type { BotDeps, TgPollAnswer } from './types.ts';

// Telegram's sendPoll limits: question 1-300 characters, options 1-100 each.
// Telegram allows 12 options; 10 keeps the poll readable on a phone.
const MAX_QUESTION = 300;
const MAX_OPTION = 100;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export interface PollContent {
  question: string;
  options: string[];
}

/**
 * The first `# ` heading is the question and every `- ` bullet an option;
 * other lines are notes for whoever edits the file. Throws on anything
 * Telegram would reject, so a bad edit fails the run instead of posting.
 */
export const parseEncuesta = (markdown: string): PollContent => {
  const lines = markdown.split('\n').map((line) => line.trim());
  const question =
    lines
      .find((line) => line.startsWith('# '))
      ?.slice(2)
      .trim() ?? '';
  const options = lines.filter((line) => line.startsWith('- ')).map((line) => line.slice(2).trim());

  const problems = [
    ...(question.length === 0 || question.length > MAX_QUESTION
      ? [`the question must be 1-${MAX_QUESTION} characters`]
      : []),
    ...(options.length < MIN_OPTIONS || options.length > MAX_OPTIONS
      ? [`there must be ${MIN_OPTIONS}-${MAX_OPTIONS} options, found ${options.length}`]
      : []),
    ...options
      .filter((option) => option.length === 0 || option.length > MAX_OPTION)
      .map((option) => `option "${option}" must be 1-${MAX_OPTION} characters`),
    ...(new Set(options).size === options.length ? [] : ['options must be unique']),
  ];
  if (problems.length > 0) {
    throw new Error(`content/telegram/encuesta.md: ${problems.join('; ')}`);
  }
  return { question, options };
};

export const runMonthlyPoll = async (deps: BotDeps): Promise<void> => {
  const { question, options } = parseEncuesta(deps.texts.encuesta);
  const sent = await deps.telegram.sendPoll(deps.config.groupId, question, options);
  try {
    await insertPoll(deps.db, { ...sent, question, options }, deps.now());
  } catch (error) {
    // The poll is live, but its answers will be ignored without this row.
    throw new Error(
      `telegram poll: posted poll ${sent.pollId} (message ${sent.messageId}) but could not store it`,
      { cause: error },
    );
  }
};

/**
 * Stores one vote. Telegram sends poll_answer only for the bot's own
 * non-anonymous polls; anything it does not know is skipped.
 */
export const recordPollAnswer = async (deps: BotDeps, answer: TgPollAnswer): Promise<void> => {
  const voter = answer.user;
  if (!voter || voter.is_bot) {
    return;
  }
  const poll = await getPoll(deps.db, answer.poll_id);
  if (!poll) {
    console.warn(`telegram poll: answer for unknown poll ${answer.poll_id} skipped`);
    return;
  }
  if (answer.option_ids.length === 0) {
    await deletePollAnswer(deps.db, answer.poll_id, voter.id);
    return;
  }
  const now = deps.now();
  await upsertMember(deps.db, voter, now);
  await savePollAnswer(
    deps.db,
    {
      pollId: answer.poll_id,
      memberId: voter.id,
      question: poll.question,
      optionIds: answer.option_ids,
      optionTexts: answer.option_ids.map((index) => poll.options[index] ?? `#${index}`),
    },
    now,
  );
};
