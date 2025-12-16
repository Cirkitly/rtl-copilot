---
description: Research domain ecosystem before creating roadmap
allowed-tools:
  - Task
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<!--
DESIGN NOTE: Pre-Roadmap Research

This command runs AFTER new-project and BEFORE create-roadmap.
It spawns batched subagents to research domain ecosystems in parallel.
Subagents write directly to .planning/research/ to preserve main context.

Flow: new-project → research-project (optional) → create-roadmap
-->

<objective>
Research domain ecosystem via batched subagents before roadmap creation.

Spawns 3-4 subagents in parallel to research:
- Ecosystem (libraries, frameworks, tools)
- Architecture (patterns, project structure)
- Pitfalls (common mistakes, what NOT to do)
- Standards (best practices, conventions)

Each subagent writes directly to `.planning/research/` preserving main context.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/research-project.md
@~/.claude/get-shit-done/templates/project-research.md
@~/.claude/get-shit-done/references/research-subagent-prompts.md
</execution_context>

<context>
**Load project vision:**
@.planning/PROJECT.md

**Check for existing research:**
!`ls .planning/research/ 2>/dev/null || echo "NO_RESEARCH_DIR"`
</context>

<process>

<step name="validate">
Check prerequisites:

```bash
# Verify .planning/ exists
[ -d .planning ] || { echo "No .planning/ directory. Run /gsd:new-project first."; exit 1; }

# Verify PROJECT.md exists
[ -f .planning/PROJECT.md ] || { echo "No PROJECT.md. Run /gsd:new-project first."; exit 1; }

# Check for existing research
[ -d .planning/research ] && echo "RESEARCH_EXISTS" || echo "NO_RESEARCH"
```

If RESEARCH_EXISTS:
```
Research already exists at .planning/research/

What would you like to do?
1. View existing research
2. Re-run research (overwrites existing)
3. Skip to create-roadmap
```

Wait for user decision.
</step>

<step name="detect_domain">
Parse PROJECT.md to identify the domain and research scope.

Look for:
- Technologies mentioned (Three.js, WebGL, audio, etc.)
- Problem domain (3D, games, real-time, etc.)
- Technical constraints that suggest specific ecosystems

If domain unclear, use AskUserQuestion:
- header: "Domain"
- question: "What domain should we research?"
- options:
  - "3D/Graphics" - Three.js, WebGL, shaders
  - "Games/Interactive" - Physics, collision, procedural
  - "Audio/Music" - Web Audio, synthesis, DSP
  - (other relevant options based on PROJECT.md)
</step>

<step name="research">
Follow research-project.md workflow:

1. Create `.planning/research/` directory
2. Spawn first batch of subagents (ecosystem + architecture)
3. Wait for completion
4. Spawn second batch (pitfalls + standards)
5. Wait for completion
6. Verify all outputs exist
</step>

<step name="summarize">
After all subagents complete:

```
Research complete:
- .planning/research/ecosystem.md
- .planning/research/architecture.md
- .planning/research/pitfalls.md
- .planning/research/standards.md

Key findings:
- [Top ecosystem recommendation]
- [Key architecture pattern]
- [Critical pitfall to avoid]

What's next?
1. Create roadmap (/gsd:create-roadmap) - Incorporates research
2. Review research files
3. Done for now
```

If user selects "Create roadmap" → invoke `/gsd:create-roadmap`
</step>

</process>

<output>
- `.planning/research/ecosystem.md`
- `.planning/research/architecture.md`
- `.planning/research/pitfalls.md`
- `.planning/research/standards.md`
</output>

<success_criteria>
- [ ] PROJECT.md exists (prerequisite checked)
- [ ] Domain detected or user clarified
- [ ] Subagents spawned in batches of 3-4 max
- [ ] All subagents wrote files directly to .planning/research/
- [ ] All 4 research files exist
- [ ] User knows next steps (create-roadmap)
</success_criteria>
