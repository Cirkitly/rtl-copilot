# Verilog Generator & Smart FSM Editor - Implementation Plan

## Goal

Build a web-based tool that combines natural language Verilog generation with visual FSM editing, enabling embedded hardware developers to rapidly prototype and verify digital logic designs.

---

## Technical Architecture

### Frontend Stack

```
Base: Next.js 14 + React + TypeScript
├── State Management: Zustand or Jotai
├── FSM Canvas: ReactFlow (node-based editor)
├── Code Editor: Monaco Editor (Verilog syntax)
├── Visualization: D3.js (timing diagrams, waveforms)
└── Styling: Tailwind CSS
```

### Backend Stack

```
Runtime: Node.js (Next.js API routes)
├── Verilog Parser: Chevrotain or ANTLR4
├── AST Manipulation: Custom walker/transformer (Chevrotain Visitor Implemented)
├── LLM Integration: Anthropic Claude API (Sonnet 4.5)
├── Simulation: iverilog/verilator via Docker
└── Database: PostgreSQL + Redis
```

---

## Core Modules

### Module 1: Verilog Parser & Generator (Implemented ✅)

#### AST Structure

```typescript
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

#### Implementation Steps

1. **Lexer**: Tokenize Verilog keywords, operators, identifiers
2. **Parser**: Build recursive descent or Chevrotain grammar
3. **AST Builder**: Construct typed tree from parse results
4. **Code Generator**: Emit formatted Verilog from AST
5. **Validator**: Walk AST to detect lint issues

---

### Module 2: FSM Engine (Implemented ✅)

#### Data Structures

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

#### Generated Verilog Template

```verilog
module fsm_name (
  input wire clk,
  input wire rst,
  input wire [conditions],
  output reg [outputs]
);

// State encoding
localparam [1:0] STATE_IDLE = 2'b00;
localparam [1:0] STATE_ACTIVE = 2'b01;

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
  // Moore/Mealy outputs
end
endmodule
```

---

### Module 3: LLM Prompt System

#### Prompt Structure

```typescript
const systemPrompt = `You are an expert Verilog generator.

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

#### Iterative Refinement

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
    
    const refinedPrompt = `
    Previous attempt had errors:
    ${validation.errors.join('\n')}
    
    Please fix these issues: ${prompt}
    `;
    
    code = await llm.generate(refinedPrompt, context);
  }
  
  throw new Error('Failed to generate valid code');
}
```

---

### Module 4: Validation Engine

#### Lint Rules

| Rule | Description | Severity |
|------|-------------|----------|
| `undriven-signal` | Signal declared but never assigned | Error |
| `unread-signal` | Signal assigned but never used | Warning |
| `comb-loop` | Combinational loop detected | Error |
| `blocking-in-seq` | Blocking assignment in sequential block | Warning |
| `nonblocking-in-comb` | Non-blocking in combinational block | Warning |
| `cdc-crossing` | Clock domain crossing detected | Warning |
| `async-reset` | Asynchronous reset not synchronized | Info |
| `naming-convention` | Signal doesn't follow convention | Info |

---

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Modules table
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  verilog_code TEXT,
  fsm_graph JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts history
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY,
  module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  generated_code TEXT,
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Validation cache
CREATE TABLE validation_cache (
  module_id UUID PRIMARY KEY REFERENCES modules(id) ON DELETE CASCADE,
  lint_results JSONB,
  simulation_results JSONB,
  last_validated TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_modules_project ON modules(project_id);
CREATE INDEX idx_prompts_module ON prompt_history(module_id);
CREATE INDEX idx_prompts_created ON prompt_history(created_at DESC);
```

---

## API Endpoints

### Projects API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/[id]` | Get project details |
| `PUT` | `/api/projects/[id]` | Update project |
| `DELETE` | `/api/projects/[id]` | Delete project |
| `GET` | `/api/projects/[id]/modules` | List modules in project |

### Modules API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/modules/[id]` | Get module details |
| `PUT` | `/api/modules/[id]` | Update module |
| `DELETE` | `/api/modules/[id]` | Delete module |
| `POST` | `/api/modules/[id]/parse` | Parse Verilog to AST |
| `POST` | `/api/modules/[id]/validate` | Run validation |
| `POST` | `/api/modules/[id]/simulate` | Run simulation |
| `POST` | `/api/modules/[id]/generate` | LLM generation |

### FSM API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fsm/[id]/to-verilog` | Convert FSM → Verilog |
| `POST` | `/api/fsm/[id]/from-verilog` | Extract FSM from Verilog |

### LLM API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/llm/complete` | Generate code from prompt |

---

## UI Layout

```
+----------------------------------+----------------------------------+
|                                  |                                  |
|  FSM Visual Editor               |  Generated Verilog Code          |
|  (ReactFlow Canvas)              |  (Monaco Editor)                 |
|                                  |                                  |
+----------------------------------+----------------------------------+
|  Prompt Input                                                       |
|  > "Add a new state for error handling with timeout"               |
+---------------------------------------------------------------------+
|  Validation Results              |  Simulation Output               |
+----------------------------------+----------------------------------+
```

---

## Development Environment Setup

### Prerequisites

- Node.js 18+
- Docker Desktop (for simulation)
- PostgreSQL 15+
- Redis

### Installation

```bash
# Clone and install
git clone [repo-url]
cd rtl-copilot-plugin
npm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your credentials

# Database setup
npm run db:migrate

# Start development
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/rtl_copilot
REDIS_URL=redis://localhost:6379

# Auth (from get-shit-done)
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# LLM
ANTHROPIC_API_KEY=sk-ant-xxx

# Simulation (optional)
SIMULATION_DOCKER_IMAGE=rtl-copilot/simulator:latest
SIMULATION_TIMEOUT_MS=30000
```

---

## Testing Strategy

### Unit Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific module tests
npm test -- parser
npm test -- fsm
npm test -- llm
```

### Integration Tests

```bash
# API tests
npm run test:api

# E2E tests (Playwright)
npm run test:e2e
```

### Parser Benchmark Suite

```bash
# Run parser against 100+ Verilog examples
npm run test:parser-benchmark
```

---

## Deployment

### Production Infrastructure

```
Vercel (Frontend + API Routes)
├── Edge Functions for API
├── Static asset CDN
└── Serverless Functions

Railway
├── PostgreSQL database
├── Redis cache
└── Docker container for simulation
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| LLM generates incorrect Verilog | Comprehensive validation + user review + iteration |
| Parser misses edge cases | Start with subset, extensive tests, graceful degradation |
| Simulation slow/expensive | Caching, verilator, resource limits, local option |
| User adoption challenges | Focus on pain points, export to standard formats, free tier |

---

## Open Questions to Resolve

> [!IMPORTANT]
> Before starting development, the following decisions need to be made:

1. **Scope**: Start with FSM-only (faster MVP) or full Verilog support?
2. **Simulation**: Cloud-based or local executable option?
3. **Collaboration**: Multi-user editing needed from day 1?
4. **SystemVerilog**: Support subset or stick to Verilog-2001?
5. **Formal verification**: Integrate tools like SymbiYosys or defer?
6. **Licensing**: Open-source core with paid hosting, or fully proprietary?

---

## Next Steps (Week 0 Checklist)

- [ ] Confirm scope (all features or MVP first?)
- [ ] Decide monetization strategy (free vs paid)
- [ ] Commit to timeline (18/24/32 weeks?)
- [ ] Fork get-shit-done repo
- [ ] Set up local development environment
- [ ] Create project board (GitHub Projects or Linear)
- [ ] Reserve domain name
- [ ] Set up Anthropic API account
