<purpose>
Orchestrate batched subagent research for domain ecosystems before roadmap creation.

Subagents write directly to `.planning/research/` to preserve main context.
Maximum 4 parallel subagents, recommended batch size 3.
</purpose>

<required_reading>
**Read before executing:**
1. `~/.claude/get-shit-done/references/research-subagent-prompts.md` - Prompt templates for each category
2. `~/.claude/get-shit-done/templates/project-research.md` - Output format subagents use
</required_reading>

<process>

<step name="setup">
Create research directory:

```bash
mkdir -p .planning/research
```

Parse PROJECT.md to extract:
- Domain keywords (technology mentions, problem space)
- Constraints that affect ecosystem choices
- Any mentioned preferences or requirements
</step>

<step name="define_research_categories">
Standard research categories:

1. **ecosystem.md** - Libraries, frameworks, tools for this domain
2. **architecture.md** - Patterns, project structure, component organization
3. **pitfalls.md** - Common mistakes, what NOT to do, performance traps
4. **standards.md** - Best practices, conventions, quality expectations

Each subagent researches ONE category and writes directly to `.planning/research/{category}.md`
</step>

<step name="batch_execution">
## Batched Subagent Spawning

Read prompt templates from `~/.claude/get-shit-done/references/research-subagent-prompts.md`

**Batch 1: Foundation research** (spawn in parallel)

Spawn using Task tool with `subagent_type="general-purpose"`:

```
Task 1:
  description: "Research ecosystem for {domain}"
  prompt: [ecosystem_subagent_prompt template filled with PROJECT.md context]

Task 2:
  description: "Research architecture for {domain}"
  prompt: [architecture_subagent_prompt template filled with PROJECT.md context]
```

Send BOTH Task calls in a single message. Wait for Batch 1 completion.

**Batch 2: Risk & quality research** (spawn in parallel)

```
Task 3:
  description: "Research pitfalls for {domain}"
  prompt: [pitfalls_subagent_prompt template filled with PROJECT.md context]

Task 4:
  description: "Research standards for {domain}"
  prompt: [standards_subagent_prompt template filled with PROJECT.md context]
```

Send BOTH Task calls in a single message. Wait for Batch 2 completion.

**Batch ordering rationale:**
- Batch 1 (ecosystem + architecture): Core understanding of what to build and how
- Batch 2 (pitfalls + standards): Refinements that build on core understanding

**Each subagent receives:**
- Domain context from PROJECT.md
- Category assignment (ecosystem, architecture, pitfalls, standards)
- Output format from templates/project-research.md
- Instruction to write directly to `.planning/research/{category}.md`
</step>

<step name="verify_outputs">
After all batches complete:

```bash
# Check all files exist
ls -la .planning/research/

# Verify each file has content
for f in ecosystem architecture pitfalls standards; do
  [ -s ".planning/research/${f}.md" ] && echo "✓ ${f}.md" || echo "✗ ${f}.md MISSING"
done
```

**If any file missing:**
- Log which subagent failed
- Optionally retry that specific subagent
- Continue with available research (partial is better than none)
</step>

<step name="aggregate">
Read key findings from each research file for summary:

```bash
# Extract first few lines of each for summary
for f in .planning/research/*.md; do
  echo "=== $(basename $f) ==="
  head -20 "$f"
  echo ""
done
```

Extract for user summary:
- Top library/framework recommendation from ecosystem.md
- Primary architecture pattern from architecture.md
- Most critical pitfall from pitfalls.md
- Key quality standard from standards.md
</step>

</process>

<batching_rules>
## Batching Configuration

**Maximum parallel subagents:** 4 (API safety limit)
**Recommended batch size:** 3 (reliable)

**Batch ordering rationale:**
- Batch 1 (ecosystem + architecture): Foundation knowledge that informs everything
- Batch 2 (pitfalls + standards): Risk and quality that build on foundation

**Between batches:**
- Verify all subagents in batch completed
- Check for failures, note for retry if needed
- Proceed to next batch
</batching_rules>

<subagent_template>
## Task Tool Invocation Pattern

For each subagent, use:

```
Task tool parameters:
- subagent_type: "general-purpose"
- description: "Research {category} for {domain}"
- prompt: [filled template from research-subagent-prompts.md]
```

**Prompt template (simplified):**

```
Research and write {category}.md for {domain} domain.

## Context
{Paste relevant sections from PROJECT.md}

## Your Assignment
File: .planning/research/{category}.md
Category: {category}
Purpose: {category-specific purpose}

## Research Requirements
Use WebSearch to find current information. Verify:
- Libraries are actively maintained (commits in last 12 months)
- Patterns are current best practice (not deprecated)
- Examples are from 2024-2025 sources where possible

## Output
Write directly to .planning/research/{category}.md using the template structure:
- research_summary
- findings (specific discoveries with sources)
- recommendations (actionable guidance)
- sources (where info came from, confidence level)
- open_questions (what couldn't be resolved)

Quality bar: Someone reading this should be able to make informed decisions about the roadmap.
```
</subagent_template>

<success_criteria>
Research workflow complete when:
- [ ] All 4 research files exist in .planning/research/
- [ ] Each file has substantive content (not empty/error)
- [ ] Key findings extracted for summary
- [ ] Main agent context preserved (minimal usage)
</success_criteria>
