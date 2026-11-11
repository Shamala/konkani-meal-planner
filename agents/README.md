# Agents

Three agents work on this project. Each has a brief in this folder. None is running now.

| Agent | Brief | Writes | Status |
|---|---|---|---|
| Design | [design-agent.md](design-agent.md) | `DESIGN.md`, mock canvas | Done, questions decided (DECISIONS.md) |
| Development | [development-agent.md](development-agent.md) | `app/` | Engine built, no screens; stale against new decisions |
| Testing | [testing-agent.md](testing-agent.md) | `testing/` | Done, updated to 130 criteria, 0 blockers |

## How they fit together

- **Product rules** live in `REQUIREMENTS.md`. No agent changes them. An agent that finds a conflict reports it to the main thread.
- **Design** hands components and tokens to **Development** through `app/COMPONENTS.md`.
- **Testing** reads the same documents as the other two and checks them against each other.
- The main thread decides open questions and folds agent reports into the documents.

## Rules for all three

- Read `CLAUDE.md`. Only the Development agent may write application code, and only under `app/`.
- Do not start without the user's go-ahead.
- Stay in your own folders. Report cross-cutting findings instead of editing another agent's files.
- Report honestly what is unfinished or unverified.

## Resuming

All three stopped on a session rate limit and can be resumed with their original ids:

- Design: `a704f4cc57a5f0c4a`
- Development: `a785cac96bb4aa2bd`
- Testing: `af9dd45c82d3c9606`
