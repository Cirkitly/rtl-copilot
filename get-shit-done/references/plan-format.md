<overview>
Claude-executable plans have a specific format. This reference defines what makes a plan executable vs. vague.

**Core principle:** A plan is Claude-executable when Claude can read PLAN.md and immediately start implementing without clarifying questions. If Claude has to guess or interpret - the task is too vague.
</overview>

<task_anatomy>

Every task has four required fields:

**files** - Exact paths created/modified
- Good: `src/app/api/auth/login/route.ts`
- Bad: "the auth files"

**action** - Specific implementation with pitfalls to avoid
- Good: "POST endpoint accepting {email, password}. Query User by email, compare with bcrypt. Return JWT in httpOnly cookie (15-min expiry). Use jose (not jsonwebtoken - CommonJS issues with Edge)."
- Bad: "Add authentication"

**verify** - Executable proof of completion
- Good: `curl -X POST /api/auth/login` returns 200 with Set-Cookie header
- Bad: "It works"

**done** - Measurable acceptance criteria
- Good: "Valid credentials → 200 + cookie. Invalid → 401."
- Bad: "Authentication complete"

</task_anatomy>

<task_types>

**type="auto"** (default) - Claude executes autonomously
```xml
<task type="auto">
  <name>Task 1: Create login endpoint</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>POST accepting {email, password}. bcrypt compare, JWT via jose, httpOnly cookie.</action>
  <verify>curl returns 200 with Set-Cookie</verify>
  <done>Valid → 200 + cookie. Invalid → 401.</done>
</task>
```

**type="checkpoint:human-verify"** - Human confirms Claude's work
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>Responsive dashboard at /dashboard</what-built>
  <how-to-verify>1. npm run dev 2. Visit localhost:3000/dashboard 3. Test mobile/tablet/desktop</how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>
```

**type="checkpoint:decision"** - Human makes implementation choice
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>Select auth provider</decision>
  <context>Need user auth with different tradeoffs.</context>
  <options>
    <option id="supabase"><name>Supabase</name><pros>Built-in, free</pros><cons>Ecosystem lock-in</cons></option>
    <option id="clerk"><name>Clerk</name><pros>Best DX</pros><cons>Paid after 10k</cons></option>
  </options>
  <resume-signal>Select: supabase or clerk</resume-signal>
</task>
```

**type="checkpoint:human-action"** - Rare, only for NO API/CLI actions (email links, 2FA)

**Golden rule:** If Claude CAN automate it, Claude MUST automate it.

See `./checkpoints.md` for comprehensive checkpoint guidance.

</task_types>

<specificity_levels>

**Too vague:**
```xml
<task type="auto">
  <name>Add authentication</name>
  <files>???</files>
  <action>Implement auth</action>
  <verify>???</verify>
  <done>Users can authenticate</done>
</task>
```
Claude: "How? What type? What library? Where?"

**Just right:**
```xml
<task type="auto">
  <name>Create login endpoint with JWT</name>
  <files>src/app/api/auth/login/route.ts</files>
  <action>POST accepting {email, password}. Query User by email, bcrypt compare. On match: JWT via jose, httpOnly cookie (15-min). Return 200. Mismatch: 401. Use jose not jsonwebtoken (Edge compatibility).</action>
  <verify>curl -X POST localhost:3000/api/auth/login -d '{"email":"test@test.com","password":"test123"}' returns 200 with Set-Cookie</verify>
  <done>Valid → 200 + cookie. Invalid → 401. Missing fields → 400.</done>
</task>
```

</specificity_levels>

<anti_patterns>

**Vague actions:**
- "Set up infrastructure" - what infrastructure?
- "Handle edge cases" - which ones?
- "Add proper error handling" - what's proper?

**Unverifiable completion:**
- "It works correctly" - how to test?
- "Code is clean" - subjective
- "Tests pass" - which tests? do they exist?

**Missing context:**
- "Use standard approach" - which standard?
- "Like the other endpoints" - Claude doesn't know your patterns

</anti_patterns>

<sizing>

Good task size: 15-60 minutes of Claude work.

- Too small: "Add import for bcrypt" → combine with related task
- Just right: "Create login endpoint with JWT" → focused, specific
- Too big: "Implement full auth system" → split into multiple plans

If phase has >3 tasks or spans multiple subsystems, split into multiple plans: `{phase}-{plan}-PLAN.md`

</sizing>
