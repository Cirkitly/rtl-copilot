---
description: Initialize a new project with deep context gathering and PROJECT.md
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

<objective>
Initialize a new project through comprehensive context gathering.

This is the most leveraged moment in any project. Deep questioning here means better plans, better execution, better outcomes.

Creates `.planning/` with PROJECT.md and config.json.
</objective>

<execution_context>
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
**CRITICAL: ALL questions use AskUserQuestion. Never ask inline text questions.**

**1. Open:**

Use AskUserQuestion:
- header: "Vision"
- question: "What do you want to build?"
- options: Contextual options if you have any hints, otherwise ["New app/tool", "Feature for existing project", "Let me describe it"]

**2. Follow the thread:**

Based on their response, use AskUserQuestion with options that probe what they mentioned:
- header: "[Topic they mentioned]"
- question: "You mentioned [X] — what would that look like?"
- options: 2-3 interpretations + "Something else"

**3. Sharpen the core:**

Use AskUserQuestion:
- header: "Core"
- question: "If you could only nail one thing, what would it be?"
- options: Key aspects they've mentioned + "All equally important" + "Something else"

**4. Find boundaries:**

Use AskUserQuestion:
- header: "Scope"
- question: "What's explicitly NOT in v1?"
- options: Things that might be tempting + "Nothing specific" + "Let me list them"

**5. Ground in reality:**

Use AskUserQuestion:
- header: "Constraints"
- question: "Any hard constraints?"
- options: Relevant constraint types + "None" + "Yes, let me explain"

**6. Decision gate:**

Use AskUserQuestion:
- header: "Ready?"
- question: "Ready to create PROJECT.md, or explore more?"
- options (ALL THREE REQUIRED):
  - "Create PROJECT.md" - Finalize and continue
  - "Ask more questions" - I'll dig deeper
  - "Let me add context" - You have more to share

If "Ask more questions" → check coverage gaps from `questioning.md` → return to step 2.
If "Let me add context" → receive input via their response → return to step 2.
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

<step name="commit">
```bash
git add .planning/PROJECT.md .planning/config.json
git commit -m "$(cat <<'EOF'
docs: initialize [project-name]

[One-liner from PROJECT.md]

Creates PROJECT.md with vision and requirements.
EOF
)"

```
</step>

<step name="done">
Present completion inline (not as a question):

```
Project initialized:

- Project: .planning/PROJECT.md
- Config: .planning/config.json (mode: [chosen mode])

What's next?

1. Research domain ecosystem (/gsd:research-project) - For niche/complex domains
2. Create roadmap (/gsd:create-roadmap) - Skip research, go straight to planning
3. Done for now
```

Note: Commands are shown in the options above so the user can see what to run in a fresh context.

**If user selects option 1:** invoke `/gsd:research-project`
**If user selects option 2:** invoke `/gsd:create-roadmap`
</step>

</process>

<output>
- `.planning/PROJECT.md`
- `.planning/config.json`
</output>

<success_criteria>
- [ ] Deep questioning completed (not rushed)
- [ ] PROJECT.md captures full context
- [ ] config.json has workflow mode
- [ ] All committed to git
</success_criteria>
```
