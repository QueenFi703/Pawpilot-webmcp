# ⚡ Quick Start - 2 Minutes

## Docker (Recommended)

```bash
cd Pawpilot-webmcp
docker build -t pawpilot .
docker run -p 3000:3000 pawpilot
```

**Open browser**: http://localhost:3000

---

## Docker Compose (1 Command)

```bash
cd Pawpilot-webmcp
docker compose up --build
```

**Open browser**: http://localhost:3000

---

## Local Development

```bash
cd Pawpilot-webmcp
npm install
npm run dev
```

- Backend: http://localhost:3000 (auto-reload)
- Frontend: http://localhost:5173 (Vite hot reload)

---

## Try It Out

1. Click "What does Milo need today?" in the UI
2. Watch tools execute in real-time in the sidebar
3. Click any tool badge to see input/output
4. Explore the care plan

---

## Test Backend Directly

```bash
curl -X POST http://localhost:3000/mcp/tools/get_pet_profile \
  -H "Content-Type: application/json" \
  -d '{"pet_id":"milo"}'
```

Should return Milo's profile JSON.

---

That's it! 🐾
