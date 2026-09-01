# PawPilot OpenAI Agent Setup

The natural-language chat uses the OpenAI Responses API from the Next.js server route `src/pages/api/agent.js`. The browser never receives the API key.

## Required environment variables

```text
OPENAI_API_KEY_PawPilot=<your project API key>
OPENAI_MODEL=gpt-5.6-luna
```

For Netlify, add these variables under the site's environment variables with **Functions** access and enable them for the deploy contexts you use (including **Deploy Previews** when testing a PR). Then redeploy the site so the server-side function receives the updated values.

## Security

Do not use `NEXT_PUBLIC_OPENAI_API_KEY`. OpenAI API keys must remain server-side. The client calls `/api/agent`; that route calls the OpenAI Responses API and executes PawPilot's local tools.

Do not commit `.env` files or real API keys. The repository `.gitignore` excludes local `.env` files, and `.env.example` contains placeholders only.

## Architecture

```text
Natural-language request
        |
        v
PawPilot /api/agent
        |
        v
OpenAI Responses API
        |
        +--> get_pet_profile
        +--> get_daily_needs
        +--> find_pet_services
        +--> find_pet_products
        +--> save_care_plan (confirmation required)
        |
        v
PawPilot result
```
