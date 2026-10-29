# Changelog

## 0.2.2 — 2026-10-29

Repository renamed to newtalaria/talaria-agent-plugin (old URL redirects). No functional changes.

## 0.2.1 — 2026-10-29

### Fixed

- Root `mcp.json` now declares `"type": "streamable-http"`, so it validates against the Agent Plugins 1.0 MCP schema. GitHub Copilot CLI and VS Code agent plugins previously skipped the untyped entry and installed only the skills; they now wire up the hosted MCP too. `.mcp.json` (Claude Code / Grok Build) and `gemini-extension.json` are unchanged.

## 0.2.0 — 2026-10-29

Added instrumentation and observability skills to complete the sold agentic loop.

### Added

- `talaria-instrument`: Add Talaria SDK, create project/key, wire SDK from docs, send first test event, verify ingest
- `talaria-observe-performance`: Read-only health and performance overview (stats, traces, spans, queries, sessions, monitors)

### Improved

- Updated `talaria-get-started`, `talaria-triage-issue`, and `talaria-verify-fix` with cross-links to new skills
- Enhanced skill descriptions with clearer boundaries and hand-offs

Loop now covers: **get-started → instrument → observe → triage → verify-fix**

## 0.1.0 — 2026-10-29

Initial public release.

- Hosted Talaria MCP at `https://api.newtalaria.com/mcp` (Streamable HTTP, OAuth)
- Skills: `talaria-get-started`, `talaria-triage-issue`, `talaria-verify-fix`
- Cursor (`.cursor-plugin`) and Grok Build (`.grok-plugin`) manifests
- MIT license · Talaria Labs
