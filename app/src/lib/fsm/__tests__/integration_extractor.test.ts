/**
 * Integration Tests for Verilog -> FSM Pipeline
 * Tests the full chain: CST Parser -> AST Visitor -> FSM Extractor
 */

import { describe, it, expect } from 'vitest';
import { parse } from '../../verilog/parser';
import { cstToAst } from '../../verilog/visitor';
import { extractFSM } from '../extractor';

describe('FSM Extraction Integration', () => {

    it('should extract FSM from valid Verilog code', () => {
        const code = `
      module traffic_light(
        input wire clk,
        input wire rst,
        input wire start,
        output reg red,
        output reg green
      );
        localparam [1:0] IDLE = 2'b00;
        localparam [1:0] GO = 2'b01;
        
        reg [1:0] state, next_state;
        
        // State Register
        always @(posedge clk or posedge rst) begin
          if (rst) state <= IDLE;
          else state <= next_state;
        end
        
        // Next State Logic
        always @(*) begin
          next_state = state;
          case (state)
            IDLE: begin
              if (start) next_state = GO;
            end
            GO: begin
              next_state = IDLE;
            end
          endcase
        end
      endmodule
    `;

        // 1. Parse
        const parseResult = parse(code);
        expect(parseResult.errors).toHaveLength(0);
        expect(parseResult.cst).toBeDefined();

        // 2. CST -> AST
        const ast = cstToAst(parseResult.cst);
        expect(ast).toBeDefined();
        expect(ast.name).toBe('traffic_light');
        expect(ast.declarations.length).toBeGreaterThan(0);

        // 3. Extract FSM
        const result = extractFSM(ast);
        expect(result.success).toBe(true);
        expect(result.fsm).toBeDefined();

        // Check FSM properties
        const fsm = result.fsm!;
        expect(fsm.states).toHaveLength(2);
        expect(fsm.states.map(s => s.name)).toContain('IDLE');
        expect(fsm.states.map(s => s.name)).toContain('GO');

        // Check Transitions
        // IDLE -> GO (start)
        const t1 = fsm.transitions.find(t =>
            fsm.states.find(s => s.id === t.from)?.name === 'IDLE' &&
            fsm.states.find(s => s.id === t.to)?.name === 'GO'
        );
        expect(t1).toBeDefined();

        // GO -> IDLE (unconditional)
        const t2 = fsm.transitions.find(t =>
            fsm.states.find(s => s.id === t.from)?.name === 'GO' &&
            fsm.states.find(s => s.id === t.to)?.name === 'IDLE'
        );
        expect(t2).toBeDefined();
    });
});
