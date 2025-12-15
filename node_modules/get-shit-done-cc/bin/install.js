#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// Colors
const cyan = '\x1b[36m';
const green = '\x1b[32m';
const dim = '\x1b[2m';
const reset = '\x1b[0m';

// Get version from package.json
const pkg = require('../package.json');

const banner = `
${cyan}   ██████╗ ███████╗██████╗
  ██╔════╝ ██╔════╝██╔══██╗
  ██║  ███╗███████╗██║  ██║
  ██║   ██║╚════██║██║  ██║
  ╚██████╔╝███████║██████╔╝
   ╚═════╝ ╚══════╝╚═════╝${reset}

  Get Shit Done ${dim}v${pkg.version}${reset}
  A meta-prompting, context engineering and spec-driven
  development system for Claude Code by TÂCHES.
`;

console.log(banner);

// Paths
const src = path.join(__dirname, '..');
const claudeDir = path.join(os.homedir(), '.claude');
const commandsDir = path.join(claudeDir, 'commands');

// Create directories
fs.mkdirSync(commandsDir, { recursive: true });

// Copy commands/gsd
const gsdSrc = path.join(src, 'commands', 'gsd');
const gsdDest = path.join(commandsDir, 'gsd');
fs.cpSync(gsdSrc, gsdDest, { recursive: true });
console.log(`  ${green}✓${reset} Installed commands/gsd`);

// Copy get-shit-done
const skillSrc = path.join(src, 'get-shit-done');
const skillDest = path.join(claudeDir, 'get-shit-done');
fs.cpSync(skillSrc, skillDest, { recursive: true });
console.log(`  ${green}✓${reset} Installed get-shit-done`);

console.log(`
  ${green}Done!${reset} Run ${cyan}/gsd:help${reset} to get started.
`);
