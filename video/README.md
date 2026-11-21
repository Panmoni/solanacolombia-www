# Weekly short-video pipeline

Every week this pipeline turns real material into 3–5 vertical shorts for YouTube, Instagram and
X. Every short ends by inviting the viewer to the Telegram group, `t.me/solana_colombia`.
George's only job is to approve the batch, in about 15 minutes.

## Rules that never change

- **Unique material, every video.** Since July 2025, YouTube and Meta demote mass-produced,
  repetitive and reposted content. Each short is built around one real, sourced thing (a link, a
  repo, a challenge, a builder's ship) that no other week used. The templates fix the shape; the
  material, the hook and the visuals change every week.
- **No presenter on camera.** No AI avatar, no face swap, no livestream. Motion graphics and voice
  only.
- **AI voice, disclosed.** Narration is an AI Spanish voice (Kokoro `ef_dora` or `em_alex`, free,
  local). Every post text carries the line `Voz generada con IA.` Kokoro speaks neutral Spanish,
  not a Colombian accent; a Colombian voice would need a paid engine, which is out of scope.
- **Format:** 9:16, 1080x1920, at most 60 seconds, Spanish captions burned in.
- **Spotlights need consent.** *Constructor colombiano* uses only ships a builder recorded with
  `/ship <link> video` in the reputation bot. **Until the bot ships, skip spotlights.** Never
  feature a builder from a screenshot, a DM or a public repo without that consent.

## Files

| Path | What it is |
|---|---|
| `prompt.md` | the script-drafting prompt: picks the week's material and drafts each short |
| `formats/*.md` | one template per format: structure, narration shape, post text |
| `queue-schema.sql` | the `weekly_queue` table the reputation bot reads for its weekly post |
| `weeks/<YYYY-MM-DD>/` | one folder per week, named for its Monday |

The formats:

| File | Format |
|---|---|
| `formats/oportunidad.md` | Oportunidad de la semana |
| `formats/primer-paso.md` | Primer paso (mindset) |
| `formats/constructor.md` | Constructor colombiano (spotlight) |
| `formats/reto.md` | Reto de la semana |
| `formats/que-construirias.md` | ¿Qué construirías? (a question video) |

## Weekly run

Run it on Friday or Saturday for the week that starts the next Monday. `<week>` below is that
Monday, as `YYYY-MM-DD`.

1. **Make the week folder.** `mkdir -p video/weeks/<week>`.
2. **Draft.** Run the prompt in `prompt.md` in a Claude Code session in this repo. It reads the
   formats, the earlier weeks (so nothing repeats) and the sources, and writes into the week
   folder:
   - `plan.md`: the 3–5 shorts picked, each with its source link;
   - `<n>-<format>/storyboard.md` and `<n>-<format>/narration.md` per short;
   - `<n>-<format>/post.md`: the post text for the three platforms;
   - `queue.sql`: the week's Reto and opportunity rows.
3. **Render.** For each short, run the `explainer` skill on its folder, portrait:
   `vid-voice --lang es narration.md`, build `index.html` from the storyboard with
   `EX.video({ aspect: '9:16', captions: true, ... })`, then `vid-render index.html --speed master`
   and `vid-review`. Copy `master.mp4` into the short's folder as `<n>-<format>.mp4`.
   Check each file: `ffprobe -v error -show_entries stream=width,height:format=duration -of csv=p=0 <file>`
   must print `1080,1920` and a duration of 60 or less.
4. **Approve (George, about 15 minutes).** Watch the mp4s and read the post texts. Delete or
   fix anything off. A short that fails review is dropped, not patched into sameness.
5. **Queue the bot rows.** The SQL writes to the production D1 database, so it is George's to
   run: `pnpm exec wrangler d1 execute solana_builders --remote --file video/weeks/<week>/queue.sql`.
6. **Schedule.** Upload each mp4 with its post text to Buffer, one post per platform, spread over
   the week (suggested: Monday Reto, Wednesday the mindset or question video, Friday the
   opportunity). Record each post URL in `video/weeks/<week>/posts.md` once it goes out.
7. **Commit** the week folder (the mp4s and wav files are gitignored; the scripts, storyboards
   and SQL are the record).

## Scheduler

**Buffer, Free plan.** It connects up to 3 channels, which is exactly YouTube (Shorts),
Instagram and X, and holds 10 scheduled posts per channel, enough for a week of 3–5 shorts.
No paid plan, ever: if the free limits stop fitting, cut the weekly count rather than upgrade.

Connecting the three accounts to Buffer is a one-time, dashboard-only step for George.

## Dependencies

- **Portrait and Spanish in `explainer`.** Step 3 needs the `aspect: '9:16'` stage and
  `vid-voice --lang es`. Until those land in the explainer skill, a week can be drafted (step 2)
  but not rendered.
- **The reputation bot** reads `weekly_queue` for its weekly group post and owns the `ships`
  table that spotlights read. Until it ships, step 5 has no reader and spotlights are skipped.
