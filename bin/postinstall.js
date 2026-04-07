#!/usr/bin/env node

// Auto-install when user runs: npm install segunda-feira
// This runs after npm finishes installing the package

const isGlobal = process.env.npm_config_global === 'true' ||
                 (process.env.npm_config_prefix && !process.env.npm_config_prefix.includes('node_modules'));

// Only auto-install on global installs or npx runs
// For local installs (in a project), just show a message
if (!isGlobal && !process.env.npm_execpath?.includes('npx')) {
  console.log('\n  \x1b[1mSegunda-feira v6.3\x1b[0m instalado como dependencia.');
  console.log('  Para instalar o framework no Claude Code, execute:');
  console.log('  \x1b[36m  npx segunda-feira install\x1b[0m\n');
  process.exit(0);
}

// For global install: auto-run the installer
try {
  require('./cli.js');
} catch (err) {
  // Silently skip if already handled by cli.js
}
