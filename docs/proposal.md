# Proposal: Verilog Generator & Smart FSM Editor
## Built on get-shit-done foundation

---

## 1. Project Overview

**Goal:** Create a web-based tool that combines natural language Verilog generation with visual FSM editing, targeting embedded hardware developers who need to rapidly prototype and verify digital logic designs.

**Core Value Proposition:**
- Generate syntactically correct Verilog from natural language prompts
- Visually design and edit finite state machines with automatic code generation
- Catch common RTL design errors before simulation
- Seamless integration with standard EDA toolchains

**Target Users:** Embedded systems engineers, FPGA developers, hardware verification engineers (aligns with Percepta audience)

---

## 2. Technical Architecture

### 2.1 Frontend Stack
```
Base: get-shit-done (Next.js 14, React, TypeScript)
├── State Management: Zustand or Jotai (lightweight, fits minimal aesthetic)
├── FSM Canvas: ReactFlow (node-based editor)
├── Code Editor: Monaco Editor (VSCode's editor, Verilog syntax support)
├── Visualization: D3.js for timing diagrams, waveform preview
└── Styling: Tailwind CSS (already in get-shit-done)
```

### 2.2 Backend Services
```
Runtime: Node.js (Next.js API routes)
├── Verilog Parser: Custom parser using Chevrotain or ANTLR4
├── AST Manipulation: Custom AST walker/transformer
├── LLM Integration: Anthropic Claude API (Sonnet 4.5)
├── Simulation Interface: Child process wrapper for iverilog/verilator
└── Database: PostgreSQL (project persistence) + Redis (cache)
```

### 2.3 Core Modules

**Module 1: Verilog Parser & Generator**
- Parse existing Verilog into AST
- Generate Verilog from AST
- Validate syntax and common RTL issues
- Support for SystemVerilog subset

**Module 2: FSM Engine**
- State graph representation (nodes + edges)
- Automatic Verilog code generation from FSM
- Reverse engineering: Verilog → FSM extraction
- State encoding strategies (binary, one-hot, gray)

**Module 3: LLM Prompt System**
- Structured prompts for reliable Verilog generation
- Context awareness (existing modules, signals)
- Iterative refinement based on validation errors
- Few-shot examples database

**Module 4: Validation Engine**
- Lint checks (undriven signals, combinational loops)
- Clock domain crossing detection
- Reset synchronization verification
- Naming convention enforcement

---

## 3. Development Phases

### Phase 1: Foundation (Weeks 1-3)
**Objective:** Set up development environment and core infrastructure

**Tasks:**
1. Fork and audit get-shit-done codebase
   - Remove task-specific features
   - Keep auth, routing, basic UI components
   - Document existing architecture

2. Set up development environment
   - Configure TypeScript strict mode
   - Set up ESLint/Prettier for Verilog-specific rules
   - Configure testing framework (Vitest + React Testing Library)
   - Set up CI/CD pipeline (GitHub Actions)

3. Design database schema
   ```sql
   -- Projects table
   CREATE TABLE projects (
     id UUID PRIMARY KEY,
     name TEXT NOT NULL,
     user_id UUID REFERENCES users(id),
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   
   -- Modules table
   CREATE TABLE modules (
     id UUID PRIMARY KEY,
     project_id UUID REFERENCES projects(id),
     name TEXT NOT NULL,
     verilog_code TEXT,
     fsm_graph JSONB,  -- State machine representation
     metadata JSONB,
     created_at TIMESTAMP,
     updated_at TIMESTAMP
   );
   
   -- Prompts history
   CREATE TABLE prompt_history (
     id UUID PRIMARY KEY,
     module_id UUID REFERENCES modules(id),
     prompt TEXT,
     generated_code TEXT,
     accepted BOOLEAN,
     created_at TIMESTAMP
   );
   
   -- Validation results cache
   CREATE TABLE validation_cache (
     module_id UUID PRIMARY KEY,
     lint_results JSONB,
     simulation_results JSONB,
     last_validated TIMESTAMP
   );
   ```

4. Set up API structure
   ```
   /api/
   ├── projects/
   │   ├── [id]/
   │   │   ├── GET, PUT, DELETE
   │   │   └── modules/
   ├── modules/
   │   ├── [id]/
   │   │   ├── GET, PUT, DELETE
   │   │   ├── generate/     (LLM generation)
   │   │   ├── validate/     (lint + checks)
   │   │   └── simulate/     (run testbench)
   ├── fsm/
   │   ├── [id]/
   │   │   ├── to-verilog/   (FSM → code)
   │   │   └── from-verilog/ (code → FSM)
   └── llm/
       └── complete/         (prompt completion)
   ```

**Deliverables:**
- Clean, documented codebase based on get-shit-done
- Database migrations and schema
- Basic API scaffolding
- Development environment documentation

---

### Phase 2: Verilog Core (Weeks 4-7)
**Objective:** Build Verilog parsing, generation, and validation capabilities

**Tasks:**

1. **Build Verilog Parser** (Week 4)
   - Research: Evaluate ANTLR4 vs Chevrotain vs custom recursive descent
   - Implement lexer for Verilog tokens
   - Implement parser for subset: modules, always blocks, assign statements, FSMs
   - Generate AST representation
   - Write comprehensive parser tests (100+ Verilog examples)

   ```typescript
   // Target AST structure
   interface VerilogModule {
     name: string;
     ports: Port[];
     parameters: Parameter[];
     declarations: Declaration[];
     statements: Statement[];
     submodules: SubmoduleInstance[];
   }
   
   interface AlwaysBlock {
     type: 'combinational' | 'sequential';
     sensitivity: Signal[];
     statements: Statement[];
   }
   
   interface FSMBlock extends AlwaysBlock {
     states: State[];
     transitions: Transition[];
     encoding: 'binary' | 'onehot' | 'gray';
   }
   ```

2. **Build Verilog Generator** (Week 5)
   - Implement AST → Verilog code generator
   - Formatting rules (2-space indent, consistent style)
   - Comment preservation
   - Template system for common patterns (always blocks, modules)
   - Ensure round-trip: parse → generate → parse yields same AST

3. **Validation Engine** (Week 6)
   - Implement lint rules:
     - Undriven/unread signals
     - Combinational loops detection
     - Blocking vs non-blocking assignment checks
     - Clock domain crossing warnings
     - Reset signal verification
   - Integration with iverilog for syntax validation
   - Error message formatting and source mapping

4. **Testing & Documentation** (Week 7)
   - Unit tests for all parser components
   - Integration tests with real Verilog files
   - Property-based testing (generative Verilog examples)
   - API documentation for Verilog module

**Deliverables:**
- Working Verilog parser with 95%+ coverage of common patterns
- Code generator with formatting
- Validation engine with 15+ lint rules
- Comprehensive test suite
- API endpoints: `/api/modules/[id]/parse`, `/api/modules/[id]/validate`

---

### Phase 3: FSM Editor (Weeks 8-11)
**Objective:** Build visual FSM editor with bidirectional Verilog sync

**Tasks:**

1. **FSM Graph Representation** (Week 8)
   ```typescript
   interface FSMState {
     id: string;
     name: string;
     position: { x: number; y: number };
     isInitial: boolean;
     outputSignals: SignalAssignment[];  // Mealy outputs
   }
   
   interface FSMTransition {
     id: string;
     from: string;  // state id
     to: string;
     condition: string;  // Verilog expression
     actions: SignalAssignment[];  // Moore outputs
   }
   
   interface FSM {
     name: string;
     states: FSMState[];
     transitions: FSMTransition[];
     clock: string;
     reset: string;
     encoding: 'binary' | 'onehot' | 'gray';
     stateType: 'moore' | 'mealy' | 'mixed';
   }
   ```

2. **ReactFlow Canvas Setup** (Week 8)
   - Custom node components for FSM states
   - Custom edge components for transitions
   - Drag-and-drop state creation
   - Connection validation (no dangling transitions)
   - Auto-layout algorithm (force-directed or hierarchical)

3. **FSM → Verilog Generator** (Week 9)
   - State encoding logic (binary/onehot/gray)
   - Generate state register
   - Generate combinational next-state logic
   - Generate output logic (Moore/Mealy)
   - Template-based generation with user customization

   ```verilog
   // Example generated code structure
   module fsm_name (
     input wire clk,
     input wire rst,
     input wire [conditions],
     output reg [outputs]
   );
   
   // State encoding
   localparam [1:0] STATE_IDLE = 2'b00;
   localparam [1:0] STATE_ACTIVE = 2'b01;
   // ... more states
   
   reg [1:0] current_state, next_state;
   
   // State register
   always @(posedge clk or posedge rst) begin
     if (rst)
       current_state <= STATE_IDLE;
     else
       current_state <= next_state;
   end
   
   // Next state logic
   always @(*) begin
     case (current_state)
       STATE_IDLE: ...
       STATE_ACTIVE: ...
     endcase
   end
   
   // Output logic
   always @(*) begin
     // Moore outputs
   end
   endmodule
   ```

4. **Verilog → FSM Extractor** (Week 10)
   - Pattern matching for FSM structures
   - State encoding detection
   - Transition condition extraction
   - Heuristic layout algorithm for visual representation
   - Handle both simple and complex FSM patterns

5. **Editor Features** (Week 11)
   - State properties panel (name, outputs)
   - Transition condition editor with autocomplete
   - Validation (unreachable states, dead transitions)
   - Simulation mode (highlight active state)
   - Undo/redo support

**Deliverables:**
- Functional FSM visual editor
- Bidirectional Verilog ↔ FSM conversion
- Real-time validation and feedback
- State simulation visualization
- API endpoints: `/api/fsm/[id]/to-verilog`, `/api/fsm/[id]/from-verilog`

---

### Phase 4: LLM Integration (Weeks 12-15)
**Objective:** Natural language → Verilog generation with high reliability

**Tasks:**

1. **Prompt Engineering** (Week 12)
   - Design system prompt for Verilog generation
   - Few-shot examples database (UART, SPI, counters, FSMs, etc.)
   - Context injection (existing module ports, signals)
   - Output formatting constraints (ensure valid Verilog)

   ```typescript
   // Prompt structure
   const systemPrompt = `You are an expert Verilog generator...
   
   RULES:
   1. Always output syntactically correct Verilog
   2. Use non-blocking assignments in sequential blocks
   3. Use blocking assignments in combinational blocks
   4. Include comprehensive comments
   5. Follow naming convention: snake_case for signals
   
   OUTPUT FORMAT:
   \`\`\`verilog
   // Generated code here
   \`\`\`
   `;
   
   const userPrompt = `
   Context:
   - Existing module ports: ${existingPorts}
   - Clock signal: ${clockName}
   - Reset signal: ${resetName}
   
   Request: ${userRequest}
   
   Generate Verilog code for the above request.
   `;
   ```

2. **LLM API Integration** (Week 12)
   - Claude API client setup
   - Token usage tracking and optimization
   - Response parsing and validation
   - Error handling and retry logic
   - Rate limiting

3. **Iterative Refinement System** (Week 13)
   - Generate code → Validate → Fix errors → Repeat
   - Maximum 3 iterations before human intervention
   - Track success rate and common failure modes
   - Log all prompts and responses for analysis

   ```typescript
   async function generateWithRefinement(
     prompt: string,
     context: ModuleContext,
     maxIterations = 3
   ): Promise<VerilogCode> {
     let code = await llm.generate(prompt, context);
     
     for (let i = 0; i < maxIterations; i++) {
       const validation = await validate(code);
       
       if (validation.success) {
         return code;
       }
       
       // Refine prompt with validation errors
       const refinedPrompt = `
       Previous attempt had errors:
       ${validation.errors.join('\n')}
       
       Please fix these issues: ${prompt}
       `;
       
       code = await llm.generate(refinedPrompt, context);
     }
     
     throw new Error('Failed to generate valid code after max iterations');
   }
   ```

4. **Testbench Generation** (Week 14)
   - Analyze module interface (inputs/outputs)
   - Generate clock/reset stimulus
   - Generate test vectors for common cases
   - Add assertion checks
   - Format with waveform dump commands

5. **Context-Aware Suggestions** (Week 15)
   - Autocomplete for signal names
   - Suggest common modifications
   - Parameter tuning suggestions
   - Module instantiation templates

**Deliverables:**
- Reliable prompt → Verilog pipeline (>85% first-pass success)
- Testbench generation capabilities
- Context-aware code suggestions
- API endpoint: `/api/llm/generate`
- Prompt library with 50+ examples

---

### Phase 5: Code Editor & UI (Weeks 16-18)
**Objective:** Polished user interface with Monaco editor integration

**Tasks:**

1. **Monaco Editor Setup** (Week 16)
   - Integrate Monaco editor component
   - Configure Verilog syntax highlighting
   - Add custom autocomplete for project signals
   - Implement inline validation error display
   - Keyboard shortcuts (save, format, generate)

2. **Split View Layout** (Week 16-17)
   ```
   +----------------------------------+----------------------------------+
   |                                  |                                  |
   |  FSM Visual Editor               |  Generated Verilog Code          |
   |  (ReactFlow Canvas)              |  (Monaco Editor)                 |
   |                                  |                                  |
   |                                  |                                  |
   +----------------------------------+----------------------------------+
   |  Prompt Input                                                       |
   |  > "Add a new state for error handling with timeout"               |
   +---------------------------------------------------------------------+
   |  Validation Results              |  Simulation Output               |
   +----------------------------------+----------------------------------+
   ```

3. **Project Management UI** (Week 17)
   - Project list/grid view (keep from get-shit-done)
   - Module browser (tree view)
   - Quick actions (new module, import Verilog)
   - Search across all modules

4. **UI Polish** (Week 18)
   - Responsive design (desktop-first, but mobile-viewable)
   - Loading states and skeletons
   - Error boundaries
   - Keyboard navigation
   - Dark mode support
   - Animations (minimal, purposeful)

**Deliverables:**
- Polished, professional UI
- Split-view editor with FSM + code sync
- Project/module management interface
- Comprehensive keyboard shortcuts

---

### Phase 6: Simulation & Verification (Weeks 19-21)
**Objective:** In-browser simulation and waveform viewing

**Tasks:**

1. **Simulation Backend** (Week 19)
   - Docker container with iverilog + verilator
   - API endpoint to submit code + testbench
   - Execute simulation in isolated environment
   - Parse VCD (Value Change Dump) output
   - Resource limits (timeout, memory)

2. **Waveform Viewer** (Week 20)
   - Parse VCD format
   - Render waveforms using Canvas/SVG
   - Signal grouping and hierarchy
   - Zoom/pan controls
   - Cursor and measurement tools
   - Export to image

3. **Integration** (Week 21)
   - One-click "Simulate" button
   - Real-time output streaming
   - Error highlighting in code editor
   - FSM state highlighting during simulation
   - Simulation history/caching

**Deliverables:**
- Working simulation pipeline
- Waveform viewer component
- API endpoint: `/api/modules/[id]/simulate`
- Simulation results caching

---

### Phase 7: Polish & Deploy (Weeks 22-24)
**Objective:** Production-ready deployment and documentation

**Tasks:**

1. **Performance Optimization** (Week 22)
   - Code splitting and lazy loading
   - React component memoization
   - API response caching (Redis)
   - Database query optimization
   - Bundle size analysis and reduction

2. **Testing & QA** (Week 22-23)
   - End-to-end tests (Playwright)
   - Load testing (simulation API)
   - Cross-browser testing
   - Accessibility audit (WCAG 2.1 AA)
   - Security audit (OWASP Top 10)

3. **Documentation** (Week 23)
   - User guide (getting started, tutorials)
   - API documentation (OpenAPI spec)
   - Video tutorials (3-5 minutes each)
   - Example projects library
   - Troubleshooting guide

4. **Deployment** (Week 24)
   - Infrastructure setup (Vercel/Railway + Docker)
   - Environment configuration
   - Monitoring setup (Sentry, PostHog)
   - Analytics integration
   - Backup strategy
   - Domain setup and SSL

5. **Launch Preparation** (Week 24)
   - Landing page (separate from app)
   - Pricing page (if monetizing)
   - Email collection/waitlist
   - Social media assets
   - Product Hunt preparation

**Deliverables:**
- Production deployment
- Complete documentation
- Marketing website
- Launch announcement materials

---

## 4. Resource Requirements

### 4.1 Development Resources

**Personnel:**
- **You (Full-stack + Verilog specialist):** 30-40 hrs/week
- **Optional: Frontend developer** (Weeks 16-18): Polish UI/UX, 20 hrs/week
- **Optional: Technical writer** (Week 23): Documentation, 10 hrs total

### 4.2 Infrastructure Costs

**Development (Months 1-6):**
- Vercel Pro: $20/month
- Railway PostgreSQL: $5/month
- Railway Redis: $5/month
- Claude API (development): ~$50/month
- Domain: $12/year
- **Total: ~$80/month**

**Production (Month 7+):**
- Vercel Pro: $20/month
- Railway PostgreSQL (scaled): $20/month
- Railway Redis: $10/month
- Claude API (production): $200-500/month (depends on usage)
- Sentry: $26/month
- **Total: ~$276-576/month**

### 4.3 Tools & Services

**Required:**
- GitHub (free tier sufficient)
- Anthropic API key
- Code editor (VSCode recommended)
- Docker Desktop

**Optional:**
- Figma (UI design): Free tier
- PostHog (analytics): Free tier (10M events/month)
- Linear (project management): $8/month

---

## 5. Technical Risks & Mitigation

### Risk 1: LLM Reliability
**Risk:** Generated Verilog might be syntactically correct but functionally wrong
**Mitigation:**
- Implement comprehensive validation suite
- Show confidence scores
- Allow user review before accepting
- Build library of verified examples
- Eventually add formal verification hooks

### Risk 2: Parser Complexity
**Risk:** Verilog/SystemVerilog is complex; parser might miss edge cases
**Mitigation:**
- Start with well-defined subset
- Extensive test suite with real-world examples
- Graceful degradation (show raw code if parsing fails)
- Community-contributed test cases

### Risk 3: Performance
**Risk:** Simulation in cloud might be slow or expensive
**Mitigation:**
- Implement aggressive caching
- Use verilator (faster than iverilog)
- Resource limits per user
- Consider local simulation option

### Risk 4: User Adoption
**Risk:** Embedded engineers might prefer traditional tools
**Mitigation:**
- Focus on pain points (FSM tedium, boilerplate)
- Export to standard formats
- Integration with existing workflows
- Free tier to reduce friction

---

## 6. Success Metrics

### Development Metrics
- Test coverage: >80% for core modules
- Parser success rate: >95% on benchmark suite
- LLM generation first-pass success: >85%
- Build time: <30 seconds
- API response time: p95 < 500ms

### Product Metrics (Post-Launch)
- Weekly active users: 100 (Month 1) → 500 (Month 6)
- Modules created per week: 50 → 500
- LLM generations per week: 200 → 2000
- User retention (D7): >40%
- Net Promoter Score: >50

### Business Metrics (if monetizing)
- Conversion to paid: >5%
- Monthly recurring revenue: $500 (Month 3) → $2000 (Month 6)
- Customer acquisition cost: <$50
- Lifetime value: >$300

---

## 7. Monetization Strategy (Optional)

### Free Tier
- 10 projects
- 50 LLM generations/month
- Basic validation
- Community support

### Pro Tier ($19/month)
- Unlimited projects
- 500 LLM generations/month
- Advanced validation (formal verification hooks)
- Simulation (100 runs/month)
- Priority support

### Team Tier ($49/user/month)
- Everything in Pro
- Unlimited LLM generations
- Unlimited simulation
- Collaboration features
- SSO/SAML
- Dedicated support

### Enterprise
- Custom pricing
- On-premise deployment option
- Custom integrations
- SLA guarantees
- Training sessions

---

## 8. Go-to-Market Strategy

### Target Channels
1. **Direct outreach:**
   - Embedded systems communities (Reddit r/FPGA, r/embedded)
   - FPGA Discord servers
   - LinkedIn hardware engineering groups

2. **Content marketing:**
   - Blog posts on common Verilog pain points
   - Video tutorials (YouTube)
   - Guest posts on embedded blogs

3. **Product launches:**
   - Hacker News Show HN
   - Product Hunt
   - EEVblog forums

4. **Partnerships:**
   - FPGA vendor communities (AMD/Xilinx, Intel/Altera)
   - University hardware design courses
   - Hackathon sponsorships

### Positioning
"VS Code for Verilog" - emphasize:
- Speed (generate boilerplate in seconds)
- Reliability (catch bugs before simulation)
- Visual FSM design (no more ASCII art state diagrams)
- Integration with existing tools

---

## 9. Competitive Landscape

**Existing Tools:**
- **Vivado/Quartus:** Full FPGA toolchains, but heavy and complex
- **EDA Playground:** Online simulation, but no generation or FSM editing
- **TerosHDL (VSCode extension):** Visualization only, no generation
- **ChatGPT/Claude for Verilog:** General-purpose, not specialized

**Your Differentiation:**
- Purpose-built for Verilog with domain-specific intelligence
- Visual FSM editor with real-time sync
- Embedded systems focus (not ASIC design)
- Modern, fast web interface
- Validation integrated into workflow

---

## 10. Timeline Summary

```
Weeks 1-3:   Foundation & setup
Weeks 4-7:   Verilog parser, generator, validation
Weeks 8-11:  FSM editor & visualization
Weeks 12-15: LLM integration & prompt engineering
Weeks 16-18: UI polish & code editor
Weeks 19-21: Simulation & waveform viewer
Weeks 22-24: Testing, documentation, deployment

Total: 24 weeks (6 months)
```

**Aggressive timeline:** 18 weeks (skip simulation viewer, basic UI)
**Conservative timeline:** 32 weeks (more testing, polish, features)

---

## 11. Next Steps (Week 0)

1. **Decision points:**
   - Confirm scope (all features or MVP first?)
   - Monetization strategy (free vs paid)
   - Timeline commitment (18/24/32 weeks?)

2. **Immediate actions:**
   - Fork get-shit-done repo
   - Set up local development environment
   - Create project board (GitHub Projects or Linear)
   - Reserve domain name
   - Set up Anthropic API account

3. **Week 1 deliverables:**
   - Architecture documentation
   - Database schema design
   - API endpoint specification
   - First commit to cleaned-up repo

---

## 12. Open Questions

1. **Scope:** Start with FSM-only (faster MVP) or full Verilog support?
2. **Simulation:** Cloud-based or local executable?
3. **Collaboration:** Multi-user editing needed from day 1?
4. **SystemVerilog:** Support subset or stick to Verilog-2001?
5. **Formal verification:** Integrate tools like SymbiYosys or defer?
6. **Licensing:** Open-source core with paid hosting, or fully proprietary?

---

Let me know which aspects you want me to expand on, or if there are specific technical deep-dives you want (e.g., parser architecture, LLM prompt design, FSM encoding algorithms).
