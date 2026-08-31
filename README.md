# PawPilot 🐾

**An agent-ready pet care demo built for the WebMCP hackathon.**

PawPilot demonstrates a simple idea: instead of making a user navigate a collection of menus and forms, a web experience can expose useful capabilities to an agent. The agent can then discover and compose those capabilities into an actionable result while keeping the human in control of consequential actions.

## Demo story

Meet Milo, a fictional golden retriever. The user asks:

> What does Milo need today?

PawPilot uses a small capability surface to retrieve the pet profile, derive today's care needs, find relevant services, and save a care plan. The UI makes each tool operation visible.

## Architecture

```text
User
  │ natural-language goal
  ▼
PawPilot Web UI
  │
  ▼
Agent / WebMCP capability layer
  ├── get_pet_profile
  ├── get_daily_needs
  ├── find_pet_services
  ├── find_pet_products
  └── save_care_plan
  │
  ▼
Actionable care plan + transparent tool trace
```

## Hackathon thesis

**One human goal → multiple web capabilities → one coherent outcome.**

The pet theme is intentionally approachable; the underlying pattern generalizes to travel, shopping, scheduling, support, and other agentic web experiences.

## Status

MVP scaffold — WebMCP integration and production deployment are the next implementation steps.
