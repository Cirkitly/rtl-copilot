#!/bin/bash
# RTL Copilot - Simulation Entrypoint Script
# Usage: docker run rtl-copilot-sim [compile|simulate] [args...]

set -e

ACTION="${1:-compile}"
shift || true

case "$ACTION" in
    compile)
        # Compile Verilog to VVP
        # Args: <output.vvp> <input1.v> [input2.v ...]
        OUTPUT="${1:-a.out}"
        shift || true
        iverilog -o "$OUTPUT" "$@"
        echo "Compilation successful: $OUTPUT"
        ;;
    simulate)
        # Run VVP simulation
        # Args: <input.vvp>
        VVP_FILE="${1:-a.out}"
        vvp "$VVP_FILE"
        ;;
    lint)
        # Lint with Verilator
        # Args: <input.v>
        verilator --lint-only -Wall "$@"
        echo "Lint passed"
        ;;
    *)
        echo "Usage: $0 [compile|simulate|lint] [args...]"
        exit 1
        ;;
esac
