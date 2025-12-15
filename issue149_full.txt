## Problem & Goals

Today, users pick “providers/models” (e.g., `openai:gpt-4.1`, `anthropic:claude-3.5-sonnet`). This is accurate but intimidating for non-technical users and doesn’t communicate trade-offs (speed, cost, strengths).
**Goal:** Introduce friendly, gamified “Model Personas” that represent our underlying LLMs with approachable names, icons/avatars, concise strengths, and clear trade-offs so users confidently choose the right option without learning vendor SKUs.

**Success signals**

* ↑ Model selection confidence (self-report) and ↓ abandonments on “Choose model” steps.
* ↑ Use of “Recommended” option; ↓ retries due to unconfigured/missing keys.
* Neutral or better task outcomes (latency, cost per quest) vs. control.

## In Scope

* Persona catalog for active models (OpenAI, Anthropic, etc.) with:

  * Display name, short tagline, avatar/icon, “best for” use cases, speed/cost badges, notes.
  * Clear mapping to provider + model ID (internal).
* UI/UX updates for model selection in:

  1. **Create Quest** flow
  2. **Investigations/AI runner**
  3. **Chat/Help** (if model is selectable)
* “Recommended” default based on context (e.g., quick draft vs. long reasoning).
* Fallback rendering if persona missing (show generic provider/model chip).
* Feature flag & A/B testing support.
* Analytics events (selection, hover, clicks, accepts Recommended).

## Out of Scope (Phase 1)

* Fine-tuning or prompt/retry policies per persona.
* Per-user custom persona editing.
* Artwork marketplace or user-uploaded avatars.

---

## User Stories & Acceptance Criteria

### US-1: Select a persona instead of a raw model

**As** a quest creator, **I want** to pick a friendly “character” with a short description **so that** I can choose confidently.

**Acceptance**

* **Given** I open Create Quest
  **When** I select model
  **Then** I see a grid/list of personas with: avatar, name, tagline, “Best for” (2–3 bullets), “Speed” and “Cost” badges, and a “Details” tooltip linking to advanced info.
* Each persona includes a tiny “info” popover with exact provider:model ID for transparency.
* Selecting a persona updates the internal `provider` + `modelId` on the request payload.

### US-2: Recommended choice

**As** a new user, **I want** a recommended persona based on my intent **so that** I don’t have to compare.

**Acceptance**

* **Given** I choose a typical intent (e.g., “Brainstorm”, “Summarize”, “Write long form”),
  **Then** a persona is preselected and labeled **Recommended** with a short reason (“Fast and low-cost for drafts”).
* A small link “Why recommended?” explains the heuristic (speed/cost/latency caps).

### US-3: Disabled/Unavailable handling

**As** any user, **I want** clear disabled states **so that** I don’t select unconfigured models.

**Acceptance**

* Personas for providers missing API keys are visible but **disabled** with an explanation (“This provider isn’t configured in this environment”).
* Selecting a disabled persona is blocked with guidance to admins.

### US-4: Fallback presentation

**As** any user, **I want** a safe fallback when persona metadata is missing **so that** I can still proceed.

**Acceptance**

* If persona metadata fails to load or is incomplete, UI shows a generic chip: `Provider • Model ID` with a neutral icon and a “Details” link.
* No hard errors; selection still works.

### US-5: Analytics & QA

**As** product, **I want** selection telemetry **so that** we can measure impact.

**Acceptance**

* Events: `model_persona_viewed`, `model_persona_hovered`, `model_persona_selected`, `model_persona_recommended_shown`, `model_persona_recommended_accepted`, with attributes `{ personaKey, provider, modelId, surface, environment }`.
* Dashboards show conversion from view → select, and breakouts by surface and environment.

---

## Information Architecture & UX

**Surfaces**

* **Create Quest:** Persona selector component placed where current model dropdown lives. Default to Recommended.
* **Investigations/Runner:** Same component in advanced options.
* **Chat/Help:** Compact persona switcher (popover) only if multiple models are enabled.

**Card Content (per persona)**

* Avatar/Icon (SVG/PNG), accessible alt text.
* Name (e.g., “Swift Scout”), short tagline (≤60 chars).
* “Best for” bullets (2–3).
* Badges: **Speed** (Fast/Faster/Fastest), **Cost** (Low/Medium/High), **Context** (Short/Medium/Long).
* Info popover: provider, model ID, release notes link (optional).

**Examples (illustrative)**

* **Swift Scout** → maps to a fast, budget model (good for brainstorming/drafts).
* **Strategist** → maps to a reasoning-strong model (good for complex planning).
* **Longbow** → maps to long-context model (good for large docs).
  (Exact mapping defined in seed data for current defaults.)

---

## Data Model & Config

Add Prisma model:

```prisma
model ModelPersona {
  id             String   @id @default(cuid())          // internal PK
  key            String   @unique                       // e.g. "swift-scout"
  provider       String
```

