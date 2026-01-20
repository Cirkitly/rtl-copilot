# RTL Copilot - Verilog Simulation Container
# Base image: Debian bookworm-slim for minimal footprint
FROM debian:bookworm-slim

# Install simulation tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    iverilog \
    verilator \
    && rm -rf /var/lib/apt/lists/*

# Create working directory
WORKDIR /workspace

# Copy entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Default command
ENTRYPOINT ["/entrypoint.sh"]
