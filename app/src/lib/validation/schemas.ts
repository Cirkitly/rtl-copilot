import { z } from 'zod';

// ==========================================
// Project Schemas
// ==========================================

export const createProjectSchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// ==========================================
// Module Schemas
// ==========================================

export const createModuleSchema = z.object({
    projectId: z.string().uuid('Invalid project ID'),
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    verilogCode: z.string().optional(),
    fsmGraph: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateModuleSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    verilogCode: z.string().optional(),
    fsmGraph: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateModuleInput = z.infer<typeof createModuleSchema>;
export type UpdateModuleInput = z.infer<typeof updateModuleSchema>;

// ==========================================
// FSM Schemas
// ==========================================

export const fsmStateSchema = z.object({
    id: z.string(),
    name: z.string().min(1),
    outputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    isInitial: z.boolean().optional(),
    position: z.object({
        x: z.number(),
        y: z.number(),
    }).optional(),
});

export const fsmTransitionSchema = z.object({
    id: z.string(),
    from: z.string(),
    to: z.string(),
    condition: z.string().optional(),
    actions: z.array(z.string()).optional(),
});

export const fsmSchema = z.object({
    states: z.array(fsmStateSchema),
    transitions: z.array(fsmTransitionSchema),
    encoding: z.enum(['binary', 'onehot', 'gray']).optional(),
    moduleName: z.string().optional(),
});

export const fsmToVerilogSchema = z.object({
    fsm: fsmSchema,
    options: z.object({
        encoding: z.enum(['binary', 'onehot', 'gray']).optional(),
        moduleName: z.string().optional(),
        resetType: z.enum(['sync', 'async']).optional(),
    }).optional(),
});

export const verilogToFsmSchema = z.object({
    verilogCode: z.string().min(1, 'Verilog code is required'),
});

export type FSMState = z.infer<typeof fsmStateSchema>;
export type FSMTransition = z.infer<typeof fsmTransitionSchema>;
export type FSM = z.infer<typeof fsmSchema>;
export type FSMToVerilogInput = z.infer<typeof fsmToVerilogSchema>;
export type VerilogToFSMInput = z.infer<typeof verilogToFsmSchema>;

// ==========================================
// LLM Schemas
// ==========================================

export const llmGenerateSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required').max(5000, 'Prompt too long'),
    context: z.object({
        existingSignals: z.array(z.string()).optional(),
        moduleType: z.enum(['sequential', 'combinational', 'fsm']).optional(),
        existingCode: z.string().optional(),
    }).optional(),
});

export const llmCompleteSchema = z.object({
    code: z.string().min(1),
    cursorPosition: z.number().min(0),
});

export type LLMGenerateInput = z.infer<typeof llmGenerateSchema>;
export type LLMCompleteInput = z.infer<typeof llmCompleteSchema>;

// ==========================================
// Simulation Schemas
// ==========================================

export const simulationRunSchema = z.object({
    moduleCode: z.string().min(1, 'Module code is required'),
    testbenchCode: z.string().optional(),
});

export type SimulationRunInput = z.infer<typeof simulationRunSchema>;

// ==========================================
// Validation Helper
// ==========================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return { success: false, error: errors };
}
