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

### Available Tools

1. **get_pet_profile** - Retrieve Milo's profile with medical history
2. **get_daily_needs** - Get today's care checklist
3. **find_pet_services** - Find veterinary, grooming, training, or boarding services
4. **find_pet_products** - Find pet food, treats, toys, or bedding
5. **save_care_plan** - Save a generated care plan

### API Endpoints

- `GET /api/tools` - Discover available tools
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

## Demo Flow

1. User enters a natural language goal (e.g., "What does Milo need today?")
2. Frontend displays Milo's pet profile
3. Agent discovers available tools via `/api/tools`
4. Agent executes tools in sequence:
   - `get_pet_profile` → Get Milo's info
   - `get_daily_needs` → Get care checklist
   - `find_pet_services` → Find grooming services
5. UI displays each tool call in real-time with status
6. Agent synthesizes results into a care plan
7. User can approve and save the plan via `save_care_plan`

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

## Next Steps

- [ ] Integrate actual WebMCP client for agent communication
- [ ] Add database for persistent storage
- [ ] Implement user authentication
- [ ] Add real veterinary service integrations
- [ ] Deploy to production environment
