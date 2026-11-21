// The monthly builder-wants summary (PAN-421): the last 30 days of join
// messages, poll answers and YouTube comments go to Workers AI (free tier),
// which groups them into at most 5 themes in Spanish. The result is stored in
// tg_summaries and sent to George by Telegram DM. Thin months and AI failures
// send the raw inputs instead, so the DM always arrives with something to read.
import { insertSummary, loadSummaryInputs } from './store.ts';
import type { AiClient, BotDeps } from './types.ts';

export const SUMMARY_MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
export const WINDOW_DAYS = 30;
export const MIN_INPUTS = 10;
export const MAX_THEMES = 5;

const DAY_MS = 24 * 60 * 60 * 1000;
// Telegram rejects messages over 4096 characters.
const MAX_MESSAGE = 4096;
const MAX_INPUT_CHARS = 500;
// The model's context is 24k tokens; 40k characters of Spanish stays well inside it.
const MAX_PROMPT_CHARS = 40_000;

export type InputSource = 'unión' | 'encuesta' | 'YouTube';

export interface SummaryInput {
  source: InputSource;
  text: string;
}

export interface Theme {
  tema: string;
  cantidad: number;
  cita: string;
}

const clean = (text: string): string => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > MAX_INPUT_CHARS ? `${flat.slice(0, MAX_INPUT_CHARS - 1)}…` : flat;
};

/** Every input of the window, with a note when YouTube could not be read. */
export const gatherInputs = async (
  deps: BotDeps,
  since: Date,
): Promise<{ inputs: SummaryInput[]; youtubeNote: string | null }> => {
  const stored = await loadSummaryInputs(deps.db, since);
  let comments: string[] = [];
  let youtubeNote: string | null = null;
  if (deps.youtubeComments) {
    try {
      comments = await deps.youtubeComments(since);
    } catch (error) {
      // The D1 inputs still make a summary; the DM says what is missing.
      console.error('telegram summary: YouTube comments failed', error);
      youtubeNote = `YouTube no incluido: ${error instanceof Error ? error.message : 'error desconocido'}`;
    }
  } else {
    youtubeNote = 'YouTube no incluido: falta el secreto YOUTUBE_API_KEY';
  }
  const inputs: SummaryInput[] = [
    ...stored.joinMessages.map((text) => ({ source: 'unión' as const, text })),
    ...stored.pollAnswers.map(({ question, options }) => ({
      source: 'encuesta' as const,
      text: `${question} → ${options.join(', ')}`,
    })),
    ...comments.map((text) => ({ source: 'YouTube' as const, text })),
  ]
    .map((input) => ({ ...input, text: clean(input.text) }))
    .filter((input) => input.text.length > 0);
  return { inputs, youtubeNote };
};

/** One numbered line per input, as the model reads them. */
export const formatInputText = (inputs: SummaryInput[]): string =>
  inputs.map((input, index) => `${index + 1}. [${input.source}] ${input.text}`).join('\n');

const SYSTEM_PROMPT = `Eres analista de una comunidad de desarrolladores de Solana en Colombia.
Recibes mensajes numerados: presentaciones de nuevos miembros [unión], respuestas a una encuesta [encuesta] y comentarios de YouTube [YouTube].
Agrupa lo que la gente quiere construir o aprender en un máximo de ${MAX_THEMES} temas, del más pedido al menos pedido.
Para cada tema da:
- "tema": un nombre corto en español.
- "cantidad": cuántos mensajes tratan ese tema.
- "cita": un fragmento copiado palabra por palabra de uno de los mensajes, sin el número ni la etiqueta.
Responde solo con JSON: {"temas": [{"tema": "...", "cantidad": 1, "cita": "..."}]}`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    temas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          tema: { type: 'string' },
          cantidad: { type: 'integer' },
          cita: { type: 'string' },
        },
        required: ['tema', 'cantidad', 'cita'],
      },
    },
  },
  required: ['temas'],
};

const normalize = (text: string): string => text.toLowerCase().replace(/\s+/g, ' ').trim();

const stripQuotes = (text: string): string => text.trim().replace(/^["'«“]+|["'»”]+$/g, '');

/**
 * The model's themes, keeping only well-formed ones whose quote really
 * appears in the inputs, so an invented quote never reaches George.
 */
export const parseThemes = (raw: unknown, inputs: SummaryInput[]): Theme[] => {
  let body = (raw as { response?: unknown } | null)?.response ?? raw;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body.replace(/^\s*```(?:json)?|```\s*$/g, ''));
    } catch {
      return [];
    }
  }
  const temas = (body as { temas?: unknown } | null)?.temas;
  if (!Array.isArray(temas)) {
    return [];
  }
  const haystack = normalize(inputs.map((input) => input.text).join('\n'));
  return temas
    .flatMap((item: unknown): Theme[] => {
      const { tema, cantidad, cita } = (item ?? {}) as Record<string, unknown>;
      if (typeof tema !== 'string' || typeof cita !== 'string' || typeof cantidad !== 'number') {
        return [];
      }
      const theme = { tema: tema.trim(), cantidad, cita: stripQuotes(cita) };
      const valid =
        theme.tema.length > 0 &&
        theme.cita.length > 0 &&
        Number.isInteger(cantidad) &&
        cantidad >= 1 &&
        cantidad <= inputs.length &&
        haystack.includes(normalize(theme.cita));
      return valid ? [theme] : [];
    })
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, MAX_THEMES);
};

const summarize = async (ai: AiClient, inputs: SummaryInput[]): Promise<Theme[]> => {
  let text = formatInputText(inputs);
  if (text.length > MAX_PROMPT_CHARS) {
    text = `${text.slice(0, MAX_PROMPT_CHARS)}\n(lista recortada)`;
  }
  const raw = await ai.run(SUMMARY_MODEL, {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text },
    ],
    response_format: { type: 'json_schema', json_schema: RESPONSE_SCHEMA },
    max_tokens: 1024,
    temperature: 0.2,
  });
  return parseThemes(raw, inputs);
};

const day = (date: Date): string => date.toISOString().slice(0, 10);

const countLine = (inputs: SummaryInput[]): string => {
  const count = (source: InputSource) => inputs.filter((input) => input.source === source).length;
  return `${inputs.length} entradas (unión: ${count('unión')}, encuesta: ${count('encuesta')}, YouTube: ${count('YouTube')})`;
};

/** Header lines, then as many items as fit in one Telegram message. */
const fitMessage = (header: string[], items: string[]): string => {
  const lines = [...header];
  let length = lines.join('\n').length;
  for (const [index, item] of items.entries()) {
    const remaining = items.length - index;
    const more = `… y ${remaining} más`;
    if (length + item.length + more.length + 2 > MAX_MESSAGE) {
      lines.push(more);
      break;
    }
    lines.push(item);
    length += item.length + 1;
  }
  return lines.join('\n');
};

export const formatThemesMessage = (
  themes: Theme[],
  inputs: SummaryInput[],
  period: { start: Date; end: Date },
  youtubeNote: string | null,
): string =>
  fitMessage(
    [
      'Resumen mensual: qué quieren los builders',
      `Del ${day(period.start)} al ${day(period.end)} · ${countLine(inputs)}`,
      ...(youtubeNote ? [youtubeNote] : []),
      '',
    ],
    themes.map(
      (theme, index) => `${index + 1}. ${theme.tema} (${theme.cantidad})\n   «${theme.cita}»`,
    ),
  );

export const formatRawMessage = (
  reason: string,
  inputs: SummaryInput[],
  period: { start: Date; end: Date },
  youtubeNote: string | null,
): string =>
  fitMessage(
    [
      `Resumen mensual: ${reason}`,
      `Del ${day(period.start)} al ${day(period.end)} · ${countLine(inputs)}`,
      ...(youtubeNote ? [youtubeNote] : []),
      '',
      inputs.length > 0 ? 'Entradas:' : 'No hay entradas este mes.',
    ],
    inputs.map((input) => `- [${input.source}] ${input.text}`),
  );

export const runMonthlySummary = async (deps: BotDeps): Promise<void> => {
  const end = deps.now();
  const start = new Date(end.getTime() - WINDOW_DAYS * DAY_MS);
  const period = { start, end };
  const { inputs, youtubeNote } = await gatherInputs(deps, start);

  let status: 'themes' | 'thin' | 'ai_failed';
  let themes: Theme[] | null = null;
  let message: string;
  if (inputs.length < MIN_INPUTS) {
    status = 'thin';
    message = formatRawMessage(
      `pocos datos (menos de ${MIN_INPUTS} entradas), así que no hay temas`,
      inputs,
      period,
      youtubeNote,
    );
  } else {
    let failure: string | null = null;
    if (deps.ai) {
      try {
        themes = await summarize(deps.ai, inputs);
        failure = themes.length > 0 ? null : 'la IA no devolvió temas válidos';
      } catch (error) {
        console.error('telegram summary: Workers AI failed', error);
        failure = `la IA falló (${error instanceof Error ? error.message : 'error desconocido'})`;
      }
    } else {
      failure = 'falta el binding AI de Workers AI';
    }
    if (failure) {
      status = 'ai_failed';
      themes = null;
      message = formatRawMessage(
        `${failure}; van las entradas sin resumir`,
        inputs,
        period,
        youtubeNote,
      );
    } else {
      status = 'themes';
      message = formatThemesMessage(themes ?? [], inputs, period, youtubeNote);
    }
  }

  // Stored first: if the DM fails, the summary is still in D1 and the run fails loudly.
  await insertSummary(
    deps.db,
    { periodStart: start, periodEnd: end, inputCount: inputs.length, status, themes, message },
    end,
  );
  await deps.telegram.sendMessage(deps.config.georgeId, message);
};
