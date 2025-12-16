---
description: Gather context for next milestone through adaptive questioning
---

<objective>
Help you figure out what to build in the next milestone through collaborative thinking.

Purpose: After completing a milestone, explore what features you want to add, improve, or fix. Features first — scope and phases derive from what you want to build.
Output: Context gathered, then routes to /gsd:new-milestone
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/discuss-milestone.md
</execution_context>

<context>
**Load project state first:**
@.planning/STATE.md

**Load roadmap:**
@.planning/ROADMAP.md

**Load milestones (if exists):**
@.planning/MILESTONES.md
</context>

<process>
1. Verify previous milestone complete (or acknowledge active milestone)
2. Present context from previous milestone (accomplishments, phase count)
3. Follow discuss-milestone.md workflow:
   - Ask: "What do you want to add, improve, or fix?"
   - Dig into features they mention
   - Help them articulate what matters most
   - Present decision gate (ready / ask more / let me add context)
4. Hand off to /gsd:new-milestone with gathered context
</process>

<success_criteria>

- Project state loaded and presented
- Previous milestone context summarized
- Milestone scope gathered through adaptive questioning
- Context handed off to /gsd:new-milestone
  </success_criteria>
