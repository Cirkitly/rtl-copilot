<div align="center">

# RTL Copilot

**Verilog Generator & Smart FSM Editor**

A web-based tool combining natural language Verilog generation with visual FSM editing for rapid prototyping and verification of digital logic designs.

[![CI](https://github.com/cirkitly/rtl-copilot-plugin/actions/workflows/ci.yml/badge.svg)](https://github.com/cirkitly/rtl-copilot-plugin/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)

</div>

---

## Overview

RTL Copilot helps embedded hardware developers and FPGA engineers:

- **Generate Verilog from natural language** — Describe what you want, get syntactically correct RTL
- **Visually design FSMs** — Drag-and-drop state machine editor with automatic code generation  
- **Catch bugs early** — Detect common RTL issues before simulation
- **Integrate with your workflow** — Export to standard formats for existing EDA toolchains

---

## Features

### 🤖 Natural Language to Verilog
Describe your hardware in plain English. RTL Copilot generates clean, synthesizable Verilog with proper coding conventions.

### 🔄 Visual FSM Editor
Design state machines graphically with ReactFlow-based canvas. Real-time bidirectional sync between visual editor and code.

### ✅ Built-in Validation
Lint rules catch common mistakes:
- Undriven/unread signals
- Combinational loops
- Blocking vs non-blocking assignment issues
- Clock domain crossing warnings

### 📊 Simulation & Waveforms
Run testbenches with integrated iverilog/verilator backend. View results with in-browser waveform viewer.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React, TypeScript |
| State | Zustand |
| FSM Canvas | ReactFlow |
| Code Editor | Monaco Editor |
| Visualization | D3.js |
| Styling | Tailwind CSS |
| LLM | Anthropic Claude API |
| Database | PostgreSQL + Redis |
| Simulation | iverilog / verilator (Docker) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis
- Docker Desktop (for simulation)
- Anthropic API key

### Installation

```bash
# Clone the repository
git clone https://github.com/cirkitly/rtl-copilot-plugin.git
cd rtl-copilot-plugin

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/rtl_copilot
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-xxx
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Proposal](docs/proposal.md) | Full project proposal with architecture details |
| [Implementation Plan](docs/implementation.md) | Technical implementation guide |
| [Task Breakdown](docs/task.md) | Development checklist (24 weeks) |

### Visual Walkthrough

#### FSM Editor with Real-time Verilog Sync

![FSM Editor Preview](docs/assets/fsm_editor_preview.png)

#### Auto-Layout Support

![FSM Editor Layout](docs/assets/fsm_editor_layout.png)

---
---

## Project Status

**Phase:** Planning  
**Timeline:** 24 weeks (6 months)

### Roadmap

| Phase | Weeks | Status |
|-------|-------|--------|
| 1. Foundation | 1-3 | ✅ Completed |
| 2. Verilog Core | 4-7 | ✅ Completed |
| 3. FSM Editor | 8-11 | ✅ Completed |
| 4. LLM Integration | 12-15 | 🔲 Not Started |
| 5. Code Editor & UI | 16-18 | 🔲 Not Started |
| 6. Simulation | 19-21 | 🔲 Not Started |
| 7. Polish & Deploy | 22-24 | 🔲 Not Started |

---

## Architecture

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

---

## Contributing

Contributions are welcome! Please read the implementation plan before getting started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built for hardware engineers who want to move fast.**

</div>
