# PawPilot OpenAI Agent Setup

The natural-language chat uses the OpenAI Responses API from the Next.js server route `src/pages/api/agent.js`. The browser never receives the API key.

## Required environment variables

```text
OPENAI_API_KEY=<your project API key>
OPENAI_MODEL=gpt-5.6-luna
```

For Netlify, add both variables under the site's environment variables, then redeploy the `feat/natural-language-agent-layer` branch (or merge the PR into the production branch).

## Security

Do not use `NEXT_PUBLIC_OPENAI_API_KEY`. OpenAI API keys must remain server-side. The client calls `/api/agent`; that route calls the OpenAI Responses API and executes PawPilot's local tools.

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
