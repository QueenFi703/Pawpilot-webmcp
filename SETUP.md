# PawPilot Development Setup

## Requirements

- Node.js 22 or newer
- npm
- Netlify CLI when testing Netlify Database locally

## Install

```bash
npm install
```

## Run Locally

Use Netlify Dev for the complete application environment:

```bash
netlify dev --port 8889
```

Open `http://localhost:8889`.

For frontend-only work:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Commands

```bash
npm run dev          # Start Next.js development mode
npm run lint         # Run Next.js linting
npm run build        # Create a production build
npm run start        # Serve a production build
npm run db:generate  # Generate a database migration
```

## WebMCP Checks

In Microsoft Edge DevTools, confirm that the browser model context and tools are available:

```javascript
typeof document.modelContext;
await document.modelContext.getTools();
```

Test the daily-needs tool with the empty argument shape produced by Edge:

```javascript
const tools = await document.modelContext.getTools();
const tool = tools.find((candidate) => candidate.name === 'get_daily_needs');
await document.modelContext.executeTool(tool, '{}');
```

PawPilot fills in `petId: "milo-001"` and the current date before calling `/api/execute`.

## API Checks

Discover tools:

```bash
curl http://localhost:8889/api/tools
```

Execute a tool with inferred pet context:

```bash
curl --request POST http://localhost:8889/api/execute \
  --header 'Content-Type: application/json' \
  --data '{"tool":"get_daily_needs","params":{}}'
```

The endpoint accepts canonical `{ tool, params }` requests as well as `{ name, arguments }`, JSON-string arguments, `pet_id`, and `service_type`.

## Database Changes

Define schema changes in `db/schema.ts`, then generate a named migration:

```bash
npm run db:generate -- --name add_descriptive_change
```

Commit both the schema change and the generated files in `netlify/database/migrations/`. Netlify applies migrations during deployment.

## Troubleshooting

### Port already in use

Use the required Netlify development port after stopping the process currently using it:

```bash
netlify dev --port 8889
```

### WebMCP tools are unavailable

- Confirm the site is open in a Microsoft Edge environment with WebMCP support.
- Reload after opening DevTools or enabling the relevant browser capability.
- Check `GET /api/tools` to separate browser registration issues from server tool issues.

### A tool returns 400

Inspect the JSON error returned by `/api/execute`. Pet context and the daily date are inferred, but service type, product category, and care-plan content remain intentionally required.
