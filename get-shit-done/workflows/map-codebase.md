<purpose>
Orchestrate parallel Explore agents to analyze codebase and produce structured documents in .planning/codebase/

Each agent has fresh context and focuses on specific aspects. Output is concise (under 100 lines per document) and actionable for planning.
</purpose>

<philosophy>
**Why parallel agents:**
- Fresh context per domain (no token contamination)
- Thorough analysis without context exhaustion
- Each agent optimized for its domain (tech vs organization vs quality vs issues)
- Faster execution (agents run simultaneously)

**Why 100-line limit:**
Codebase maps are reference material loaded frequently. Concise summaries are more useful than exhaustive inventories. If codebase is large, summarize patterns rather than listing every file.
</philosophy>

<process>

<step name="check_existing" priority="first">
Check if .planning/codebase/ already exists:

```bash
ls -la .planning/codebase/ 2>/dev/null
```

**If exists:**

```
.planning/codebase/ already exists with these documents:
[List files found]

What's next?
1. Refresh - Delete existing and remap codebase
2. Update - Keep existing, only update specific documents
3. Skip - Use existing codebase map as-is
```

Wait for user response.

If "Refresh": Delete .planning/codebase/, continue to create_structure
If "Update": Ask which documents to update, continue to spawn_agents (filtered)
If "Skip": Exit workflow

**If doesn't exist:**
Continue to create_structure.
</step>

<step name="create_structure">
Create .planning/codebase/ directory:

```bash
mkdir -p .planning/codebase
```

**Expected output files:**
- STACK.md (from stack.md template)
- ARCHITECTURE.md (from architecture.md template)
- STRUCTURE.md (from structure.md template)
- CONVENTIONS.md (from conventions.md template)
- TESTING.md (from testing.md template)
- INTEGRATIONS.md (from integrations.md template)
- CONCERNS.md (from concerns.md template)

Continue to spawn_agents.
</step>

<step name="spawn_agents">
Spawn 4 parallel Explore agents to analyze codebase.

<!-- Agent orchestration implemented in plan 02-02 -->

**Agent 1: Stack + Integrations (Technology Focus)**
Analyze:
- Languages and their versions
- Frameworks and libraries (key dependencies)
- Build tools and package managers
- External APIs and services
- Databases and data stores
- Third-party integrations

Output: STACK.md, INTEGRATIONS.md

**Agent 2: Architecture + Structure (Organization Focus)**
Analyze:
- System architecture and design patterns
- Data flow and component relationships
- Directory layout and module organization
- Entry points and routing
- State management approach
- File/folder naming conventions

Output: ARCHITECTURE.md, STRUCTURE.md

**Agent 3: Conventions + Testing (Quality Focus)**
Analyze:
- Code style and formatting rules
- Naming conventions (files, functions, variables)
- Common patterns and idioms
- Test structure and organization
- Coverage and test practices
- Linting and quality tools

Output: CONVENTIONS.md, TESTING.md

**Agent 4: Concerns (Issues Focus)**
Analyze:
- Technical debt and code smells
- Performance issues or bottlenecks
- Security concerns
- Outdated dependencies
- Missing error handling
- Documentation gaps
- Hard-coded values or secrets

Output: CONCERNS.md

<!-- End agent orchestration section -->

Continue to collect_results.
</step>

<step name="collect_results">
Wait for all 4 agents to complete.

<!-- Result collection implemented in plan 02-02 -->

Aggregate findings from each agent:
- Agent 1 findings → STACK.md, INTEGRATIONS.md content
- Agent 2 findings → ARCHITECTURE.md, STRUCTURE.md content
- Agent 3 findings → CONVENTIONS.md, TESTING.md content
- Agent 4 findings → CONCERNS.md content

Verify each document will be under 100 lines. If over, summarize patterns instead of listing exhaustively.

Continue to write_documents.
</step>

<step name="write_documents">
Write all 7 codebase documents using templates and agent findings.

**For each document:**
1. Load template from ~/.claude/get-shit-done/templates/codebase/
2. Populate with relevant agent findings
3. Ensure under 100 lines (summarize if needed)
4. Write to .planning/codebase/

**Document order:**
1. STACK.md
2. INTEGRATIONS.md
3. ARCHITECTURE.md
4. STRUCTURE.md
5. CONVENTIONS.md
6. TESTING.md
7. CONCERNS.md

After all documents written, continue to verify_output.
</step>

<step name="verify_output">
Verify all documents created successfully:

```bash
ls -la .planning/codebase/
wc -l .planning/codebase/*.md
```

**Verification checklist:**
- All 7 documents exist
- Each document under 100 lines
- No empty documents
- Templates populated with findings

If any checks fail, report issues to user.

Continue to offer_next.
</step>

<step name="offer_next">
Present completion summary and next steps:

```
Codebase mapped to .planning/codebase/

Documents created:
- STACK.md - Technologies and dependencies
- INTEGRATIONS.md - External services and APIs
- ARCHITECTURE.md - System design and patterns
- STRUCTURE.md - Directory layout and organization
- CONVENTIONS.md - Code style and patterns
- TESTING.md - Test structure and practices
- CONCERNS.md - Technical debt and issues

---

## ▶ Next Up

**Typical workflow:**

```
/gsd:new-project
```

Use codebase map to inform project initialization (brownfield project).

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- Review/edit any codebase documents before proceeding
- `/gsd:plan-phase N` - Plan specific phase using codebase context

---
```

End workflow.
</step>

</process>

<success_criteria>
- .planning/codebase/ directory created
- 4 parallel agents spawned and completed
- All 7 codebase documents written
- Each document under 100 lines
- Documents follow template structure
- User offered clear next steps
</success_criteria>
