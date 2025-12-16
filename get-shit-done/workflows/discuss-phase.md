<purpose>
Gather phase context through collaborative thinking before planning. Help the user articulate their vision for how this phase should work, look, and feel.

You are a thinking partner, not an interviewer. The user is the visionary — you are the builder. Your job is to understand their vision, not interrogate them about technical details you can figure out yourself.
</purpose>

<philosophy>
**User = founder/visionary. Claude = builder.**

The user doesn't know (and shouldn't need to know):
- Codebase patterns (you read the code)
- Technical risks (you identify during research)
- Implementation constraints (you figure those out)
- Success metrics (you infer from the work)

The user DOES know:
- How they imagine it working
- What it should look/feel like
- What's essential vs nice-to-have
- Any specific things they have in mind

Ask about vision. Figure out implementation yourself.
</philosophy>

<process>

<step name="validate_phase" priority="first">
Phase number: $ARGUMENTS (required)

Validate phase exists in roadmap:

```bash
if [ -f .planning/ROADMAP.md ]; then
  cat .planning/ROADMAP.md | grep "Phase ${PHASE}:"
else
  cat .planning/ROADMAP.md | grep "Phase ${PHASE}:"
fi
```

**If phase not found:**

```
Error: Phase ${PHASE} not found in roadmap.

Use /gsd:progress to see available phases.
```

Exit workflow.

**If phase found:**
Parse phase details from roadmap:

- Phase number
- Phase name
- Phase description
- Status (should be "Not started" or "In progress")

Continue to check_existing.
</step>

<step name="check_existing">
Check if CONTEXT.md already exists for this phase:

```bash
ls .planning/phases/${PHASE}-*/CONTEXT.md 2>/dev/null
ls .planning/phases/${PHASE}-*/${PHASE}-CONTEXT.md 2>/dev/null
```

**If exists:**

```
Phase ${PHASE} already has context: [path to CONTEXT.md]

What's next?
1. Update context - Review and revise existing context
2. View existing - Show me the current context
3. Skip - Use existing context as-is
```

Wait for user response.

If "Update context": Load existing CONTEXT.md, continue to questioning
If "View existing": Read and display CONTEXT.md, then offer update/skip
If "Skip": Exit workflow

**If doesn't exist:**
Continue to questioning.
</step>

<step name="questioning">
Present initial context from roadmap:

```
Phase ${PHASE}: ${PHASE_NAME}

From the roadmap: ${PHASE_DESCRIPTION}

How do you imagine this working?
```

Let them talk. Don't interrupt with clarifying questions yet.

Then follow the conversation arc:

**1. Follow the thread**

Whatever they said — dig into it. What excites them? What matters most?

- "You mentioned [X] — what would that actually look like?"
- "When you imagine using this, what happens?"
- "Tell me more about [specific thing they mentioned]"

**2. Sharpen the core**

Help them distinguish essential from nice-to-have FOR THIS PHASE.

- "What's the most important part of this phase?"
- "If we could only nail one thing here, what would it be?"
- "Is [Y] essential for this phase or could it come later?"

**3. Find boundaries**

What is this phase NOT doing? Helps prevent scope creep during planning.

- "What's explicitly out of scope for this phase?"
- "Where does this phase end and the next begin?"

**4. Capture specifics (only if they have them)**

If they have specific ideas about look/feel/behavior, capture them. Don't force this.

- "Any specific things you have in mind for how this should work?"
- "Anything you've seen elsewhere that's close to what you want?"

CRITICAL — What NOT to ask:
- Technical risks (you figure those out)
- Codebase patterns (you read the code)
- Success metrics (too corporate)
- Constraints they didn't mention (don't interrogate)
- "What could go wrong?" (your job to identify)
- "What existing code should I follow?" (you read the code)

When you feel you understand their vision, use AskUserQuestion:

- header: "Ready?"
- question: "Ready to capture this context, or explore more?"
- options (ALL THREE REQUIRED):
  - "Create CONTEXT.md" - I've shared my vision
  - "Ask more questions" - Help me think through this more
  - "Let me add context" - I have more to share

If "Ask more questions" → dig into areas that seem unclear → return to gate.
If "Let me add context" → receive input → return to gate.
Loop until "Create CONTEXT.md" selected.
</step>

<step name="write_context">
Create CONTEXT.md capturing the user's vision.

Use template from ~/.claude/get-shit-done/templates/context.md

**File location:** `.planning/phases/${PHASE}-${SLUG}/${PHASE}-CONTEXT.md`

**If phase directory doesn't exist yet:**
Create it: `.planning/phases/${PHASE}-${SLUG}/`

Use roadmap phase name for slug (lowercase, hyphens).

Populate template sections with VISION context (not technical analysis):

- `<vision>`: How the user imagines this working
- `<essential>`: What must be nailed in this phase
- `<boundaries>`: What's explicitly out of scope
- `<specifics>`: Any particular look/feel/behavior mentioned
- `<notes>`: Any other context gathered

Do NOT populate with your own technical analysis. That comes during research/planning.

Write file.
</step>

<step name="confirm_creation">
Present CONTEXT.md summary:

```
Created: .planning/phases/${PHASE}-${SLUG}/${PHASE}-CONTEXT.md

## Vision
[How they imagine it working]

## Essential
[What must be nailed]

## Boundaries
[What's out of scope]

What's next?
1. Research this phase (/gsd:research-phase ${PHASE}) - Investigate codebase, identify patterns and risks
2. Plan this phase (/gsd:plan-phase ${PHASE}) - Skip research, go straight to planning
3. Review/edit CONTEXT.md - Make adjustments
4. Done for now
```

</step>

</process>

<success_criteria>

- Phase validated against roadmap
- Vision gathered through collaborative thinking (not interrogation)
- User's imagination captured: how it works, what's essential, what's out of scope
- CONTEXT.md created in phase directory
- User knows next steps (typically: research or plan the phase)
</success_criteria>
