# PawPilot

PawPilot is an agent-callable pet care workspace built with WebMCP, Next.js, and Netlify. It exposes structured tools for Dojo’s profile, daily care, services, products, and saved care plans while keeping write actions explicit and observable in the interface.

The application is designed for Microsoft Edge’s WebMCP implementation. It also exposes the same tools through HTTP endpoints for debugging and non-browser integrations.

## What It Does

- Registers six tools with `document.modelContext` when WebMCP is available.
- Shows incoming agent calls and their execution status in the dashboard.
- Normalizes empty, wrapped, stringified, camel-case, and snake-case tool arguments.
- Defaults pet-context calls to Dojo (`dojo-001`) and daily-care calls to the current local date.
- Validates tool input before executing application logic.
- Requires explicit UI approval plus a short-lived, plan-bound server approval token before persisting a care plan.

## Tools

| Tool | Purpose | Required input |
| --- | --- | --- |
| `get_pet_profile` | Returns Dojo’s profile, allergies, and notes | None |
| `get_daily_needs` | Returns Dojo’s dated care checklist | None |
| `find_pet_services` | Finds matching veterinary, grooming, training, or boarding services | `serviceType` |
| `find_pet_products` | Finds matching food, treats, toys, or bedding | `category` |
| `save_care_plan` | Persists a user-approved care plan | `plan`, `confirmed`, `approvalToken` |
| `list_care_plans` | Lists Dojo’s saved plans newest first | None |

Pet-context tools default to `dojo-001`. `get_daily_needs` defaults to today, so an Edge invocation with `{}` remains valid.

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

The request is normalized to include Dojo’s ID and the current local date before it reaches the tool implementation.

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
netlify/database/migrations/   Generated Netlify Database migrations
src/client/webmcp.js           Browser tool registration and invocation
src/shared/tool-input.js       Shared argument parsing and defaults
src/server/tools.js            Tool catalog, validation, and implementations
src/server/approval.js         Signed care-plan approval tokens
src/pages/api/tools.js         Tool discovery endpoint
src/pages/api/approval.js      Approval challenge endpoint
src/pages/api/execute.js       Tool execution endpoint
src/pages/index.js             PawPilot dashboard
```

## Safety Model

Read-only tools are annotated as such.
`save_care_plan` is a write operation and cannot be executed by the OpenAI agent directly. The UI presents the proposed plan and requires explicit user confirmation.
After confirmation, the server issues a short-lived approval token bound to the exact pet and exact care-plan payload. The write endpoint verifies the token before allowing the database operation.
Server-side validation remains authoritative for every execution path.

The current application has no authenticated user/session system. The approval token is therefore an approval challenge, not proof of a user’s identity. Token replay is blocked within the active server instance; a durable multi-instance nonce store or authenticated session system should be added before treating this as a multi-user authorization boundary.

## Testing

Run the full local check with:

```bash
npm run check
```

This runs linting, the Node test suite, and the production build.

## Demo Data

PawPilot currently uses a single sample pet, Dojo, plus sample service and product listings. Care plans are the only records persisted to Netlify Database.

See `SETUP.md` for focused development and troubleshooting notes.

## License

PawPilot is released under the MIT License. See [`LICENSE`](LICENSE).
