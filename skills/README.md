# Talaria Agent Skills

Agent skills for the Talaria observability loop: **Instrument → Observe → Investigate → Propose → Review → Verify**

## Current Skills

| Skill | Phase | When to Use |
|-------|-------|-------------|
| [`talaria-get-started`](talaria-get-started/SKILL.md) | **Observe** | Connect MCP, confirm org/project, first smoke read |
| [`talaria-triage-issue`](talaria-triage-issue/SKILL.md) | **Investigate** | Full investigation pack: trace, replay, suspects, optional GitHub |
| [`talaria-verify-fix`](talaria-verify-fix/SKILL.md) | **Verify** | Post-release: verify_fix verdict, optional status update |

## Research

See [`research/agent-skills-best-practice.md`](../research/agent-skills-best-practice.md) for evidence-based guidance on skill design, based on audits of Cursor/xAI standards, 10 production plugins (Sentry, Linear, Datadog, etc.), and academic research.

**Key Findings:**
- Current skills follow best practices (ordered steps, must-nots, human approval)
- Coverage: 50% of loop (Observe → Investigate → Verify)
- Gaps: **Instrument** (SDK setup) and **Propose** (fix generation)

**Recommendations:** Ship `talaria-instrument` (P0) and `talaria-propose-fix` (P1) to close the loop.
