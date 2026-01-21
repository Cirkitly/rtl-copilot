# RTL Copilot - Quick Start Guide

Get up and running with RTL Copilot in 5 minutes.

## Prerequisites

- Node.js 20+
- PostgreSQL 15+ (optional - localStorage fallback available)

## Installation

```bash
# Clone the repository
git clone https://github.com/cirkitly/rtl-copilot-plugin.git
cd rtl-copilot-plugin/app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### 1. Create a Project

1. Click **"Launch IDE"** on the landing page
2. Click **"Select Project"** dropdown
3. Click **+** to create a new project
4. Enter a project name and click **Create**

### 2. Create a Verilog Module

1. In the file explorer, click **+** to add a new file
2. Name it `counter.v` (or any `.v` file)
3. The editor opens with a boilerplate module

### 3. Design an FSM

1. Click on a `.fsm` file or use the FSM panel
2. Click **+** button to add states
3. Drag between states to create transitions
4. View generated Verilog in the preview panel

### 4. Run Simulation

1. Click the **Run** button in the toolbar
2. View waveforms in the bottom panel
3. Zoom/pan to inspect signals

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+S` | Save current file |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

## Next Steps

- Read the [Architecture Guide](ARCHITECTURE.md) to understand the codebase
- Check the [API Documentation](API.md) for backend endpoints
- Explore the FSM templates in the editor

---

**Need help?** Open an issue on [GitHub](https://github.com/cirkitly/rtl-copilot-plugin/issues).
