# README.md template for the "Pinstory" repository

Fill this in and place it as `README.md` at the repo root once the project is ready to show. Below is the structure and what to write in each section — not just an empty scaffold.

---

```markdown
# Pinstory

Every place tells a story. A platform that helps you discover the world through the
experience of people you trust — save places, turn them into memories, follow friends,
and overlay their map on your own.

![map screenshot](./docs/screenshot-map.png)

🔗 **Live demo:** <link to the deployed frontend>

## Stack

React 19, TypeScript (strict), Redux Toolkit + RTK Query, MUI 6 (forms only), CSS Modules
with a custom design system, Vite, React Router, React Hook Form + Zod — frontend.
Node.js, Express, Prisma, PostgreSQL, JWT auth — backend.
Yandex Maps JS API — geosuggest and map display.

## What's actually working vs. a visual placeholder

Some screens in this project are deliberately finished, thought-through placeholders for
future features, marked with a "coming soon" badge in the UI. This is an intentional design
decision, not an unfinished corner — the table below shows what's wired to a real backend
versus running on mock data.

| Section | Status |
|---|---|
| Authentication | ✅ Real |
| Profile (settings, social header, counters) | ✅ Real |
| Places catalog (add, rating immediately, photo, tags, privacy) | ✅ Real |
| Chronicle "My Memories" with filters | ✅ Real |
| Place detail view (rating/feedback/friends' comments) | ✅ Real |
| Map of own places | ✅ Real |
| People — search, follow, close friends | ✅ Real |
| Basic friend map overlay | ✅ Real |
| Collections (own + followed) | ✅ Real |
| "For You" activity feed | ✅ Real |
| Full "Map Comparison" | 🔜 Coming soon |
| "From friends" feed tab | 🔜 Coming soon |
| "On this day" | 🔜 Coming soon |
| Routes | 🔜 Coming soon |
| Shared Walks | 🔜 Coming soon |
| "Today" / Smart Suggestions | 🔜 Coming soon |

## Running locally

### Requirements
- Node.js 24.x
- PostgreSQL (locally or via Docker)

### Backend
\`\`\`bash
cd backend
npm install
cp .env.example .env    # fill in your own values
npx prisma migrate dev
npm run dev
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
cp .env.example .env    # fill in your own values, including the Yandex Maps key
npm run dev
\`\`\`

## Environment variables

See `.env.example` in each folder — comments there explain what each variable means.

## Legal note on Yandex Maps

This project does not cache Yandex Maps organization search results in its own database as
a separate directory — only points the user explicitly picked and confirmed into their
catalog are saved. See the Yandex Maps API terms of use for details.

## Roadmap / known limitations

- Full map comparison, the "from friends" feed, "on this day," routes, shared walks, and
  "today" are currently visual placeholders; real implementation is planned as separate
  future steps
- Uploaded photos are stored locally on the server — they don't persist across Railway
  redeploys (ephemeral storage); moving to cloud storage is planned
- Refresh token rotation is not yet implemented
- "Similar taste" recommendations are a simplified tag-based heuristic, not a real algorithm

## License

MIT — see `LICENSE`
```

---

## What to fill in before publishing

- A real screenshot/GIF of the map (the section right at the top — what people see first)
- The live demo link once deployed
- Keep the "real / coming soon" table up to date if the scope changes (check against `FEATURES_SCOPE.md`)
- If a CI badge (latest GitHub Actions run status) becomes available, add it right under the title
