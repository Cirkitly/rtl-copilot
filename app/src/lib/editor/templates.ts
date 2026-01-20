
import { VerilogModule } from '../verilog/types';
import { generateExpression } from '../verilog/generator';

/**
 * Generates a module instantiation template code snippet.
 * @param moduleAST The AST of the module to instantiate.
 * @param instanceName Optional instance name (default: u_moduleName)
 */
export const getInstantiationTemplate = (moduleAST: VerilogModule, instanceName?: string): string => {
    const modName = moduleAST.name;
    const instName = instanceName || `u_${modName}`;

    // Calculate max port length for alignment
    const maxPortLength = moduleAST.ports.reduce((max, port) => Math.max(max, port.name.length), 0);

    const portConnections = moduleAST.ports.map(port => {
        const padding = ' '.repeat(maxPortLength - port.name.length);
        return `  .${port.name}${padding} ( ${port.name}${padding} )`; // Default connection to same signal name
    }).join(',\n');

    const paramConnections = moduleAST.parameters && moduleAST.parameters.length > 0
        ? `#(\n${moduleAST.parameters.map(p => `  .${p.name}(${generateExpression(p.value)})`).join(',\n')}\n) `
        : '';

    return `${modName} ${paramConnections}${instName} (\n${portConnections}\n);`;
};
