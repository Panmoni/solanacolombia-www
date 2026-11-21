# Script-drafting prompt

Paste everything below the line into a Claude Code session opened in this repo. Replace
`<week>` with the Monday of the target week (`YYYY-MM-DD`).

---

You are drafting this week's shorts for Solana Colombia, a zero-budget, Spanish-speaking builder
community whose home is the Telegram group `t.me/solana_colombia`. The target week starts on
Monday `<week>`. Write everything into `video/weeks/<week>/`.

## Read first

1. `video/README.md`: the rules that never change.
2. Every file in `video/formats/`: the five formats and their shape.
3. Every `plan.md` under `video/weeks/`: what earlier weeks already used. Never reuse a source,
   a hook, an idea number or an opening line.

## Pick 3–5 shorts

- **Reto de la semana: always one.** Source: an unused challenge from `src/content/blog/`
  (the `2026-challenge-*` posts and `10-retos.md`), or a new one small enough to finish in an
  evening. It must end with something the builder posts in the Telegram group.
- **Oportunidad de la semana: one, only when verified.** A real hackathon, bounty, grant or open
  call with a public link and a date that is still open on `<week>`. Open the link and confirm
  the date. If you can't verify one, skip this format for the week. Never invent or guess.
  Don't build around Solana Foundation programmes.
- **Primer paso: at most one.** One concrete mindset move (shipping before you feel ready,
  posting work in public, finishing small). Anchor it in a real, citable example.
- **¿Qué construirías?: at most one.** One unused idea from `src/content/blog/200-ideas.md`
  (name its number), tied to a real Colombian problem, ending with a question viewers answer in
  the Telegram group.
- **Constructor colombiano: only from consented ships.** Run the query in
  `video/formats/constructor.md` and use only the rows it returns. If the reputation bot isn't
  live yet, or the query returns nothing, skip this format.

## For each short, write `video/weeks/<week>/<n>-<format>/`

- `storyboard.md`: one row per scene for a 720x1280 portrait stage, following the format's
  structure. Columns: words cued, scene, on-screen text verbatim, what moves. On-screen text in
  Colombian Spanish. Keep text inside x 36-684, y 64-1024 (the bottom fifth belongs to captions
  and platform UI).
- `narration.md`: the spoken script, verbatim, about 2.5 words a second, 90–135 words (35–55 seconds).
  Natural Colombian register (tú, not vos or usted; "parce" at most once). No English unless it's a
  technical term the audience uses (deploy, wallet, devnet).
- `post.md`: the post text, with a section each for YouTube (a title ≤ 70 characters and a
  description), Instagram and X (≤ 260 characters). Each version ends with the Telegram link and
  the line `Voz generada con IA.`

## Then write

- `video/weeks/<week>/plan.md`: a table of the shorts, each with format, source link, the hook
  line, and the reason it isn't a repeat. List the formats skipped and why.
- `video/weeks/<week>/queue.sql`: the Reto row, plus the opportunity row if there is one, for
  `weekly_queue` (see `video/queue-schema.sql`). Use the upsert shape the earlier weeks use, so
  re-running the file is safe.

## Quality bar

- The hook lands in the first 2 seconds, with a claim or a question and no greeting.
- One idea per short.
- Every factual claim traces to the source link in `plan.md`.
- Every short reads differently from the same format in earlier weeks: a different opening, a
  different visual metaphor, a different scene order where the format allows it.
