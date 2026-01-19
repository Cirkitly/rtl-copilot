
/**
 * Few-shot examples for Verilog generation to guide the LLM.
 * These examples demonstrate the preferred coding style and structure.
 */

export interface Example {
    description: string;
    code: string;
}

const COMMON_EXAMPLES: Example[] = [
    {
        description: "Design a 4-to-1 multiplexer with 4-bit data lines.",
        code: `module mux4to1 (
  input [3:0] a,
  input [3:0] b,
  input [3:0] c,
  input [3:0] d,
  input [1:0] sel,
  output reg [3:0] out
);

  always @(*) begin
    case (sel)
      2'b00: out = a;
      2'b01: out = b;
      2'b10: out = c;
      2'b11: out = d;
      default: out = 4'b0000;
    endcase
  end

endmodule`
    },
    {
        description: "Create an 8-bit synchronous counter with active-low reset and enable.",
        code: `module counter8bit (
  input clk,
  input rst_n,
  input enable,
  output reg [7:0] count
);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      count <= 8'b0;
    end else if (enable) begin
      count <= count + 1;
    end
  end

endmodule`
    }
];

const FSM_EXAMPLES: Example[] = [
    {
        description: "Design a Moore FSM that detects the sequence 101.",
        code: `module sequence_detector_101 (
  input clk,
  input rst_n,
  input data_in,
  output reg detected
);

  // State encoding
  localparam [1:0] S_IDLE = 2'b00;
  localparam [1:0] S_GOT_1 = 2'b01;
  localparam [1:0] S_GOT_10 = 2'b10;
  
  reg [1:0] state, next_state;

  // State register
  always @(posedge clk or negedge rst_n) begin
    if (!rst_n)
      state <= S_IDLE;
    else
      state <= next_state;
  end

  // Next state logic
  always @(*) begin
    case (state)
      S_IDLE: begin
        if (data_in) next_state = S_GOT_1;
        else next_state = S_IDLE;
      end
      S_GOT_1: begin
        if (!data_in) next_state = S_GOT_10;
        else next_state = S_GOT_1;
      end
      S_GOT_10: begin
        if (data_in) next_state = S_IDLE; // Sequence 101 detected, go to IDLE (or overlap state)
        else next_state = S_IDLE;
      end
      default: next_state = S_IDLE;
    endcase
  end

  // Output logic
  always @(*) begin
    if (state == S_GOT_10 && data_in)
      detected = 1'b1;
    else
      detected = 1'b0;
  end

endmodule`
    }
];

export const getFewShotExamples = (topic: string = 'general'): Example[] => {
    if (topic.includes('fsm') || topic.includes('state machine')) {
        return [...COMMON_EXAMPLES, ...FSM_EXAMPLES];
    }
    return COMMON_EXAMPLES;
};
