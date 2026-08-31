# PawPilot Docker Cloud Deployment Guide

## Prerequisites

1. **Docker Hub Account**: https://hub.docker.com (free)
2. **Docker Cloud Account**: https://cloud.docker.com
3. **OpenAI API Key**: https://platform.openai.com/api-keys

## Step 1: Build and Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Build image
docker build -t yourname/pawpilot:latest .

# Tag for version
docker tag yourname/pawpilot:latest yourname/pawpilot:v2.0

# Push to Docker Hub
docker push yourname/pawpilot:latest
docker push yourname/pawpilot:v2.0
```

## Step 2: Create Docker Cloud Stack

1. Go to https://cloud.docker.com
2. Click "Create" → "Stack"
3. Paste the docker-compose.yml content
4. Set environment variables:
   ```
   OPENAI_API_KEY=sk-your-key
   POSTGRES_PASSWORD=your-secure-password
   ```
5. Click "Create Stack"

## Step 3: Configure for Production

### Environment Variables (Set in Docker Cloud)
```
NODE_ENV=production
OPENAI_API_KEY=sk-xxx
DATABASE_URL=postgresql://user:pass@postgres:5432/pawpilot
POSTGRES_USER=pawpilot
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=pawpilot
LOG_LEVEL=info
```

### Resource Limits (Recommended)
- **Memory**: 512MB minimum for app, 1GB for database
- **CPU**: 0.5 CPU minimum
- **Storage**: 10GB for database volume

## Step 4: Access Your Deployment

1. Get the service URL from Docker Cloud
2. Visit: `https://your-service-url.cloud.docker.com`
3. Or use the public IP if available

## Monitoring

### Health Checks
The application includes health checks at `/health` endpoint:
```bash
curl https://your-app-url/health
```

### Database Connection
```bash
docker exec pawpilot-postgres \
  psql -U pawpilot -d pawpilot -c "SELECT COUNT(*) FROM pets;"
```

### Logs
```bash
docker logs pawpilot-app
docker logs pawpilot-postgres
```

## Scaling

### Horizontal Scaling
In Docker Cloud dashboard:
1. Select pawpilot service
2. Increase "Replicas" count
3. Load balancer automatically distributes traffic

### Database Backups
```bash
docker exec pawpilot-postgres \
  pg_dump -U pawpilot pawpilot > backup.sql
```

## Troubleshooting

### App won't start
1. Check env variables are set correctly
2. Verify OPENAI_API_KEY is valid
3. Check logs: `docker logs pawpilot-app`

### Database connection fails
1. Verify DATABASE_URL format
2. Check postgres container is healthy
3. Ensure password is correct

### High memory usage
1. Increase container memory limit
2. Enable autoscaling in Docker Cloud
3. Monitor with Docker Cloud metrics dashboard

## Security Best Practices

1. ✅ Use environment variables for secrets
2. ✅ Enable container registry scanning
3. ✅ Use private registry if needed
4. ✅ Enable HTTPS (Docker Cloud provides SSL)
5. ✅ Set resource limits
6. ✅ Use health checks
7. ✅ Regular database backups

## CI/CD Integration

### GitHub Actions Integration
```yaml
name: Deploy to Docker Cloud

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: docker/build-push-action@v4
        with:
          push: true
          tags: yourname/pawpilot:latest
          context: Pawpilot-webmcp
```

## Cost Estimation (Docker Cloud)

- **Compute**: $0-5/month (free tier available)
- **Database**: $0-20/month (RDS better for production)
- **Storage**: $0-5/month
- **Bandwidth**: ~$1-5/month
- **Total**: $5-35/month (starter)

## Production Checklist

- ✅ API key is secure (use secrets manager)
- ✅ Database has backups enabled
- ✅ HTTPS is configured
- ✅ Health checks are passing
- ✅ Monitoring is set up
- ✅ Logs are being collected
- ✅ Rate limiting is configured
- ✅ Database has indexes
- ✅ Container image is up-to-date

---

## Next Steps

1. **Push image**: `docker push yourname/pawpilot`
2. **Create stack**: Go to Docker Cloud → Create Stack
3. **Deploy**: Click "Create Stack"
4. **Test**: Visit the service URL
5. **Monitor**: Check Docker Cloud dashboard

For more info: https://docs.docker.com/cloud/
