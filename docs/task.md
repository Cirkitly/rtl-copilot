# Verilog Generator & Smart FSM Editor - Task Breakdown

## Project Overview
A web-based tool combining natural language Verilog generation with visual FSM editing, targeting embedded hardware developers for rapid prototyping and verification of digital logic designs.

**Target Timeline:** 24 weeks (6 months)

---

## Phase 1: Foundation (Weeks 1-3)

### Week 1: Codebase Setup
- [ ] Fork and audit get-shit-done codebase
  - [ ] Remove task-specific features
  - [ ] Keep auth, routing, basic UI components
  - [ ] Document existing architecture
- [ ] Configure TypeScript strict mode
- [ ] Set up ESLint/Prettier with Verilog-specific rules

### Week 2: Testing & CI
- [ ] Configure testing framework (Vitest + React Testing Library)
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Set up ESLint and linting workflows

### Week 3: Database & API
- [ ] Design and implement database schema
  - [ ] `projects` table
  - [ ] `modules` table
  - [ ] `prompt_history` table
  - [ ] `validation_cache` table
- [ ] Create database migrations
- [ ] Set up API structure scaffolding
  - [ ] Projects CRUD endpoints
  - [ ] Modules CRUD endpoints
  - [ ] FSM conversion endpoints
  - [ ] LLM completion endpoint
- [ ] Write development environment documentation

---

## Phase 2: Verilog Core (Weeks 4-7)

### Week 4: Verilog Parser
- [ ] Research parsing approaches (ANTLR4 vs Chevrotain vs custom)
- [ ] Implement lexer for Verilog tokens
- [ ] Implement parser for core subset:
  - [ ] Module declarations
  - [ ] Always blocks
  - [ ] Assign statements
  - [ ] FSM patterns
- [ ] Generate AST representation
- [ ] Write comprehensive parser tests (100+ examples)

### Week 5: Verilog Generator
- [ ] Implement AST → Verilog code generator
- [ ] Implement formatting rules (2-space indent, consistent style)
- [ ] Add comment preservation logic
- [ ] Create template system for common patterns
- [ ] Verify round-trip parsing: parse → generate → parse = same AST

### Week 6: Validation Engine
- [ ] Implement lint rules:
  - [ ] Undriven/unread signals detection
  - [ ] Combinational loops detection
  - [ ] Blocking vs non-blocking assignment checks
  - [ ] Clock domain crossing warnings
  - [ ] Reset signal verification
  - [ ] Naming convention enforcement
- [ ] Integrate with iverilog for syntax validation
- [ ] Implement error message formatting and source mapping

### Week 7: Testing & Documentation
- [ ] Write unit tests for all parser components
- [ ] Create integration tests with real Verilog files
- [ ] Implement property-based testing (generative examples)
- [ ] Write API documentation for Verilog module
- [ ] Achieve >95% parser coverage on common patterns

---

## Phase 3: FSM Editor (Weeks 8-11)

### Week 8: FSM Core & Canvas
- [ ] Define FSM graph data structure
  - [ ] `FSMState` interface
  - [ ] `FSMTransition` interface
  - [ ] `FSM` interface with encoding options
- [ ] Set up ReactFlow canvas
- [ ] Create custom node components for states
- [ ] Create custom edge components for transitions
- [ ] Implement drag-and-drop state creation
- [ ] Add connection validation (no dangling transitions)
- [ ] Implement auto-layout algorithm

### Week 9: FSM → Verilog Generator
- [ ] Implement state encoding logic (binary/onehot/gray)
- [ ] Generate state register code
- [ ] Generate combinational next-state logic
- [ ] Generate output logic (Moore/Mealy)
- [ ] Create template-based generation system
- [ ] Add user customization options

### Week 10: Verilog → FSM Extractor
- [ ] Implement pattern matching for FSM structures
- [ ] Add state encoding detection
- [ ] Implement transition condition extraction
- [ ] Create heuristic layout algorithm for visualization
- [ ] Handle both simple and complex FSM patterns

### Week 11: Editor Features
- [ ] Build state properties panel (name, outputs)
- [ ] Create transition condition editor with autocomplete
- [ ] Add FSM validation (unreachable states, dead transitions)
- [ ] Implement simulation mode (highlight active state)
- [ ] Add undo/redo support
- [ ] Test bidirectional sync (FSM ↔ Verilog)

---

## Phase 4: LLM Integration (Weeks 12-15)

### Week 12: Prompt Engineering & API
- [ ] Design system prompt for Verilog generation
- [ ] Create few-shot examples database (UART, SPI, counters, FSMs)
- [ ] Implement context injection (existing module ports, signals)
- [ ] Define output formatting constraints
- [ ] Set up Claude API client
- [ ] Implement token usage tracking and optimization
- [ ] Add response parsing and validation
- [ ] Implement error handling and retry logic
- [ ] Add rate limiting

### Week 13: Iterative Refinement
- [ ] Implement generate → validate → fix → repeat pipeline
- [ ] Set maximum 3 iterations before human intervention
- [ ] Add success rate tracking
- [ ] Implement failure mode logging
- [ ] Log all prompts and responses for analysis

### Week 14: Testbench Generation
- [ ] Analyze module interface (inputs/outputs)
- [ ] Generate clock/reset stimulus automatically
- [ ] Generate test vectors for common cases
- [ ] Add assertion checks
- [ ] Format with waveform dump commands

### Week 15: Context-Aware Suggestions
- [ ] Implement autocomplete for signal names
- [ ] Add common modification suggestions
- [ ] Create parameter tuning suggestions
- [ ] Build module instantiation templates
- [ ] Achieve >85% first-pass generation success rate

---

## Phase 5: Code Editor & UI (Weeks 16-18)

### Week 16: Monaco Editor
- [ ] Integrate Monaco editor component
- [ ] Configure Verilog syntax highlighting
- [ ] Add custom autocomplete for project signals
- [ ] Implement inline validation error display
- [ ] Add keyboard shortcuts (save, format, generate)

### Week 16-17: Split View Layout
- [ ] Implement FSM editor + code editor split view
- [ ] Add prompt input area
- [ ] Create validation results panel
- [ ] Build simulation output panel
- [ ] Ensure real-time sync between views

### Week 17: Project Management UI
- [ ] Create project list/grid view
- [ ] Build module browser (tree view)
- [ ] Add quick actions (new module, import Verilog)
- [ ] Implement search across all modules

### Week 18: UI Polish
- [ ] Implement responsive design (desktop-first)
- [ ] Add loading states and skeletons
- [ ] Set up error boundaries
- [ ] Enable keyboard navigation
- [ ] Implement dark mode support
- [ ] Add minimal, purposeful animations

---

## Phase 6: Simulation & Verification (Weeks 19-21)

### Week 19: Simulation Backend
- [ ] Create Docker container with iverilog + verilator
- [ ] Build API endpoint for code + testbench submission
- [ ] Implement isolated execution environment
- [ ] Parse VCD (Value Change Dump) output
- [ ] Set resource limits (timeout, memory)

### Week 20: Waveform Viewer
- [ ] Implement VCD format parser
- [ ] Render waveforms using Canvas/SVG
- [ ] Add signal grouping and hierarchy
- [ ] Implement zoom/pan controls
- [ ] Add cursor and measurement tools
- [ ] Enable export to image

### Week 21: Integration
- [ ] Add one-click "Simulate" button
- [ ] Implement real-time output streaming
- [ ] Add error highlighting in code editor
- [ ] Enable FSM state highlighting during simulation
- [ ] Implement simulation history/caching

---

## Phase 7: Polish & Deploy (Weeks 22-24)

### Week 22: Performance & Testing
- [ ] Implement code splitting and lazy loading
- [ ] Add React component memoization
- [ ] Set up API response caching (Redis)
- [ ] Optimize database queries
- [ ] Analyze and reduce bundle size
- [ ] Write end-to-end tests (Playwright)
- [ ] Perform load testing (simulation API)
- [ ] Execute cross-browser testing

### Week 22-23: QA & Security
- [ ] Conduct accessibility audit (WCAG 2.1 AA)
- [ ] Perform security audit (OWASP Top 10)
- [ ] Fix identified issues

### Week 23: Documentation
- [ ] Write user guide (getting started, tutorials)
- [ ] Create API documentation (OpenAPI spec)
- [ ] Record video tutorials (3-5 minutes each)
- [ ] Build example projects library
- [ ] Write troubleshooting guide

### Week 24: Deployment & Launch
- [ ] Set up infrastructure (Vercel/Railway + Docker)
- [ ] Configure environments
- [ ] Set up monitoring (Sentry, PostHog)
- [ ] Integrate analytics
- [ ] Implement backup strategy
- [ ] Configure domain and SSL
- [ ] Create landing page
- [ ] Prepare launch materials (social, Product Hunt)

---

## Success Metrics Targets

### Development Metrics
- [ ] Test coverage: >80% for core modules
- [ ] Parser success rate: >95% on benchmark suite
- [ ] LLM generation first-pass success: >85%
- [ ] Build time: <30 seconds
- [ ] API response time: p95 <500ms

### Post-Launch Metrics
- [ ] Weekly active users: 100 (Month 1) → 500 (Month 6)
- [ ] Modules created per week: 50 → 500
- [ ] LLM generations per week: 200 → 2000
- [ ] User retention (D7): >40%
- [ ] Net Promoter Score: >50
