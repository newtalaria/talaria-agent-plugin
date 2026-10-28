# Talaria agent plugin

Hosted [Talaria](https://www.newtalaria.com) MCP plus skills so Grok Bot, Cursor, and Grok Build can investigate production errors, traces, and replays — then triage issues and verify fixes after a release.

**MCP:** `https://api.newtalaria.com/mcp` (Streamable HTTP, OAuth 2.1 with PKCE)

No secrets live in this plugin. Agents sign in with OAuth (or a personal Bearer token from **Settings → Integrations**). **Never** use an ingest key (`tal_live_…`) — `/mcp` rejects them.

---

## Install

### Grok Bot (Connect apps)

1. Open **Connect apps** in Grok Bot.
2. Search **Talaria** (handle `talaria`) once the marketplace listing is approved — **or** add a custom MCP server named `Talaria` at `https://api.newtalaria.com/mcp`.
3. Confirm → authorise in the browser → choose your organisation.
4. Ask something like: *“What are the top open errors in production?”*

Setup guide: [newtalaria.com/mcp](https://www.newtalaria.com/mcp?client=grok)

### Cursor

1. Install this plugin from the Cursor Marketplace (or clone this repo and load it as a local plugin).
2. Cursor registers the `talaria` MCP server from `mcp.json`.
3. Complete OAuth when prompted.
4. Skills under `skills/` teach get-started → triage → verify-fix.

Docs: [MCP for Cursor](https://www.newtalaria.com/docs/mcp/cursor)

### Grok Build

Once listed in [`xai-org/plugin-marketplace`](https://github.com/xai-org/plugin-marketplace), install by plugin name `talaria` (SHA-pinned remote source). Until then, point Grok Build at this repository’s tip.

---

## Skills

| Skill | When to use |
| --- | --- |
| `talaria-get-started` | Connect, confirm org/project, first smoke read |
| `talaria-triage-issue` | Investigate one issue (pack → trace/replay/suspects → optional GitHub) |
| `talaria-verify-fix` | After a release: `verify_fix` verdict, optional status update |

Closed loop: **get-started → triage-issue → verify-fix**.

---

## Auth & scopes

| Method | Notes |
| --- | --- |
| **OAuth** (preferred) | Browser sign-in; scopes `mcp:read` / `mcp:write` / `mcp:keys` |
| **Personal token** | Settings → Integrations; send as `Authorization: Bearer …` |

Write includes read; keys includes write. Skills ask before any write tool.

**Do not** paste `tal_live_…` ingest keys into MCP clients.

---

## MCP URLs

| URL | Behaviour |
| --- | --- |
| `https://api.newtalaria.com/mcp` | All orgs you belong to |
| `https://api.newtalaria.com/mcp/<org>` | One organisation |
| `https://api.newtalaria.com/mcp/<org>/<project>` | One project |
| `…?readonly=true` | Read tools only |
| `…?toolsets=issues,performance` | Limit tool groups |

Always-on toolsets: `docs`, `connection`. Others: `projects`, `keys`, `issues`, `events`, `performance`, `analytics`, `flags`, `ops`.

---

## Repository layout

```
.cursor-plugin/plugin.json   # Cursor marketplace manifest
.grok-plugin/plugin.json     # Grok Build style manifest
mcp.json                     # MCP server wiring
skills/                      # Agent skills (closed loop)
assets/logo.png              # 512×512 mark on solid plate
LICENSE                      # MIT · Talaria Labs
```

---

## Links

- Product MCP page: https://www.newtalaria.com/mcp
- Docs: https://www.newtalaria.com/docs/mcp
- Privacy: https://www.newtalaria.com/legal/privacy
- This repo: https://github.com/newtalaria/talaria-grok-plugin

## License

MIT © Talaria Labs
