<questioning_guide>
The initialization questioning phase is the most leveraged moment in any project. Context gathered here flows through every downstream decision. Don't rush it.

<domains>
Ask about gaps - skip what's already clear from user input.

<project_type>
What kind of thing is this?
- Product/app (software for users)
- Automation/tool (system to automate a process)
- Research/analysis (investigation or learning)
- Creative work (content, art, media)
</project_type>

<problem_motivation>
Why does this need to exist?
- What pain point?
- What gap in current solutions?
- What opportunity?
- What's the current state without this?
</problem_motivation>

<audience>
Who is this for?
- Just the user (personal tool)
- Their team (internal use)
- Specific user segment (targeted audience)
- General public (broad availability)
</audience>

<success_criteria>
What does "done" look like?
- Must be measurable/verifiable
- Not vague ("make it good")
- Specific outcomes, not activities
</success_criteria>

<constraints>
What limits exist?
- Tech stack (must use X, can't use Y)
- Timeline (deadline, urgency)
- Resources (budget, team size)
- Dependencies (needs X to exist first)
- Compatibility (must work with Y)
</constraints>

<scope_boundaries>
What are you NOT building?
- Explicit exclusions prevent creep
- "Not in v1" is valid
- Helps focus on what matters
</scope_boundaries>

<current_state>
What exists already?
- Greenfield (nothing exists)
- Brownfield (existing code/system)
- Prior attempts (what was tried, what failed)
- Related work (adjacent systems)
</current_state>

<technical_decisions>
Any already made?
- Framework choices
- Architecture patterns
- Key libraries
- Deployment target
</technical_decisions>

<open_questions>
What's still unclear?
- Known unknowns
- Decisions deferred
- Areas needing research
</open_questions>
</domains>

<mechanics>

<ask_user_question_tool>
Every follow-up question uses structured options:
- 2-4 choices per question
- Always include "Other" or "Let me explain"
- Options should be mutually exclusive when possible
</ask_user_question_tool>

<assess_after_round>
After receiving answers, evaluate completeness:

**Critical gaps exist:**
- State the gap clearly
- Ask about it immediately
- Don't offer to finalize yet

**Sufficient context:**
- Acknowledge what's gathered
- Note optional areas could explore
- Offer choice: finalize or dig deeper

**Comprehensive:**
- Acknowledge depth
- Offer to finalize
- Only edge cases remain
</assess_after_round>

<decision_gate_pattern>

**CRITICAL: Always present ALL THREE options. Never skip "Ask more questions".**

Use AskUserQuestion with exactly these options:

```
Header: "Ready?"
Question: "Ready to create PROJECT.md, or explore more?"
Options (ALL THREE REQUIRED):
  1. "Create PROJECT.md" - Finalize and continue
  2. "Ask more questions" - I'll dig into areas we haven't covered
  3. "Let me add context" - You have more to share
```

If user selects "Ask more questions":
- Identify domains not yet covered from the 9 domains list
- Ask about 2-3 of them
- Return to decision gate

Loop until "Create PROJECT.md" selected.
</decision_gate_pattern>
</mechanics>

<anti_patterns>

- **Rushing** - Don't minimize questions to get to "the work"
- **Assuming** - Don't fill gaps with assumptions, ask
- **Leading** - Don't push toward a preferred answer
- **Repeating** - Don't ask about what user already provided
- **Shallow** - Don't accept vague answers, probe for specifics
</anti_patterns>
</questioning_guide>
