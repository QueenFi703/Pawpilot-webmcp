# PawPilot WebMCP 🐾

**An agentic pet care orchestration platform built with WebMCP.**

PawPilot demonstrates how a web experience can expose task-oriented capabilities to an AI agent through WebMCP. Meet Milo, a fictional golden retriever. Ask the agent what Milo needs today, and watch it compose multiple tools into a coherent, actionable care plan.

## 🎯 The Concept

Instead of navigating menus, a user makes one request to an intelligent agent:

> **"What does Milo need today?"**

The agent:
1. **Discovers** Milo's profile (breed, age, health)
2. **Identifies** daily care needs deterministically
3. **Searches** for relevant grooming, training, and exercise services
4. **Recommends** food, toys, bedding, and health products
5. **Proposes** a comprehensive care plan

Every tool call is visible in the UI. The user approves before any action is saved.

## 🏗️ Architecture

```
User Goal
  ↓
WebMCP Tools (5 capabilities)
  ├── get_pet_profile
  ├── get_daily_needs
  ├── find_pet_services
  ├── find_pet_products
  └── save_care_plan
  ↓
Polished React UI + Real-time Tool Activity
  ↓
Actionable Care Plan
```

## ✨ Features

- **Agentic Orchestration**: Fully functional MCP tool composition
- **Real-time Transparency**: Every tool call rendered with status and results
- **Polished Design**: Warm, pet-friendly visual identity with smooth animations
- **Production-Ready**: Docker containerization, TypeScript, responsive UI
- **End-to-End Demo**: Works out-of-the-box with mock pet data

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Start both server and client
npm run dev

# Or run separately:
npm run dev:server  # MCP server on :3000
npm run dev:client  # UI on :5173
```

The UI will open at `http://localhost:5173` and proxy API calls to the MCP server at `http://localhost:3000`.

### Docker

```bash
# Build and run
docker compose up --build

# Visit http://localhost:3000
```

## 📋 MCP Tools

### `get_pet_profile`
Retrieves pet metadata: name, breed, age, weight, health notes, vaccination status.

**Input:**
```json
{ "pet_id": "milo" }
```

**Output:**
```json
{
  "pet_id": "milo",
  "name": "Milo",
  "breed": "Golden Retriever",
  "age": 3,
  "weight_lbs": 68,
  "health_notes": "Seasonal allergies, active lifestyle",
  "vaccinations_current": true
}
```

### `get_daily_needs`
Returns a deterministic checklist of daily care tasks based on pet profile.

**Input:**
```json
{ "pet_id": "milo" }
```

**Output:**
```json
{
  "pet_id": "milo",
  "date": "2024-01-15",
  "needs": [
    "Morning walk (30 min)",
    "Feeding (morning & evening)",
    "Playtime (45 min)",
    "Grooming check",
    "Health supplement (omega-3)",
    "Training session (15 min)"
  ]
}
```

### `find_pet_services`
Searches for relevant pet care services: grooming, training, veterinary, boarding, exercise.

**Input:**
```json
{ "service_type": "grooming" }
```

**Output:**
```json
{
  "services": [
    {
      "id": "groom_01",
      "name": "Paw Spa",
      "rating": 4.8,
      "price": "$45"
    },
    {
      "id": "groom_02",
      "name": "Golden Coat Care",
      "rating": 4.9,
      "price": "$55"
    }
  ]
}
```

### `find_pet_products`
Finds recommended products: food, toys, grooming, bedding, health supplements.

**Input:**
```json
{ "product_type": "food" }
```

**Output:**
```json
{
  "products": [
    {
      "id": "food_01",
      "name": "Premium Golden Retriever Formula",
      "price": "$45",
      "rating": 4.8
    },
    {
      "id": "food_02",
      "name": "Organic Grain-Free Kibble",
      "price": "$55",
      "rating": 4.7
    }
  ]
}
```

### `save_care_plan`
Persists a generated care plan with user confirmation.

**Input:**
```json
{
  "pet_id": "milo",
  "plan": "{ care plan JSON }"
}
```

**Output:**
```json
{
  "status": "success",
  "pet_id": "milo",
  "plan_saved": true,
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Care plan saved and ready to execute"
}
```

## 🎨 UI Components

### Header
- Animated logo with bounce effect
- Real-time agent status (Idle, Thinking, Executing, Confirming)
- Gradient background with subtle design elements

### Sidebar - Tool Activity Inspector
- Live list of tool calls with status icons
- Click to inspect input/output details
- Color-coded by status (success, pending, error)

### Chat Area
- Empty state with example prompts
- Message thread with user, agent, and system messages
- Tool call badges showing composition
- Real-time message animations

### Input
- Rounded input field with focus states
- Submit button with loading state
- Disabled state during agent execution

## 🌈 Design System

**Color Palette:**
- Primary: `#d4a574` (warm gold)
- Secondary: `#6b5b4f` (rich brown)
- Accent: `#f4a261` (vibrant orange)
- Success: `#2a9d8f` (teal)
- Error: `#e76f51` (coral)

**Typography:**
- System fonts (San Francisco, Segoe UI, Helvetica Neue)
- Font sizes: 0.75rem to 2.5rem
- Weights: 300 (light), 500 (medium), 600 (semi-bold), 700 (bold)

**Spacing:**
- Base unit: 0.5rem (8px grid)
- Gap/padding: 0.75rem–2rem
- Border radius: 0.25rem–2rem

**Effects:**
- Shadows: `0 8px 24px rgba(0,0,0,0.12)` (primary), `0 2px 8px` (secondary)
- Animations: bounce, float, pulse, fadeIn (0.2s–3s)
- Backdrop blur on glass-morphism elements

## 📦 Project Structure

```
Pawpilot-webmcp/
├── src/
│   ├── server.ts          # Express MCP server
│   ├── client.ts          # CLI client (optional)
│   ├── App.tsx            # React main component
│   ├── App.css            # Polished styles
│   └── index.tsx          # React entry
├── index.html             # HTML template
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
├── vite.config.ts         # Vite config
├── Dockerfile             # Multi-stage build
├── docker-compose.yml     # Docker Compose
├── .dockerignore          # Docker ignore rules
└── README.md              # This file
```

## 🐳 Docker Build & Deployment

### Build Locally
```bash
docker build -t pawpilot:latest .
docker run -p 3000:3000 pawpilot:latest
```

### With Docker Compose
```bash
docker compose up -d
docker compose logs -f
docker compose down
```

### Environment Variables
- `NODE_ENV`: Set to `production` in Docker
- `PORT`: Server port (default: 3000)
- `VITE_API_BASE`: Frontend API proxy (default: http://localhost:3000)

## 🧪 Testing the Demo

Try these prompts in the UI:

1. **"What does Milo need today?"** — Full care plan discovery
2. **"Find grooming services for Milo"** — Service search
3. **"Recommend food for Milo"** — Product discovery
4. **"Create a comprehensive care plan for Milo"** — Complete orchestration

Watch the **Tool Activity** sidebar to see each MCP call in real time.

## 🔄 Data Flow

```
User Input
  ↓
Agent receives goal
  ↓
Discover pet profile (get_pet_profile)
  ↓
Identify needs (get_daily_needs)
  ↓
Search services (find_pet_services)
  ↓
Find products (find_pet_products)
  ↓
Compose care plan
  ↓
Request user approval
  ↓
Save plan (save_care_plan)
  ↓
Display results + tool trace
```

## 📊 Mock Data

The MVP uses fully deterministic mock data. Real integrations can replace:

- **Pet profiles** → Pet health records (Vet API, insurance provider)
- **Daily needs** → ML model prediction from health history
- **Services** → Local business directory API (Google Maps, Yelp)
- **Products** → E-commerce catalog (Amazon, Chewy, petstore APIs)
- **Persistence** → Database (PostgreSQL, MongoDB)

## 🎯 Use Cases Beyond Pets

This pattern generalizes to:

- **Travel**: Discover destination, find flights, book hotels, save itinerary
- **Shopping**: Identify needs, search products, compare prices, save cart
- **Scheduling**: Calendar analysis, find availability, book appointments
- **Support**: Route issue, find solutions, escalate if needed, log ticket

## 🚀 Deployment

### Vercel / Netlify (Frontend only)
Deploy the `dist` folder after building with Vite.

### AWS / GCP / DigitalOcean (Full stack)
```bash
docker build -t pawpilot .
docker push your-registry/pawpilot:latest
# Deploy container to cloud platform
```

### Local Kubernetes
```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: Pod
metadata:
  name: pawpilot
spec:
  containers:
  - name: pawpilot
    image: pawpilot:latest
    ports:
    - containerPort: 3000
    env:
    - name: NODE_ENV
      value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: pawpilot-svc
spec:
  selector:
    name: pawpilot
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
EOF
```

## 📝 License

This demo is provided as-is for the WebMCP hackathon and general educational use.

## 🙌 Credits

Built for the **WebMCP Hackathon**.

**Architecture inspired by:**
- Claude MCP Framework
- Agent reasoning & tool composition
- Transparent agentic UI patterns

---

**Questions?** Open an issue or refer to the docs/ARCHITECTURE.md for implementation details.
