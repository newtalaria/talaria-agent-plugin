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
4. Ask something like: *"What are the top open errors in production?"*

Setup guide: [newtalaria.com/mcp](https://www.newtalaria.com/mcp?client=grok)

### Cursor

Install from [cursor.directory/plugins/talaria](https://cursor.directory/plugins/talaria), or add the MCP server manually by following [the Cursor setup guide](https://www.newtalaria.com/docs/mcp/cursor).

Skills under `skills/` teach get-started → triage → verify-fix.

### VS Code / GitHub Copilot

**Option 1: Install via link** (opens VS Code)

[Install in VS Code](https://insiders.vscode.dev/redirect/mcp/install?name=talaria&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fapi.newtalaria.com%2Fmcp%22%7D)

For VS Code Insiders, [use this link](https://insiders.vscode.dev/redirect/mcp/install?name=talaria&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A%2F%2Fapi.newtalaria.com%2Fmcp%22%7D&quality=insiders).

**Option 2: Command line**

```bash
code --add-mcp '{"name":"talaria","type":"http","url":"https://api.newtalaria.com/mcp"}'
```

**Option 3: MCP Gallery** (when listed)

Search for `@mcp talaria` in the Extensions view, or run **MCP: Add Server → Browse MCP Servers…**

### GitHub Copilot CLI

Once listed in [awesome-copilot](https://github.com/github/awesome-copilot):

```bash
copilot plugin install talaria@awesome-copilot
```

Or install directly from this repo:

```bash
copilot plugin install newtalaria/talaria-grok-plugin
```

### Claude Code

**Step 1:** Add the self-hosted marketplace

```bash
claude plugin marketplace add newtalaria/talaria-grok-plugin
```

**Step 2:** Install the plugin

```bash
claude plugin install talaria@newtalaria
```

Anthropic directory listing pending.

### Gemini CLI

```bash
gemini extensions install https://github.com/newtalaria/talaria-grok-plugin
```

The extension will appear in the gallery at [geminicli.com/extensions](https://geminicli.com/extensions/browse/) once the repo has the `gemini-cli-extension` topic.

### Grok Build

Once listed in [`xai-org/plugin-marketplace`](https://github.com/xai-org/plugin-marketplace), install by plugin name `talaria` (SHA-pinned remote source). Until then, point Grok Build at this repository's tip.

---

## Skills

| Skill | When to use |
| --- | --- |
| `talaria-get-started` | Connect, confirm org/project, first smoke read |
| `talaria-instrument` | Add Talaria SDK, create project/key, send first test event |
| `talaria-observe-performance` | Read project health, traces, spans, queries, sessions, monitors |
| `talaria-triage-issue` | Investigate one issue (pack → trace/replay/suspects → optional GitHub) |
| `talaria-verify-fix` | After a release: `verify_fix` verdict, optional status update |

Closed loop: **get-started → instrument → observe → triage → verify-fix**.

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
plugin.json                  # Agent Plugins 1.0 manifest (VS Code, Copilot CLI, Cursor)
mcp.json                     # Agent Plugins MCP wiring (type: streamable-http)
.cursor-plugin/plugin.json   # Cursor plugin manifest
.grok-plugin/plugin.json     # Grok Build style manifest
.claude-plugin/              # Claude Code plugin + self-hosted marketplace
.mcp.json                    # MCP wiring for Claude Code / Grok Build (type: http)
gemini-extension.json        # Gemini CLI extension (httpUrl)
server.json                  # Official MCP Registry entry
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
