# Constructor colombiano (spotlight)

**Goal:** show one community builder's real ship, so viewers see that people like them ship, and
so the builder gets visibility, the community's only reward.

**Material:** only ships the builder recorded with `/ship <link> video` in the reputation bot,
and only once another member has vouched for them. Nothing else counts as consent: not a DM, not
a public repo, not a screenshot.

**Until the reputation bot is live, skip this format.** If the query below returns no rows, skip
it that week.

## Consented ships: the only input

Run this against the bot's D1 database. It reads only ships with video consent and a vouch.
It does not know what earlier weeks featured: drop by hand any row whose ship or builder appears
in an earlier week's `plan.md`. The `ships` and `members` names are provisional until the bot's
migration lands.

```sql
-- Column names follow the reputation bot's ships table; align them if its migration differs.
SELECT s.id, s.link, s.created_at, m.username
FROM ships AS s
JOIN members AS m ON m.id = s.member_id
WHERE s.video_consent = 1
  AND s.vouched_at IS NOT NULL
ORDER BY s.vouched_at DESC
LIMIT 10;
```

```sh
pnpm exec wrangler d1 execute solana_builders --remote --command "<the query above>"
```

It's a read, but against production: run it from George's session.

## Structure (40–55 s, 9:16)

| Beat | Time | Scene | On screen |
|---|---|---|---|
| Hook | 0–3 s | title card | what was built, as a result ("Un pago con QR en Devnet, en un fin de semana") |
| Ship | 3–25 s | UI reveal | the ship itself: screenshots or the live link, as posted |
| How | 25–40 s | flow diagram | the stack or the steps, from the builder's own post |
| Credit | 40–48 s | recap card | the builder's Telegram handle |
| CTA | 48–55 s | recap card | "Comparte tu ship en el Telegram" + `t.me/solana_colombia` |

## Narration shape

The result → the ship → how they did it, in their words → credit by handle → invite viewers to
ship. Describe only what the ship's own link shows.

## Post text

- **YouTube title:** `Constructor colombiano: <result>`, ≤ 70 characters.
- **Body, all platforms:** the result, the builder's handle, the ship link, then
  `Comparte tu ship en el Telegram: t.me/solana_colombia` and `Voz generada con IA.`

## Keep it varied

Never feature the same builder twice in four weeks. Lead the hook with a different element each
time (the result, the time it took, the tool).
