# RTL Copilot - API Reference

REST API endpoints for the RTL Copilot IDE.

## Base URL

```
http://localhost:3000/api
```

---

## Projects

### List Projects
```http
GET /api/projects
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Project",
    "description": "Project description",
    "createdAt": "2026-01-21T00:00:00.000Z",
    "updatedAt": "2026-01-21T00:00:00.000Z"
  }
]
```

### Create Project
```http
POST /api/projects
Content-Type: application/json

{
  "name": "My Project",
  "description": "Optional description"
}
```

### Delete Project
```http
DELETE /api/projects/{id}
```

---

## Modules

### List Modules
```http
GET /api/modules?projectId={projectId}
```

### Get Module
```http
GET /api/modules/{id}
```

**Response:**
```json
{
  "id": "uuid",
  "projectId": "uuid",
  "name": "counter.v",
  "verilogCode": "module counter...",
  "fsmGraph": { ... },
  "metadata": { "type": "verilog" },
  "promptHistory": [],
  "validation": null
}
```

### Create Module
```http
POST /api/modules
Content-Type: application/json

{
  "projectId": "uuid",
  "name": "counter.v",
  "verilogCode": "module counter...",
  "metadata": { "type": "verilog" }
}
```

### Update Module
```http
PUT /api/modules/{id}
Content-Type: application/json

{
  "name": "counter.v",
  "verilogCode": "module counter..."
}
```

### Delete Module
```http
DELETE /api/modules/{id}
```

---

## FSM Conversion

### Verilog to FSM
```http
POST /api/fsm/from-verilog
Content-Type: application/json

{
  "verilogCode": "module fsm..."
}
```

**Response:**
```json
{
  "fsm": {
    "states": [...],
    "transitions": [...],
    "encoding": "binary"
  }
}
```

### FSM to Verilog
```http
POST /api/fsm/to-verilog
Content-Type: application/json

{
  "fsm": {
    "states": [...],
    "transitions": [...]
  },
  "options": {
    "encoding": "onehot",
    "moduleName": "my_fsm"
  }
}
```

---

## LLM Generation

### Generate Verilog
```http
POST /api/llm/generate
Content-Type: application/json

{
  "prompt": "Create a 4-bit counter with reset",
  "context": {
    "existingSignals": ["clk", "rst_n"],
    "moduleType": "sequential"
  }
}
```

### Autocomplete
```http
POST /api/llm/complete
Content-Type: application/json

{
  "code": "always @(posedge clk)",
  "cursorPosition": 21
}
```

---

## Simulation

### Run Simulation
```http
POST /api/simulation/run
Content-Type: application/json

{
  "moduleCode": "module counter...",
  "testbenchCode": "module tb_counter..."
}
```

**Response:**
```json
{
  "success": true,
  "output": "VVP simulation completed",
  "vcdFile": "base64-encoded-vcd",
  "errors": []
}
```

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Server Error - Internal failure |
