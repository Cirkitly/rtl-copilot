---
description: Initialize a new project with deep context gathering, PROJECT.md, roadmap, and state tracking
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

<!--
DESIGN NOTE: Command + Workflow Pattern

This command handles the questioning phase directly (user interaction intensive),
then delegates roadmap/state creation to the create-roadmap workflow.

Architecture:
- Command: new-project.md - questioning, PROJECT.md, config.json
- Workflow: create-roadmap.md - domain detection, research flags, ROADMAP.md, STATE.md
-->

<objective>
Initialize a new project through comprehensive context gathering.

This is the most leveraged moment in any project. Deep questioning here means better plans, better execution, better outcomes.

Creates `.planning/` with PROJECT.md, ROADMAP.md, STATE.md, and config.json.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/create-roadmap.md
@~/.claude/get-shit-done/references/principles.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/config.json
</execution_context>

<context>
!`[ -d .planning ] && echo "PLANNING_EXISTS" || echo "NO_PLANNING"`
!`[ -d .git ] && echo "GIT_EXISTS" || echo "NO_GIT"`
</context>

<process>

<step name="setup" silent="true">
Silent setup - execute before any user output:

```bash
# Abort if project exists
[ -d .planning ] && echo "Project already initialized. Use /gsd:progress" && exit 1

# Initialize git
[ -d .git ] || git init
```

</step>

<step name="question">
Start: "What do you want to build?"

Then use AskUserQuestion to cover the 9 domains (project type, problem, audience, success, constraints, scope, current state, decisions, open questions).

Skip domains already clear from user input. Probe for specifics on vague answers.

**Decision gate (MUST have all 3 options):**

```
Header: "Ready?"
Options:
  1. "Create PROJECT.md" - Finalize
  2. "Ask more questions" - Dig into uncovered domains
  3. "Let me add context" - User shares more
```

If "Ask more questions" → ask about 2-3 uncovered domains → return to gate.
Loop until "Create PROJECT.md" selected.
</step>

<step name="project">
Synthesize all context into `.planning/PROJECT.md` using the template from `templates/project.md`.

Do not compress. Capture everything gathered.
</step>

<step name="mode">
Ask workflow mode preference:

Use AskUserQuestion:

- header: "Mode"
- question: "How do you want to work?"
- options:
  - "Interactive" - Confirm at each step
  - "YOLO" - Auto-approve, just execute

Create `.planning/config.json` with chosen mode using `templates/config.json` structure.
</step>

<step name="roadmap_and_state">
**Follow the create-roadmap workflow** from `@~/.claude/get-shit-done/workflows/create-roadmap.md`.

This handles:

1. Domain expertise detection (scan for applicable skills)
2. Phase identification (3-6 phases based on PROJECT.md)
3. Research needs detection (flag phases needing investigation)
4. Phase confirmation (respects yolo/interactive mode)
5. ROADMAP.md creation with research flags
6. STATE.md initialization
7. Phase directory creation

The workflow will create:

- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/phases/XX-name/` directories
  </step>

<step name="commit">
```bash
git add .planning/
git commit -m "$(cat <<'EOF'
docs: initialize [project-name] ([N] phases)

[One-liner from PROJECT.md]

Phases:

1. [phase-name]: [goal]
2. [phase-name]: [goal]
3. [phase-name]: [goal]
   EOF
   )"

```
</step>

<step name="done">
```

Project initialized:

- Project: .planning/PROJECT.md
- Roadmap: .planning/ROADMAP.md ([N] phases)
- State: .planning/STATE.md
- Config: .planning/config.json (mode: [chosen mode])

What's next?

1. Plan Phase 1 (/gsd:plan-phase 01)
2. Review project setup
3. Done for now

```

If user selects "Plan Phase 1" → invoke `/gsd:plan-phase 01`
</step>

</process>

<output>
- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `.planning/config.json`
- `.planning/phases/XX-name/` directories
</output>

<success_criteria>
- [ ] Deep questioning completed (not rushed)
- [ ] PROJECT.md captures full context
- [ ] config.json has workflow mode
- [ ] ROADMAP.md has 3-6 phases with research flags
- [ ] STATE.md initialized with project summary
- [ ] Phase directories created
- [ ] All committed to git
</success_criteria>
```
