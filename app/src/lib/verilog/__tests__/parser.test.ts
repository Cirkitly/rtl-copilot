/**
 * Verilog Parser Tests
 */
import { describe, it, expect } from 'vitest'
import { parse } from '../parser'

describe('VerilogParser', () => {
    describe('Module Declaration', () => {
        it('should parse empty module', () => {
            const code = `module empty_mod; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
            expect(result.cst).toBeDefined()
        })

        it('should parse module with ports', () => {
            const code = `module test(input clk, output data); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse module with parameters', () => {
            const code = `module test(input clk);
        parameter WIDTH = 8;
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse module with ANSI-style ports', () => {
            const code = `module test(
        input wire clk,
        input wire rst,
        output reg [7:0] data
      ); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Port Declarations', () => {
        it('should parse input port', () => {
            const code = `module m(input a); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse output port', () => {
            const code = `module m(output b); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse inout port', () => {
            const code = `module m(inout c); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse port with width [7:0]', () => {
            const code = `module m(input [7:0] data); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse port with wire type', () => {
            const code = `module m(input wire clk); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse port with reg type', () => {
            const code = `module m(output reg data); endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Wire and Reg Declarations', () => {
        it('should parse wire declaration', () => {
            const code = `module m; wire w; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse reg declaration', () => {
            const code = `module m; reg r; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse declaration with width', () => {
            const code = `module m; wire [31:0] data; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse multiple declarations', () => {
            const code = `module m; wire a, b, c; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Assign Statements', () => {
        it('should parse simple assign', () => {
            const code = `module m; assign out = in; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse assign with expression', () => {
            const code = `module m; assign out = a + b; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse assign with ternary', () => {
            const code = `module m; assign out = sel ? a : b; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse assign with bitwise ops', () => {
            const code = `module m; assign out = a & b | c; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Always Blocks', () => {
        it('should parse always @(*) combinational', () => {
            const code = `module m; always @(*) out = in; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse always @(posedge clk) sequential', () => {
            const code = `module m;
        always @(posedge clk) begin
          q <= d;
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse always with sensitivity list', () => {
            const code = `module m;
        always @(a or b or c) out = a + b + c;
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse always with async reset', () => {
            const code = `module m;
        always @(posedge clk or posedge rst) begin
          if (rst) q <= 0;
          else q <= d;
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Conditional Statements', () => {
        it('should parse if statement', () => {
            const code = `module m;
        always @(*) if (sel) out = a;
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse if-else statement', () => {
            const code = `module m;
        always @(*) begin
          if (sel) out = a;
          else out = b;
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse if-else-if chain', () => {
            const code = `module m;
        always @(*) begin
          if (sel == 0) out = a;
          else if (sel == 1) out = b;
          else out = c;
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Case Statements', () => {
        it('should parse case statement', () => {
            const code = `module m;
        always @(*) begin
          case(sel)
            0: out = a;
            1: out = b;
          endcase
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse case with default', () => {
            const code = `module m;
        always @(*) begin
          case(sel)
            0: out = a;
            default: out = b;
          endcase
        end
      endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Expressions', () => {
        it('should parse binary expressions', () => {
            const code = `module m; assign out = a + b * c; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse unary expressions', () => {
            const code = `module m; assign out = ~a & !b; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse ternary expressions', () => {
            const code = `module m; assign out = en ? (sel ? a : b) : c; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse concatenation {}', () => {
            const code = `module m; assign out = {a, b, c}; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse bit select [n]', () => {
            const code = `module m; assign bit = data[3]; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })

        it('should parse range select [m:n]', () => {
            const code = `module m; assign nibble = data[7:4]; endmodule`
            const result = parse(code)
            expect(result.errors).toHaveLength(0)
        })
    })

    describe('Error Handling', () => {
        it('should report syntax errors with location', () => {
            const code = `module m(; endmodule`  // Missing port
            const result = parse(code)
            expect(result.errors.length).toBeGreaterThan(0)
        })
    })
})

describe('Integration: Complete Modules', () => {
    it('should parse a simple counter', () => {
        const code = `module counter(
      input wire clk,
      input wire rst,
      output reg [7:0] count
    );
      always @(posedge clk or posedge rst) begin
        if (rst)
          count <= 0;
        else
          count <= count + 1;
      end
    endmodule`
        const result = parse(code)
        expect(result.errors).toHaveLength(0)
    })

    it('should parse a simple FSM', () => {
        const code = `module fsm(
      input wire clk,
      input wire rst,
      input wire go,
      output reg done
    );
      localparam IDLE = 0;
      localparam RUN = 1;
      localparam DONE = 2;
      
      reg [1:0] state;
      
      always @(posedge clk or posedge rst) begin
        if (rst) begin
          state <= IDLE;
          done <= 0;
        end else begin
          case(state)
            IDLE: begin
              if (go) state <= RUN;
            end
            RUN: begin
              state <= DONE;
            end
            DONE: begin
              done <= 1;
              state <= IDLE;
            end
            default: state <= IDLE;
          endcase
        end
      end
    endmodule`
        const result = parse(code)
        expect(result.errors).toHaveLength(0)
    })
})
