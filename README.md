# PawPilot

PawPilot is an agent-callable pet care workspace built with WebMCP, Next.js, and Netlify. It exposes structured tools for Dojo’s profile, daily care, services, products, and saved care plans while keeping write actions explicit and observable in the interface.

The application is designed for Microsoft Edge’s WebMCP implementation. It also exposes the same tools through HTTP endpoints for debugging and non-browser integrations.

## What It Does

- Registers six tools with `document.modelContext` when WebMCP is available.
- Shows incoming agent calls and their execution status in the dashboard.
- Normalizes empty, wrapped, stringified, camel-case, and snake-case tool arguments.
- Defaults pet-context calls to Dojo and daily-care calls to the current date.
- Validates tool input before executing application logic.
- Persists approved care plans in Netlify Database.

## Tools

| Tool | Purpose | Required input |
| --- | --- | --- |
| `get_pet_profile` | Returns Dojo’s profile, allergies, and notes | None |
| `get_daily_needs` | Returns Dojo’s daily care checklist | None |
| `find_pet_services` | Returns local service options | `serviceType` |
| `find_pet_products` | Returns product options | `category` |
| `save_care_plan` | Saves an approved care plan | `petId`, `plan`, `confirmed` |
| `list_care_plans` | Lists saved plans | None |
