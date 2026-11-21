# Reto de la semana

**Goal:** give the viewer one small build they can finish this week and post in the Telegram
group. This is the format that turns viewers into members.

**Material:** an unused challenge from `src/content/blog/` or a new one, small enough for one
evening. Link the source in `plan.md`.

**Every week:** one.

## Structure (45–55 s, 9:16)

| Beat | Time | Scene | On screen |
|---|---|---|---|
| Hook | 0–3 s | title card | the result, not the task ("Tu primer programa en Devnet, hoy") |
| Why | 3–12 s | stat reveal or split | why this skill matters, one line |
| Steps | 12–40 s | flow diagram, 3–4 nodes | the steps, one short line each |
| Proof | 40–48 s | UI reveal | what "done" looks like (a tx, a URL, a screenshot) |
| CTA | 48–55 s | recap card | "Publícalo en el Telegram" + `t.me/solana_colombia` |

## Narration shape

Hook (the result) → why it matters → the steps, plainly → what to post as proof → invitation to
the group. Say the deadline: the Sunday of the week.

## Post text

- **YouTube title:** `Reto: <result> (<time>)`, ≤ 70 characters.
- **Body, all platforms:** the result in one line, the steps as a short list, then
  `Comparte tu resultado en el Telegram: t.me/solana_colombia` and `Voz generada con IA.`

## Queue row

Every Reto also goes into `weekly_queue` as `kind = 'reto'`: `title` is the result, `body` the
steps in two or three lines, `link` the full challenge post.

## Keep it varied

Rotate the hook type (a result, a number, a question) and the proof scene from week to week.
Never open two weeks in a row with the same words.
