# PawPilot

PawPilot is an agent-callable pet care workspace built with WebMCP, Next.js, and Netlify. It exposes structured tools for Milo’s profile, daily care, services, products, and saved care plans while keeping write actions explicit and observable in the interface.

The application is designed for Microsoft Edge’s WebMCP implementation. It also exposes the same tools through HTTP endpoints for debugging and non-browser integrations.

## What It Does

- Registers six tools with `document.modelContext` when WebMCP is available.
- Shows incoming agent calls and their execution status in the dashboard.
- Normalizes empty, wrapped, stringified, camel-case, and snake-case tool arguments.
- Defaults pet-context calls to Milo and daily-care calls to the current date.
- Validates tool input before executing application logic.
- Persists approved care plans in Netlify Database.

## Tools

| Tool | Purpose | Required input |
| --- | --- | --- |
| `get_pet_profile` | Returns Milo’s profile, allergies, and notes | None |
| `get_daily_needs` | Returns Milo’s dated care checklist | None |
| `find_pet_services` | Finds matching veterinary, grooming, training, or boarding services | `serviceType` |
| `find_pet_products` | Finds matching food, treats, toys, or bedding | `category` |
| `save_care_plan` | Persists a user-approved care plan | `plan` |
| `list_care_plans` | Lists Milo’s saved plans newest first | None |

Pet-context tools default to `milo-001`. `get_daily_needs` defaults to today, so an Edge invocation with `{}` remains valid.

## Using WebMCP in Edge

Open the deployed site in a Microsoft Edge environment with WebMCP support. PawPilot registers its tools when the page loads.

You can inspect the registered catalog from DevTools:

```javascript
const tools = await document.modelContext.getTools();
console.table(tools.map(({ name, description }) => ({ name, description })));
```

An empty daily-needs invocation is supported:

```javascript
const tools = await document.modelContext.getTools();
const dailyNeeds = tools.find((tool) => tool.name === 'get_daily_needs');
await document.modelContext.executeTool(dailyNeeds, '{}');
```

The request is normalized to include Milo’s ID and the current date before it reaches the tool implementation.

## HTTP API

### Discover tools

```bash
curl http://localhost:8889/api/tools
```

### Execute a tool

```bash
curl --request POST http://localhost:8889/api/execute \
  --header 'Content-Type: application/json' \
  --data '{"tool":"get_daily_needs","params":{}}'
```

The execution endpoint also accepts Edge-style and MCP-style request shapes:

```json
{
  "name": "get_daily_needs",
  "arguments": "{}"
}
```

Aliases such as `pet_id` and `service_type` are converted to the canonical fields before validation.

## Local Development

### Requirements

- Node.js 22 or newer
- npm
- Netlify CLI for full local platform emulation

### Install

```bash
npm install
```

### Run with Netlify

```bash
netlify dev --port 8889
```

Open `http://localhost:8889`.

For UI-only development, use `npm run dev` and open `http://localhost:3000`. Netlify Dev is recommended when testing database-backed care-plan tools.

## Database

Care plans use Netlify Database through `@netlify/database` and Drizzle ORM.

- Schema: `db/schema.ts`
- Database client: `db/index.ts`
- Drizzle configuration: `drizzle.config.ts`
- Deploy migrations: `netlify/database/migrations/`

After changing the schema, generate a migration with:

```bash
npm run db:generate -- --name add_descriptive_change
```

Netlify applies committed migrations during deployment.

## Project Structure

```text
db/                            Netlify Database schema and client
netlify/database/migrations/   Generated database migrations
src/client/webmcp.js           Browser tool registration and invocation
src/shared/tool-input.js       Shared argument parsing and defaults
src/server/tools.js            Tool catalog, validation, and implementations
src/pages/api/tools.js         Tool discovery endpoint
src/pages/api/execute.js       Tool execution endpoint
src/pages/index.js             PawPilot dashboard
```

## Safety Model

Read-only tools are annotated as such. `save_care_plan` is marked as a write operation and its description requires explicit user approval before invocation. Server-side validation remains authoritative even when calls originate from the dashboard or WebMCP.

## Demo Data

PawPilot currently uses a single sample pet, Milo, plus sample service and product listings. Care plans are the only records persisted to Netlify Database.

See `SETUP.md` for focused development and troubleshooting notes.
