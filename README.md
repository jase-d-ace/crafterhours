# CrafterHours

A personal evening coaching app. Open it after work and a conversational agent recommends what hobby to focus on tonight based on recency history, Google Calendar context, and recent GitHub activity. The agent conducts a back-and-forth planning conversation, helps you execute a structured session, and produces a tangible artifact at the end — a journal entry, practice log, or coding summary. All data lives in a local SQLite database.

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   ```bash
   cp .env .env.local
   ```

   Fill in your `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, and `GOOGLE_CALENDAR_ID`.

3. **Run database migrations**

   ```bash
   npm run db:migrate
   ```

4. **Start the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Next.js dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run db:migrate` | Run SQLite migrations |
