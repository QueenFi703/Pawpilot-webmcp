# 🔑 OpenAI Integration Setup Guide

## Getting Your OpenAI API Key

### Step 1: Create OpenAI Account
1. Visit https://platform.openai.com/signup
2. Sign up with email or Google/Microsoft account
3. Verify your email
4. Add payment method (required for API access)

### Step 2: Generate API Key
1. Go to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Name it "PawPilot" or similar
4. Copy the key (you'll only see it once!)

### Step 3: Add to Environment

#### Option A: Local Development
Create `.env` file in `Pawpilot-webmcp/`:
```env
OPENAI_API_KEY=sk-your-api-key-here
```

#### Option B: Docker Local
```bash
docker run -p 3000:3000 \
  -e OPENAI_API_KEY=sk-your-api-key \
  pawpilot:latest
```

#### Option C: Docker Compose
Create `.env` file:
```env
OPENAI_API_KEY=sk-your-api-key-here
POSTGRES_PASSWORD=your-secure-password
```

Then:
```bash
docker compose up --build
```

#### Option D: Docker Cloud
1. Go to Docker Cloud
2. Select PawPilot stack
3. Go to "Services" → "Environment"
4. Add `OPENAI_API_KEY=sk-your-key`
5. Redeploy

## OpenAI Models Available

### For PawPilot (Recommended)
```
Model: gpt-4-turbo
- Most capable
- Best for complex orchestration
- Costs: ~$0.03/1K input, $0.06/1K output

Model: gpt-3.5-turbo
- Faster, cheaper
- Good for simpler tasks
- Costs: ~$0.0005/1K input, $0.0015/1K output
```

### Change Model
Edit `src/server.ts`:
```typescript
// Line 115 - Change model name
model: "gpt-3.5-turbo"  // or "gpt-4-turbo"
```

## Pricing & Costs

### Token Counting
- 1 token ≈ 4 characters
- Prices per 1,000 tokens (1K tokens)

### Example Costs
```
Daily usage:
- 100 orchestration calls × 500 tokens avg = 50,000 tokens
- GPT-4: $50,000 tokens × $0.045/1K = $2.25/day
- GPT-3.5: $50,000 tokens × $0.002/1K = $0.10/day
```

### Cost Optimization
1. Use `gpt-3.5-turbo` for faster, cheaper operations
2. Implement caching for common queries
3. Limit context length
4. Batch requests when possible

## API Limits

### Rate Limits (Free Tier)
- 3 requests/minute
- 200 requests/day

### Rate Limits (Paid)
- 3,500 requests/minute (depends on plan)
- Token limits increase with usage

### Increase Limits
1. Go to https://platform.openai.com/account/billing/overview
2. Set usage limits
3. Contact support for higher limits

## Monitoring Usage

### Check Billing
1. Go to https://platform.openai.com/account/billing/overview
2. View current month costs
3. Set usage alerts

### API Usage Dashboard
1. Go to https://platform.openai.com/account/api-keys
2. Click "Usage" to see daily breakdown

## Error Handling

### Common Errors

**401 Unauthorized**
- Invalid API key
- Solution: Check key in `.env`

**429 Rate Limited**
- Too many requests
- Solution: Implement backoff, use lower rate

**500 Server Error**
- OpenAI service issue
- Solution: Retry, check status page

**Context Length Exceeded**
- Input too long for model
- Solution: Reduce input size or use GPT-4

## Security Best Practices

✅ **DO:**
- Store key in environment variable
- Use `.env` file locally (add to `.gitignore`)
- Rotate keys regularly
- Use separate keys for dev/prod
- Monitor for unexpected usage

❌ **DON'T:**
- Commit keys to git
- Share keys via email/chat
- Use same key across projects
- Log API keys
- Expose in frontend

## Secure Deployment

### Local (Development)
```bash
# .env file (gitignore'd)
OPENAI_API_KEY=sk-xxx
```

### Docker (Development)
```bash
docker run -e OPENAI_API_KEY=sk-xxx pawpilot:latest
```

### Docker Compose (Development)
```bash
# .env file (gitignore'd)
OPENAI_API_KEY=sk-xxx
```

### Docker Cloud (Production)
1. Use Docker Cloud secrets
2. Set as environment variables
3. Never expose in compose files
4. Use CI/CD for injection

### Environment File Examples

#### `.env` (Local)
```
OPENAI_API_KEY=sk-example-key-12345
POSTGRES_PASSWORD=secure-password
NODE_ENV=development
LOG_LEVEL=debug
```

#### `.env.production` (Production)
```
OPENAI_API_KEY=sk-prod-key-67890
POSTGRES_PASSWORD=very-secure-production-password
NODE_ENV=production
LOG_LEVEL=info
```

## Testing Your Integration

### Check API Key
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-key"
```

### Test Agent
```bash
curl -X POST http://localhost:3000/api/agent/orchestrate \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": "milo",
    "goal": "What does Milo need today?"
  }'
```

### Check Connection
```bash
npm run dev
# Should see: "OpenAI Integration: Active"
```

## Troubleshooting

### Key not working
1. Verify key format (starts with `sk-`)
2. Check it's not revoked in settings
3. Ensure billing is set up
4. Wait 5 minutes after creation

### High costs
1. Check usage dashboard
2. Reduce model complexity
3. Implement caching
4. Lower request frequency

### Slow responses
1. Use `gpt-3.5-turbo` for faster
2. Reduce context length
3. Implement streaming (optional)

## Support

- **Docs**: https://platform.openai.com/docs
- **Status**: https://status.openai.com
- **Contact**: https://help.openai.com

---

**You're all set! Your OpenAI integration is ready.** 🚀
