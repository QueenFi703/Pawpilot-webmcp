# 🚀 PawPilot v2.0 - Complete Deployment Guide

## ✨ What's New in v2.0

✅ **OpenAI Integration** - Dynamic AI orchestration
✅ **PostgreSQL Database** - Persistent data storage
✅ **Real APIs** - Replace mock data with real services
✅ **Docker Cloud Ready** - Production deployment
✅ **Agent Orchestration** - Full AI workflow

---

## 📍 UI Address

**Local Development:**
```
http://localhost:3000
```

**Docker Compose:**
```
http://localhost:3000
```

**Docker Cloud (After Deployment):**
```
https://your-service-url.cloud.docker.com
```

The UI is served automatically when you visit the base URL. The application combines React frontend + Express backend in a single Docker container.

---

## 🔑 Prerequisites

1. **OpenAI API Key** - Get from https://platform.openai.com/api-keys
2. **Docker** - Install from https://www.docker.com/products/docker-desktop
3. **Docker Hub Account** - For pushing images (optional)
4. **Docker Cloud Account** - For deployment (optional)

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Get OpenAI API Key
```bash
# Go to https://platform.openai.com/api-keys
# Create new secret key
# Copy the key (format: sk-xxxx...)
```

### Step 2: Create .env File
```bash
cd Pawpilot-webmcp

# Create .env with your API key
cat > .env << EOF
OPENAI_API_KEY=sk-your-api-key-here
POSTGRES_USER=pawpilot
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=pawpilot
NODE_ENV=development
EOF
```

### Step 3: Start with Docker Compose
```bash
docker compose up --build
```

### Step 4: Access UI
```
http://localhost:3000
```

### Step 5: Test the Agent
Click "What does Milo need today?" and watch the AI orchestrate:
1. Get pet profile (from DB)
2. Generate needs (using AI)
3. Find services (from DB)
4. Find products (from DB)
5. Save plan (to DB)

---

## 🐳 Full Docker Compose Setup

### What's Included
```yaml
postgres:        # PostgreSQL database (port 5432)
pawpilot:        # Python app + React UI (port 3000)
```

### Start Everything
```bash
cd Pawpilot-webmcp

# Create .env file with your settings
cat > .env << EOF
OPENAI_API_KEY=sk-your-key
POSTGRES_PASSWORD=your-password
EOF

# Build and start
docker compose up --build

# You should see:
# ✅ PostgreSQL is ready
# ✅ Database schema created
# ✅ PawPilot AI Server running
```

### Verify Services
```bash
# Check containers running
docker ps

# Check logs
docker compose logs -f pawpilot

# Test health
curl http://localhost:3000/health
```

### Stop Everything
```bash
docker compose down

# Also remove volumes (careful!)
docker compose down -v
```

---

## 🌍 Deploy to Docker Cloud

### Step 1: Build and Push Image
```bash
# Login to Docker Hub
docker login

# Build image
docker build -t yourname/pawpilot:v2.0 Pawpilot-webmcp

# Push to Docker Hub
docker push yourname/pawpilot:v2.0
```

### Step 2: Create Docker Cloud Stack

1. Go to https://cloud.docker.com
2. Click "Create" → "Stack"
3. Paste this YAML:

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U pawpilot"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  pawpilot:
    image: yourname/pawpilot:v2.0
    environment:
      NODE_ENV: production
      PORT: 3000
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  postgres_data:
```

### Step 3: Set Environment Variables

In Docker Cloud, set these variables:
```
OPENAI_API_KEY=sk-your-actual-key
POSTGRES_USER=pawpilot
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=pawpilot
```

### Step 4: Deploy Stack

1. Click "Create Stack"
2. Wait for containers to start (~2 minutes)
3. Get the service URL from Docker Cloud dashboard
4. Visit your app!

---

## 📊 Database

### Access Database

**Local:**
```bash
# Connect to local postgres
psql -h localhost -U pawpilot -d pawpilot

# List tables
\dt

# Query pets
SELECT * FROM pets;
```

**Docker:**
```bash
docker exec -it pawpilot-postgres psql -U pawpilot -d pawpilot
```

### Database Schema

```sql
-- Pets
- id, name, breed, age, weight, health_notes, vaccinations

-- Daily Needs
- pet_id, date, needs (array)

-- Pet Services
- service_id, name, service_type, rating, price

-- Pet Products
- product_id, name, product_type, price, rating

-- Care Plans
- id, pet_id, plan_date, activities, status

-- Agent Calls (Logging)
- id, pet_id, tool_name, input, output, status
```

### Backup Database

```bash
# Backup local
docker exec pawpilot-postgres pg_dump -U pawpilot pawpilot > backup.sql

# Restore from backup
docker exec -i pawpilot-postgres psql -U pawpilot pawpilot < backup.sql
```

---

## 🤖 OpenAI Integration

### How It Works

1. **User asks question**: "What does Milo need today?"
2. **Agent receives goal** at `/api/agent/orchestrate`
3. **OpenAI analyzes** using GPT-4/GPT-3.5
4. **Tools execute** based on AI decision
5. **Results stored** in database
6. **Response returned** to UI

### API Endpoint

```bash
curl -X POST http://localhost:3000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "What does Milo need today?",
    "pet_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }'
```

### Change OpenAI Model

Edit `src/server.ts`, line ~115:

```typescript
// Use cheaper, faster model
model: "gpt-3.5-turbo"

// Or keep powerful model
model: "gpt-4-turbo"
```

### Monitor Costs

1. Go to https://platform.openai.com/account/billing
2. Set usage alerts
3. Check `/dashboard` for daily usage

---

## 📈 Scaling & Monitoring

### Local Development
```bash
docker compose logs -f pawpilot     # View logs
docker compose ps                    # See running containers
docker compose stats                 # See resource usage
```

### Docker Cloud

1. Dashboard shows real-time metrics
2. CPU, Memory, Network usage
3. Health check status
4. Auto-restart on failure

### Scale Horizontally

Docker Cloud → PawPilot Service → Increase "Replicas"

---

## 🔒 Security

### Environment Variables (Never Commit!)

```bash
# Good - in .env (add to .gitignore)
OPENAI_API_KEY=sk-xxx
POSTGRES_PASSWORD=secure

# Bad - in docker-compose.yml
OPENAI_API_KEY: sk-xxx  ❌ Don't do this!
```

### Database Security

```bash
# Strong password required
POSTGRES_PASSWORD=Use-A-Strong-Password-123!

# Use different passwords for dev/prod
DEV: simple-password (for local testing)
PROD: Very-Secure-Random-Password-With-Symbols!
```

### API Key Security

1. ✅ Keep in `.env` (gitignored)
2. ✅ Rotate keys regularly
3. ✅ Use separate keys for dev/prod
4. ✅ Monitor usage for anomalies
5. ✅ Never log API keys

---

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2026-08-31T..."}
```

### List Tools
```bash
curl http://localhost:3000/mcp/tools
# Shows all available MCP tools
```

### Get Pet Profile
```bash
curl -X POST http://localhost:3000/mcp/tools/get_pet_profile \
  -H "Content-Type: application/json" \
  -d '{"pet_id":"f47ac10b-58cc-4372-a567-0e02b2c3d479"}'
```

### Test Agent
```bash
curl -X POST http://localhost:3000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "goal": "Create a care plan for Milo",
    "pet_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479"
  }'
```

---

## 🐛 Troubleshooting

### PostgreSQL won't start
```bash
# Check if port 5432 is in use
lsof -i :5432

# Stop conflicting service
kill -9 <PID>

# Restart
docker compose up postgres
```

### OpenAI API errors
```
401 Unauthorized → Check API key in .env
429 Rate Limited → Wait or check rate limits
500 Server Error → Retry, check OpenAI status
```

### Database connection fails
```bash
# Check DATABASE_URL format
echo $DATABASE_URL

# Connect directly
psql $DATABASE_URL

# Verify postgres container
docker ps | grep postgres
```

### Can't access UI
```bash
# Check if service is running
curl http://localhost:3000

# Check logs
docker compose logs pawpilot

# Check port mapping
docker port pawpilot-app 3000
```

---

## 📝 Deployment Checklist

Before deploying to production:

- ✅ OpenAI API key is set
- ✅ Database password is secure
- ✅ .env file is in .gitignore
- ✅ Docker image builds successfully
- ✅ Health checks pass
- ✅ Database migrations complete
- ✅ All environment variables set
- ✅ Backups configured
- ✅ Logs are being collected
- ✅ Monitoring is enabled

---

## 📞 Support

- **Issues**: Check logs first (`docker compose logs`)
- **OpenAI**: https://help.openai.com
- **Docker**: https://docs.docker.com
- **PostgreSQL**: https://www.postgresql.org/docs

---

## 🎉 You're Ready!

**Your PawPilot v2.0 is ready to deploy!**

- ✅ OpenAI integrated
- ✅ Database configured
- ✅ Docker containerized
- ✅ Ready for production

**Next: Start with `docker compose up --build` 🚀**
