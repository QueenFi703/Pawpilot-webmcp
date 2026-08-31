# PawPilot Architecture

## Goal

Show how a web experience can expose task-oriented capabilities to an agent through WebMCP, with visible tool activity and explicit human approval for consequential actions.

## Components

### 1. Pet experience
The web UI presents Milo's profile and a conversational task surface. It is deliberately simple so the WebMCP capability model is the focus.

### 2. Capability layer
The site exposes small, typed operations:

- `get_pet_profile` — returns the current pet profile.
- `get_daily_needs` — returns a deterministic care checklist from profile data.
- `find_pet_services` — returns demo service options relevant to the request.
- `find_pet_products` — returns demo supply options.
- `save_care_plan` — persists a generated plan after user confirmation.

### 3. Agent
The agent interprets the user's goal and composes capabilities. It should prefer read-only tools first and ask for confirmation before writes or external commitments.

### 4. Transparency
Every tool call is rendered in the UI with status, input summary, and result summary. This makes the agent's work inspectable during the hackathon demo.

## Data flow

```text
Goal
 → discover/identify capability
 → call read-only tools
 → synthesize result
 → request approval if action is consequential
 → write/update
 → show outcome
```

## Demo constraints

The MVP uses fictional pet and service data. It does not provide veterinary diagnosis or real-world medical advice. Real integrations can be added later without changing the core capability pattern.
