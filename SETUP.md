# PawPilot Development Setup

## Quick Start

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

```bash
# Clone or navigate to the repository
cd Pawpilot-webmcp

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at: **http://localhost:3000/**

### Development Commands

```bash
# Start dev server with auto-reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Project Structure

```
src/
├── pages/                   # Next.js pages and API routes
│   ├── index.js            # Main UI page
│   ├── _app.js             # App wrapper
│   └── api/
│       ├── tools.js        # Tool discovery endpoint
│       └── execute.js      # Tool execution endpoint
├── server/
│   └── tools.js            # WebMCP tool definitions & implementations
├── data/
│   └── pets.js             # Mock pet data (Milo's profile, services, products)
└── styles/
    ├── globals.css         # Global styles
    └── Home.module.css     # Page-specific styles
```

## WebMCP Integration

PawPilot registers its tool catalog with `document.modelContext` when the page opens in a WebMCP-capable browser. Agent calls execute through the same validated server handlers used by the dashboard, and calls appear live in the WebMCP activity panel.

Browsers without WebMCP support can still discover and execute the tools through the HTTP endpoints below.

### Available Tools

1. **get_pet_profile** - Retrieve Milo's profile with medical history
2. **get_daily_needs** - Get today's care checklist
3. **find_pet_services** - Find veterinary, grooming, training, or boarding services
4. **find_pet_products** - Find pet food, treats, toys, or bedding
5. **save_care_plan** - Save a generated care plan
6. **list_care_plans** - List persisted care plans for a pet

### API Endpoints

- `GET /api/tools` - Discover available tools and their JSON input schemas
- `POST /api/execute` - Execute a tool with parameters

### Example Tool Call

```javascript
const response = await fetch('/api/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'get_pet_profile',
    params: { petId: 'milo-001' }
  })
});
const result = await response.json();
console.log(result);
```

## Environment Variables

Create a `.env.local` file for local development (copy from `.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

## Agent Flow

1. Open PawPilot in a browser with WebMCP support.
2. The page registers all six tools with the browser's model context.
3. A connected agent chooses and calls tools based on the user's request.
4. PawPilot displays each incoming call and its status in real time.
5. Read tools return pet context without side effects.
6. The agent calls `save_care_plan` only after explicit user approval.
7. Saved plans persist in Netlify Database and can be retrieved with `list_care_plans`.

## Troubleshooting

### Port 3000 already in use

```bash
# Use a different port
npm run dev -- -p 3001
```

### Dependencies not installing

```bash
# Clear npm cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Changes not reflecting

```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

## Data Storage

Care plans use Netlify Database with the schema in `db/schema.ts`. Migrations in `netlify/database/migrations/` are applied automatically during deploy.
