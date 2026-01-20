# Phase 4: LLM Integration Implementation Plan (Weeks 12-15)

**Objective:** Enable Natural Language to Verilog generation by integrating LLM capabilities with robust prompt engineering and context management.

**Methodology:** Adopting the "Get Shit Done" (GSD) framework structure (Phases, Plans, Must-Haves) as requested, utilizing the templates in `commands/gsd`.

---

## Must-Haves (Goal-Backward Verification)

The following criteria must be met to declare Phase 4 complete:

| Truths (Observable Behavior) | Artifacts (Code) | Key Links |
|------------------------------|------------------|-----------|
| User receives valid Verilog code from natural language prompt | `app/src/lib/llm/prompts/system.ts` | Frontend Prompt -> API -> LLM Client |
| Generated code passes internal parser validation | `app/src/app/api/llm/generate/route.ts` | LLM Output -> Parser/Validator |
| System correctly uses context from existing modules | `app/src/lib/llm/context.ts` | Project Files -> Prompt Context |
| Few-shot examples guide style and syntax | `app/src/lib/llm/prompts/examples.ts` | Query Type -> Relevant Example |

---

## Execution Plans

### Plan 12: Prompt Engineering (Week 12)

**Goal:** Design robust prompts that consistently generate syntactically correct Verilog.

#### [TASK] System Prompt Design
- **File**: `app/src/lib/llm/prompts/system.ts`
- **Actions**:
    - Define "Verilog Expert" persona options.
    - Establish strict output formatting (Markdown code blocks only).
    - Enforce coding conventions (RESET_ACTIVE_LOW vs HIGH, naming).
    - **Deliverable**: `getSystemPrompt(options)` function.

#### [TASK] Few-Shot Example Database
- **File**: `app/src/lib/llm/prompts/examples.ts`
- **Actions**:
    - Curate 5-10 high-quality pairs (Input -> Verilog).
    - Categories: Combinational (ALU, Mux), Sequential (Counter, Shift Reg), FSM (Traffic Light), Datapath.
    - **Deliverable**: `getFewShotExamples(topic)` function.

#### [TASK] Context Injection Strategy
- **File**: `app/src/lib/llm/context.ts`
- **Actions**:
    - Implement `buildContext(projectFiles)` to serialize existing modules.
    - Token estimation and truncation logic.
    - **Deliverable**: `constructPrompt(userQuery, context)` function.

---

### Plan 13: LLM API Integration (Week 13)

**Goal:** Implement a provider-agnostic LLM interface to support any Model/API (Claude, OpenAI, Ollama, etc.).

#### [TASK] Define LLM Provider Interface
- **File**: `app/src/lib/llm/types.ts`
- **Actions**:
    - Define `LLMProvider` interface (generate, stream).
    - Define `LLMRequest` and `LLMResponse` types.
    - Create `LLMFactory` to instantiate providers based on config.

#### [TASK] Implement Providers
- **File**: `app/src/lib/llm/providers/`
- **Actions**:
    - `anthropic.ts`: Implementation for Claude (default).
    - `openai.ts`: Implementation for GPT-4/3.5 using OpenAI compatible API (works for Ollama/LocalAI too).
    - **Deliverable**: Configurable provider system via `.env`.

#### [TASK] Generic API Route
- **File**: `app/src/app/api/llm/generate/route.ts`
- **Actions**:
    - Accept `provider`, `model`, and `prompt` in request body.
    - Use `LLMFactory` to route request.
    - Handle streaming responses uniformly.

#### [TASK] Iterative Refinement Loop
- **File**: `app/src/lib/llm/refine.ts`
- **Actions**:
    - Flow: Generate -> Validate (Parser) -> If Error -> Re-prompt with Error Message -> Regenerate.
    - Max retry limit logic.

---

### Plan 14: Testbench Generation (Week 14)

**Goal:** Automatically generate testbenches for the generated or verified modules.

#### [TASK] Testbench Prompting
- **Actions**:
    - Analyze module interface (Inputs/Outputs).
    - Prompt for "Self-Checking Testbench".
    - specific instructions for `$monitor` and `$finish`.

### Plan 15: Context-Aware Suggestions (Week 15)

**Goal:** Provide intelligent code completion and suggestion utilities to power the future Code Editor (Week 16).

#### [TASK] Autocomplete Logic
- **File**: `app/src/lib/editor/autocomplete.ts`
- **Actions**:
    - Implement `getCompletions(code, position)`:
        - Analyze AST to find locally defined signals (wires, regs).
        - Suggest Verilog keywords (always, module, assign).
        - **Deliverable**: List of completion items (label, kind).

#### [TASK] Smart Suggestions
- **File**: `app/src/lib/editor/suggestions.ts`
- **Actions**:
    - Implement `getSuggestions(code)`:
        - Detect common patterns/errors (e.g., missing sensitivity list items).
        - Suggest fixes using LLM (optional) or static heuristic.
    - **Deliverable**: List of diagnostic suggestions.

#### [TASK] Module Instantiation Templates
- **File**: `app/src/lib/editor/templates.ts`
- **Actions**:
    - Implement `getInstantiationTemplate(moduleAST)`:
        - Extract ports from a module definition.
        - Generate instance code: `mod_name u_mod_name (.port(signal), ...);`.
    - **Deliverable**: Function to generate boilerplate code.

---

## Verification Plan

### Automated
- **Prompt Regression**: Run a set of 20 standard prompts (e.g., "8-bit counter") against the configured System Prompt and verify that the output compiles (iverilog) 100% of the time.

### Manual
- **User Experience**: Verify that the "Generate" button in the UI produces code that appears in the editor without markdown artifacts or conversational filler ("Here is your code...").

---

### Phase 5: Code Editor & UI (Weeks 16-18)

**Goal:** Build a VSCode-like editing experience specifically tailored for Verilog, integrating the LLM and FSM features.

## Must-Haves
| Truths (Observable behavior) | Artifacts (Code) | Key Links |
|------------------------------|------------------|-----------|
| User can edit Verilog with syntax highlighting | `app/src/components/editor/MonacoEditor.tsx` | UI -> Monaco Instance |
| Auto-complete suggests signals and keywords | `app/src/lib/editor/languageClient.ts` | Monaco -> Autocomplete Logic |
| Real-time lint errors appear in gutter | `app/src/lib/editor/diagnostics.ts` | Validator -> Monaco Markers |
| User can switch between Code and FSM View | `app/src/app/project/[id]/page.tsx` | Layout -> View State |

## Execution Plans

### Plan 16: Monaco Editor Integration (Week 16)

**Goal:** Get a working Monaco editor instance with Verilog-specific language features.

#### [TASK] Editor Setup
- **File**: `app/src/components/editor/VerilogEditor.tsx`
- **Actions**:
    - Install `@monaco-editor/react`.
    - Configure custom Verilog theme (dark mode).
    - Register 'verilog' language.

#### [TASK] Language Features (LSP-ish)
- **File**: `app/src/lib/editor/monaco.ts`
- **Actions**:
    - `registerCompletionItemProvider`: Connect to `autocomplete.ts`.
    - `onDidChangeModelContent`: Connect to `suggestions.ts` (linting).
    - Map `Diagnostic` objects to `monaco.editor.setModelMarkers`.

#### [TASK] Template Insertion
- **Actions**:
    - Add "Insert Snippet" command context menu.
    - Connect to `templates.ts`.

---

### Plan 17: File Management & Layout (Week 17)

**Goal:** Create a proper IDE layout with file navigation.

#### [TASK] File Tree
- **File**: `app/src/components/layout/FileTree.tsx`
- **Actions**:
    - Visualize `projects` and `modules` from DB.
    - Create/Delete/Rename actions.

#### [TASK] Tab System
- **File**: `app/src/components/layout/EditorTabs.tsx`
- **Actions**:
    - Manage open files state in Zustand (`useEditorStore`).
    - Dirty state indication (unsaved changes).

---

### Plan 18: Polish & Shortcuts (Week 18)

**Goal:** Make it feel like a pro tool.

#### [TASK] Command Palette
- **Actions**:
    - Implement `Ctrl+K` / `Ctrl+P` command menu.
    - Commands: "Generate Code", "View FSM", "Run Testbench".

#### [TASK] Theme Sync
- **Actions**:
    - Ensure Chakra UI theme matches Monaco editor theme.

---

## Phase 6: Simulation & Verification (Weeks 19-21)

**Goal:** Enable users to compile, simulate, and visualize waveforms for their Verilog designs directly in the IDE.

### Must-Haves
| Truths (Observable behavior) | Artifacts (Code) | Key Links |
|------------------------------|------------------|-----------|
| User can compile Verilog and see errors | `app/src/lib/simulation/runner.ts` | API -> Docker/iverilog |
| User can run testbench and generate VCD | `Dockerfile` | Simulation env |
| User can view signal waveforms | `app/src/components/waveform/WaveformViewer.tsx` | VCD -> Canvas |

### Plan 19: Docker Simulation Environment (Week 19)

**Goal:** Create a containerized environment for safe Verilog compilation and simulation.

#### [TASK] Dockerfile
- **File**: `docker/Dockerfile`
- **Actions**:
    - Base image: `debian:bookworm-slim`
    - Install `iverilog`, `verilator`, `gtkwave` (optional).
    - Define entrypoint script for compile + simulate.

#### [TASK] Simulation Runner
- **File**: `app/src/lib/simulation/runner.ts`
- **Actions**:
    - `compileverilog(code)`: Runs `iverilog` via Docker.
    - `runSimulation(tb, dut)`: Runs testbench, generates VCD.
    - Parse output for errors/warnings.

#### [TASK] Simulation API
- **File**: `app/src/app/api/simulation/run/route.ts`
- **Actions**:
    - Accept `moduleCode`, `testbenchCode`.
    - Return `{ success, errors, vcdPath }`.

---

### Plan 20: VCD Waveform Parser (Week 20)

**Goal:** Parse VCD files and provide data for visualization.

#### [TASK] VCD Parser
- **File**: `app/src/lib/waveform/vcdParser.ts`
- **Actions**:
    - Parse VCD header (timescale, variables).
    - Parse value changes into structured data.
    - Output: `{ signals: { name, values: [{ time, value }][] } }`.

#### [TASK] Unit Tests
- **File**: `app/src/lib/waveform/__tests__/vcdParser.test.ts`
- **Actions**:
    - Test parsing of multi-bit signals, real numbers, and edge cases.

---

### Plan 21: Waveform Viewer UI (Week 21)

**Goal:** Render interactive waveform diagrams in the IDE.

#### [TASK] WaveformViewer Component
- **File**: `app/src/components/waveform/WaveformViewer.tsx`
- **Actions**:
    - Render signal names on the left.
    - Render waveform traces (using Canvas or SVG).
    - Support zoom and pan.

#### [TASK] Integration
- **Actions**:
    - Add "Run Simulation" button to toolbar.
    - Display WaveformViewer in a collapsible panel below the editor.
