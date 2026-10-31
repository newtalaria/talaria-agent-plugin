#!/usr/bin/env node
/**
 * Fail if skills reference unknown or deprecated Talaria MCP tool names.
 * Canonical list: scripts/mcp-tools.json (sync from dunatron/new_talaria docs/mcp-tools.json).
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skillsDir = join(root, "skills");
const catalogPath = join(root, "scripts", "mcp-tools.json");

const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
const allowed = new Set(catalog.tools ?? catalog.names);
const deprecated = new Set(catalog.deprecated ?? []);

/** Likely MCP tool names (not arbitrary backtick prose). */
function looksLikeToolName(name) {
  if (allowed.has(name) || deprecated.has(name)) return true;
  return /^(get_|list_|search_|create_|update_|add_|link_|unlink_|set_|send_|wait_|verify_|switch_|setup_)/.test(
    name,
  );
}

const skillFiles = readdirSync(skillsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => join(skillsDir, d.name, "SKILL.md"));

const toolPattern = /`([a-z][a-z0-9_]*)`/g;
const errors = [];

for (const file of skillFiles) {
  const text = readFileSync(file, "utf8");
  const seen = new Set();
  for (const match of text.matchAll(toolPattern)) {
    const name = match[1];
    if (seen.has(name)) continue;
    seen.add(name);
    if (!looksLikeToolName(name)) continue;

    if (deprecated.has(name)) {
      errors.push(`${file}: deprecated tool \`${name}\``);
    } else if (!allowed.has(name)) {
      errors.push(`${file}: unknown tool \`${name}\``);
    }
  }

  for (const bad of deprecated) {
    const re = new RegExp(`\`${bad}\`|\\b${bad}\\b`);
    if (re.test(text)) {
      errors.push(`${file}: references deprecated name ${bad}`);
    }
  }
}

if (errors.length) {
  const unique = [...new Set(errors)];
  console.error("check-skill-tools: FAILED\n" + unique.map((e) => `  - ${e}`).join("\n"));
  process.exit(1);
}

console.log(
  `check-skill-tools: OK (${allowed.size} tools, ${skillFiles.length} skills)`,
);
