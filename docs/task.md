# RTL Copilot - TDD Implementation Task List

## Current Focus: Phase 3 - FSM Editor (Weeks 8-11)

Based on the proposal.md and implementation.md documents, implementing visual FSM editor.

---

## Phase 1: Foundation (COMPLETED ✅)

### Week 1: Codebase Setup
- [x] Initialize Next.js 14 project with TypeScript strict mode
- [x] Configure ESLint/Prettier with Verilog-specific rules
- [x] Set up project structure (src/, lib/, components/, app/)

### Week 2: Testing & CI
- [x] Configure testing framework (Vitest + React Testing Library)
- [x] Set up CI/CD pipeline (GitHub Actions)
- [x] Set up ESLint and linting workflows

### Week 3: Database & API
- [x] Design and implement database schema (projects, modules, prompt_history, validation_cache)
- [x] Create database migrations with Drizzle ORM
- [x] Set up API structure scaffolding (Projects, Modules, FSM, LLM endpoints)

---

## Phase 2: Verilog Core (COMPLETED ✅)

### Week 4: Verilog Parser
- [x] Research parsing approaches (Chevrotain chosen)
- [x] Implement lexer for Verilog tokens (50 tests passing)
- [x] Implement parser for core subset (modules, always blocks, assign, FSMs)
- [x] Generate AST representation (types.ts with full type definitions)
- [x] Write comprehensive parser tests (86 tests total)

### Week 5: Verilog Generator
- [x] Implement AST → Verilog code generator
- [x] Implement formatting rules (2-space indent, consistent style)
- [x] Add comment preservation logic (via options)
- [x] Create template system for common patterns
- [x] Verify round-trip parsing (8 tests)

### Week 6: Validation Engine
- [x] Implement lint rules (6 rules: undriven-signal, blocking-in-sequential, nonblocking-in-combinational, missing-default-case, incomplete-sensitivity, multi-driven-signal)
- [x] Integrate with iverilog for syntax validation
- [x] Implement error message formatting and source mapping

### Week 7: Testing & Documentation
- [x] Unit tests for all parser components
- [x] Integration tests with real Verilog files (19 tests)
- [x] Property-based testing with fast-check (13 tests)
- [x] Parser coverage: 99.22% lines, Lexer: 100% lines
- [x] **Total: 179 tests passing**

---

## Phase 3: FSM Editor (Weeks 8-11) - COMPLETED ✅

### Week 8: FSM Data Model & Graph Representation
- [x] Define FSM TypeScript interfaces (FSMState, FSMTransition, FSM)
- [x] Create FSM store using Zustand
- [x] Implement state encoding utilities (binary, one-hot, gray)
- [x] Set up ReactFlow with custom node/edge types
- [x] Create FSMState custom node component
- [x] Create FSMTransition custom edge component

### Week 9: FSM → Verilog Generator
- [x] Implement state encoding generator (binary/onehot/gray)
- [x] Generate state register with reset logic
- [x] Generate combinational next-state logic
- [x] Generate output logic (Moore/Mealy)
- [x] Create FSM template system with customization options
- [x] Add FSM validation (unreachable states, dead transitions)

### Week 10: Verilog → FSM Extractor
- [x] Pattern matching for FSM structures in AST
- [x] State encoding detection
- [x] Transition condition extraction
- [x] State output assignment extraction
- [x] Heuristic layout algorithm for visual representation
- [x] Handle complex FSM patterns (nested states, multiple FSMs)

### Week 11: FSM Editor Features
- [x] State properties panel (name, outputs, isInitial)
- [x] Transition condition editor with autocomplete
- [x] Drag-and-drop state creation
- [x] Connection validation (no dangling transitions)
- [x] Auto-layout algorithm (force-directed)
- [x] Undo/redo support with Zustand middleware
- [x] Real-time Verilog sync (FSM changes → code updates)

---

## Phase 4: LLM Integration (Weeks 12-15)

### Week 12: Prompt Engineering
- [x] Design system prompt for Verilog generation
- [x] Build few-shot examples database
- [x] Context injection (existing module ports, signals)
- [x] Output formatting constraints

### Week 13: LLM API Integration
- [x] Define LLM Provider Interface (Generic)
- [x] Implement Anthropic (Claude) Provider
- [x] Implement OpenAI (GPT/Ollama) Provider
- [x] Create Generic API Route

### Week 14: Testbench Generation
- [x] Analyze module interface (inputs/outputs)
- [x] Generate clock/reset stimulus
- [x] Generate test vectors for common cases
- [x] Add assertion checks

### Week 15: Context-Aware Suggestions
- [x] Autocomplete Logic (Signal names, Keywords)
- [x] Smart Suggestions (Linting/Fixes)
- [x] Module Instantiation Templates

---

## Phase 5: Code Editor & UI (Weeks 16-18)

- [x] Editor Setup (Monaco Install, Theme)
- [x] Language Features (Completion, Linting)
- [x] Template Insertion Actions
- [x] File Tree: Visual explorer for projects/modules
- [x] Tab System: Manage state for multiple open files
- [x] Split-View: Integrate Code + FSM editors side-by-side

---

### Week 19: Docker Simulation Environment
- [x] Dockerfile with iverilog/verilator
- [x] Simulation Runner (compile, run, parse output)
- [x] Simulation API Endpoint

### Week 20: VCD Waveform Parser
- [x] VCD Parser (header, value changes)
- [x] Unit Tests for Parser

### Week 21: Waveform Viewer UI
- [x] WaveformViewer Component (Canvas/SVG)
- [ ] Integration with Toolbar

---

## Phase 7: Polish & Deploy (Weeks 22-24)

- [ ] Performance optimization
- [ ] E2E testing, security audit
- [ ] Documentation & tutorials
- [ ] Production deployment

---

## Test Coverage Status

| Component | Coverage |
|-----------|----------|
| Lexer     | 100%     |
| Parser    | 99.22%   |
| Generator | ~85%     |
| Validator | ~90%     |

## Commit Strategy

Each task completion = 1 commit with descriptive message following format:
`feat(scope): description` or `test(scope): description`
