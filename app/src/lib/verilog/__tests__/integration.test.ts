/**
 * Integration Tests with Real Verilog Files
 * Tests the complete pipeline: lex → parse → validate → generate
 */
import { describe, it, expect } from 'vitest'
import { tokenize } from '../lexer'
import { parse } from '../parser'
import { validateModule } from '../validator'
import { IverilogChecker } from '../iverilog'
import { ErrorFormatter, formatErrors } from '../errors'

// ============================================================================
// Real Verilog Examples
// ============================================================================

const COUNTER_8BIT = `
module counter_8bit(
    input wire clk,
    input wire rst_n,
    input wire enable,
    output reg [7:0] count
);

    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            count <= 8'b0;
        else if (enable)
            count <= count + 1'b1;
    end
    
endmodule
`

const FSM_TRAFFIC_LIGHT = `
module traffic_light(
    input wire clk,
    input wire rst,
    output reg [2:0] lights  // [RED, YELLOW, GREEN]
);

    // State encoding
    localparam IDLE   = 2'b00;
    localparam GREEN  = 2'b01;
    localparam YELLOW = 2'b10;
    localparam RED    = 2'b11;
    
    reg [1:0] state, next_state;
    reg [3:0] timer;
    
    // State register
    always @(posedge clk or posedge rst) begin
        if (rst) begin
            state <= IDLE;
            timer <= 4'b0;
        end else begin
            state <= next_state;
            timer <= timer + 1'b1;
        end
    end
    
    // Next state logic
    always @(*) begin
        case(state)
            IDLE:   next_state = GREEN;
            GREEN:  next_state = (timer == 4'd10) ? YELLOW : GREEN;
            YELLOW: next_state = (timer == 4'd3) ? RED : YELLOW;
            RED:    next_state = (timer == 4'd10) ? GREEN : RED;
            default: next_state = IDLE;
        endcase
    end
    
    // Output logic
    always @(*) begin
        case(state)
            GREEN:  lights = 3'b001;
            YELLOW: lights = 3'b010;
            RED:    lights = 3'b100;
            default: lights = 3'b000;
        endcase
    end
    
endmodule
`

const UART_TX = `
module uart_tx(
    input wire clk,
    input wire rst_n,
    input wire [7:0] data_in,
    input wire tx_start,
    output reg tx_out,
    output reg tx_busy
);

    localparam IDLE = 2'b00;
    localparam START = 2'b01;
    localparam DATA = 2'b10;
    localparam STOP = 2'b11;
    localparam CLKS_PER_BIT = 868;
    
    reg [1:0] state;
    reg [15:0] clk_count;
    reg [2:0] bit_index;
    reg [7:0] tx_data;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n) begin
            state <= IDLE;
            tx_out <= 1'b1;
            tx_busy <= 1'b0;
            clk_count <= 16'b0;
            bit_index <= 3'b0;
        end else begin
            case(state)
                IDLE: begin
                    tx_out <= 1'b1;
                    tx_busy <= 1'b0;
                    if (tx_start) begin
                        tx_data <= data_in;
                        state <= START;
                        tx_busy <= 1'b1;
                    end
                end
                START: begin
                    tx_out <= 1'b0;
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1'b1;
                    end else begin
                        clk_count <= 16'b0;
                        state <= DATA;
                    end
                end
                DATA: begin
                    tx_out <= tx_data[bit_index];
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1'b1;
                    end else begin
                        clk_count <= 16'b0;
                        if (bit_index < 7) begin
                            bit_index <= bit_index + 1'b1;
                        end else begin
                            bit_index <= 3'b0;
                            state <= STOP;
                        end
                    end
                end
                STOP: begin
                    tx_out <= 1'b1;
                    if (clk_count < CLKS_PER_BIT - 1) begin
                        clk_count <= clk_count + 1'b1;
                    end else begin
                        clk_count <= 16'b0;
                        state <= IDLE;
                    end
                end
                default: state <= IDLE;
            endcase
        end
    end
    
endmodule
`

const ALU_4BIT = `
module alu_4bit(
    input wire [3:0] a,
    input wire [3:0] b,
    input wire [2:0] op,
    output reg [7:0] result,
    output reg zero,
    output reg carry
);

    always @(*) begin
        carry = 1'b0;
        case(op)
            3'b000: {carry, result} = a + b;           // ADD
            3'b001: result = a - b;                     // SUB
            3'b010: result = a & b;                     // AND
            3'b011: result = a | b;                     // OR
            3'b100: result = a ^ b;                     // XOR
            3'b101: result = ~a;                        // NOT
            3'b110: result = a << b[1:0];               // SHL
            3'b111: result = a >> b[1:0];               // SHR
            default: result = 8'b0;
        endcase
        zero = (result == 8'b0);
    end
    
endmodule
`

const SHIFT_REGISTER = `
module shift_register(
    input wire clk,
    input wire rst_n,
    input wire load,
    input wire shift_en,
    input wire serial_in,
    input wire [7:0] parallel_in,
    output wire serial_out,
    output wire [7:0] parallel_out
);

    reg [7:0] data;
    
    always @(posedge clk or negedge rst_n) begin
        if (!rst_n)
            data <= 8'b0;
        else if (load)
            data <= parallel_in;
        else if (shift_en)
            data <= {data[6:0], serial_in};
    end
    
    assign serial_out = data[7];
    assign parallel_out = data;
    
endmodule
`

// ============================================================================
// Integration Tests
// ============================================================================

describe('Integration: Complete Pipeline', () => {
    describe('Lexer → Parser Pipeline', () => {
        it('should lex and parse 8-bit counter', () => {
            const lexResult = tokenize(COUNTER_8BIT)
            expect(lexResult.errors).toHaveLength(0)
            expect(lexResult.tokens.length).toBeGreaterThan(0)

            const parseResult = parse(COUNTER_8BIT)
            expect(parseResult.errors).toHaveLength(0)
            expect(parseResult.cst).toBeDefined()
        })

        it('should lex and parse traffic light FSM', () => {
            const lexResult = tokenize(FSM_TRAFFIC_LIGHT)
            expect(lexResult.errors).toHaveLength(0)

            const parseResult = parse(FSM_TRAFFIC_LIGHT)
            expect(parseResult.errors).toHaveLength(0)
        })

        it('should lex and parse UART transmitter', () => {
            const lexResult = tokenize(UART_TX)
            expect(lexResult.errors).toHaveLength(0)

            const parseResult = parse(UART_TX)
            expect(parseResult.errors).toHaveLength(0)
        })

        it('should lex and parse 4-bit ALU', () => {
            const lexResult = tokenize(ALU_4BIT)
            expect(lexResult.errors).toHaveLength(0)

            const parseResult = parse(ALU_4BIT)
            expect(parseResult.errors).toHaveLength(0)
        })

        it('should lex and parse shift register', () => {
            const lexResult = tokenize(SHIFT_REGISTER)
            expect(lexResult.errors).toHaveLength(0)

            const parseResult = parse(SHIFT_REGISTER)
            expect(parseResult.errors).toHaveLength(0)
        })
    })

    describe('Iverilog Validation', () => {
        it('should validate counter with iverilog', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return // Skip if not installed
            }

            const result = await checker.validate(COUNTER_8BIT)
            expect(result.available).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should validate FSM with iverilog', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return
            }

            const result = await checker.validate(FSM_TRAFFIC_LIGHT)
            expect(result.errors).toHaveLength(0)
        })

        it('should validate parameterized module with iverilog', async () => {
            const checker = new IverilogChecker()
            if (!(await checker.isAvailable())) {
                return
            }

            const result = await checker.validate(SHIFT_REGISTER)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Error Formatting', () => {
        it('should format parse errors with source context', () => {
            const badCode = `module test;
  assign out = ;
endmodule`

            const parseResult = parse(badCode)
            expect(parseResult.errors.length).toBeGreaterThan(0)

            const report = formatErrors(
                badCode,
                parseResult.errors.map(e => ({
                    message: e.message,
                    severity: 'error' as const,
                    line: e.line,
                    column: e.column,
                })),
                'test.v'
            )

            expect(report.totalErrors).toBeGreaterThan(0)
        })

        it('should create readable error output', () => {
            const source = 'wire = ;'
            const formatter = new ErrorFormatter(source, 'error.v')

            const error = formatter.format({
                message: 'Expected identifier',
                severity: 'error',
                line: 1,
                column: 6,
            })

            const output = formatter.formatAsString(error)
            expect(output).toContain('error.v:1:6')
            expect(output).toContain('Expected identifier')
        })
    })
})

describe('Integration: Complex Patterns', () => {
    it('should handle nested always blocks', () => {
        const code = `
        module nested;
            always @(*) begin
                if (a) begin
                    if (b) begin
                        out = c;
                    end else begin
                        out = d;
                    end
                end
            end
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle multiple case statements', () => {
        const code = `
        module multi_case;
            always @(*) begin
                case(sel1)
                    0: out1 = a;
                    default: out1 = b;
                endcase
                case(sel2)
                    0: out2 = c;
                    1: out2 = d;
                    default: out2 = e;
                endcase
            end
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle multiple always blocks', () => {
        const code = `
        module multi_always;
            always @(posedge clk) q1 <= d1;
            always @(posedge clk) q2 <= d2;
            always @(*) out = a & b;
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle concatenation in expressions', () => {
        const code = `
        module concat;
            assign out = {a, b, c, d};
            assign wide = {a, b, c, d, e, f, g, h};
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle complex expressions', () => {
        const code = `
        module expressions;
            assign out = (a & b) | (c ^ d);
            assign mux = sel ? (en ? a : b) : c;
            assign arith = a + b * c - d / e;
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })
})

describe('Integration: Edge Cases', () => {
    it('should handle empty module', () => {
        const code = `module empty; endmodule`
        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle module with only ports', () => {
        const code = `module ports(input a, output b); endmodule`
        expect(parse(code).errors).toHaveLength(0)
    })

    it('should handle comments in code', () => {
        const code = `
        // Single line comment
        module commented;
            /* Multi-line
               comment */
            wire a; // inline comment
        endmodule`

        const lexResult = tokenize(code)
        expect(lexResult.errors).toHaveLength(0)
        expect(lexResult.comments.length).toBeGreaterThan(0)
    })

    it('should handle sized literals', () => {
        const code = `
        module literals;
            assign a = 8'hFF;
            assign b = 4'b1010;
            assign c = 32'd100;
            assign d = 8'o77;
        endmodule`

        expect(parse(code).errors).toHaveLength(0)
    })
})
