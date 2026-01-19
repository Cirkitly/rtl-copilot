
import { describe, it, expect } from 'vitest';
import { createTrafficLightFSM, createSequenceDetectorFSM, FSM_TEMPLATES } from '../templates';
import { generateFSMVerilog } from '../generator';
import { validateFSM } from '../validator';

describe('FSM Templates', () => {
    describe('Traffic Light Controller', () => {
        it('should create a valid FSM structure', () => {
            const fsm = createTrafficLightFSM();

            expect(fsm.name).toBe('traffic_light_controller');
            expect(fsm.states).toHaveLength(3); // Red, Green, Yellow
            expect(fsm.transitions).toHaveLength(3); // Cycle
            expect(fsm.inputs).toHaveLength(1); // timer_done (clk/rst are separate properties)
            expect(fsm.outputs).toHaveLength(3); // red, yellow, green
        });

        it('should pass validation', () => {
            const fsm = createTrafficLightFSM();
            const errors = validateFSM(fsm);
            // Should have 0 errors. Maybe some info?
            const criticalErrors = errors.filter(e => e.severity === 'error');
            expect(criticalErrors).toHaveLength(0);
        });

        it('should generate valid Verilog', () => {
            const fsm = createTrafficLightFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('module traffic_light_controller');
            expect(verilog).toContain('localparam'); // Encoding
            expect(verilog).toContain('case (current_state)');
            expect(verilog).toContain('red = 1\'b1;'); // Moore output
        });
    });

    describe('Sequence Detector (101)', () => {
        it('should create a valid FSM structure', () => {
            const fsm = createSequenceDetectorFSM();

            expect(fsm.name).toBe('sequence_detector_101');
            expect(fsm.states).toHaveLength(4); // IDLE, GOT1, GOT10, FOUND
            expect(fsm.transitions.length).toBeGreaterThan(0);

            // Initial state check
            const initial = fsm.states.find(s => s.isInitial);
            expect(initial).toBeDefined();
            expect(initial?.name).toBe('IDLE');
        });

        it('should generate valid Verilog', () => {
            const fsm = createSequenceDetectorFSM();
            const verilog = generateFSMVerilog(fsm);

            expect(verilog).toContain('module sequence_detector_101');
            expect(verilog).toContain('input wire data_in');
            expect(verilog).toContain('output reg sequence_found');
        });
    });

    describe('Template Registry', () => {
        it('should register all templates', () => {
            expect(FSM_TEMPLATES).toHaveLength(2);
            expect(FSM_TEMPLATES.map(t => t.id)).toContain('traffic-light');
            expect(FSM_TEMPLATES.map(t => t.id)).toContain('seq-detector-101');
        });
    });
});
