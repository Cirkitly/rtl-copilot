# RTL Copilot - Architecture

High-level system design and component breakdown.

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                     │
├─────────────────────────────┬───────────────────────────────┤
│   FSM Visual Editor         │   Monaco Code Editor          │
│   (ReactFlow)               │   (Verilog syntax)            │
├─────────────────────────────┴───────────────────────────────┤
│                    Prompt Input Bar                          │
├─────────────────────────────┬───────────────────────────────┤
│   Validation Results        │   Simulation Waveforms        │
└─────────────────────────────┴───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Next.js API)                      │
├─────────────────────────────────────────────────────────────┤
│  Verilog Parser  │  FSM Engine  │  LLM Client  │  Validator │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         PostgreSQL        Redis          Docker
         (projects)       (cache)       (simulation)
```

## Directory Structure

```
app/src/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   │   ├── projects/       # Project CRUD
│   │   ├── modules/        # Module CRUD
│   │   ├── fsm/            # FSM conversion
│   │   ├── llm/            # LLM generation
│   │   └── simulation/     # iverilog/verilator
│   ├── editor/             # IDE page
│   └── page.tsx            # Landing page
├── components/
│   ├── fsm/                # FSM editor components
│   ├── editor/             # Monaco editor wrapper
│   ├── layout/             # FileTree, Toolbar, Tabs
│   └── waveform/           # Waveform viewer
├── lib/
│   ├── verilog/            # Parser, Generator, Validator
│   ├── fsm/                # FSM store, encoding, templates
│   ├── llm/                # Provider interface, prompts
│   ├── store/              # Zustand stores
│   └── waveform/           # VCD parser
└── db/                     # Drizzle ORM schema
```

## Key Technologies

| Component | Technology | Purpose |
|-----------|------------|---------|
| Framework | Next.js 16 | SSR, API routes |
| UI | React 19, TailwindCSS | Component rendering |
| State | Zustand | Client state management |
| FSM Canvas | ReactFlow | Visual graph editing |
| Code Editor | Monaco | Verilog editing |
| Parser | Chevrotain | Verilog lexer/parser |
| Database | Drizzle + PostgreSQL | Project persistence |
| Simulation | iverilog/verilator | Verilog compilation |

## Data Flow

### 1. FSM to Verilog
```
User creates states/transitions
    ↓
FSM Store (Zustand) updates
    ↓
FSM Generator produces AST
    ↓
Verilog Generator outputs code
    ↓
Code appears in preview panel
```

### 2. Verilog to FSM
```
User pastes Verilog code
    ↓
Parser creates AST
    ↓
FSM Extractor detects patterns
    ↓
Layout algorithm positions nodes
    ↓
FSM appears in visual editor
```

### 3. Simulation Flow
```
User clicks Run
    ↓
API sends code to Docker container
    ↓
iverilog compiles and runs
    ↓
VCD output returned
    ↓
Parser extracts signals
    ↓
WaveformViewer renders canvas
```

## Database Schema

```
projects          modules           prompt_history
├── id            ├── id            ├── id
├── name          ├── project_id    ├── module_id
├── description   ├── name          ├── prompt
└── timestamps    ├── verilog_code  ├── generated_code
                  ├── fsm_graph     └── accepted
                  └── metadata
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List all projects |
| POST | `/api/projects` | Create project |
| GET | `/api/modules?projectId=X` | List modules |
| PUT | `/api/modules/[id]` | Update module |
| POST | `/api/simulation/run` | Run simulation |
| POST | `/api/llm/generate` | Generate Verilog |
