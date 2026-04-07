#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// --- Colors ---
const c = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  cyan: '\x1b[0;36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  reset: '\x1b[0m',
};

const VERSION = '6.3.0';
const CLAUDE_DIR = path.join(os.homedir(), '.claude');

function info(msg) { console.log(`  ${c.cyan}${c.bold}INFO${c.reset}  ${msg}`); }
function ok(msg)   { console.log(`  ${c.green}${c.bold}  OK${c.reset}  ${msg}`); }
function warn(msg) { console.log(`  ${c.yellow}${c.bold}WARN${c.reset}  ${msg}`); }
function fail(msg) { console.error(`  ${c.red}${c.bold}FAIL${c.reset}  ${msg}`); process.exit(1); }
function step(msg) { console.log(`\n${c.bold}${msg}${c.reset}`); }

function banner() {
  console.log(`
${c.bold}  ____                            _              __      _
 / ___|  ___  __ _ _   _ _ __   __| | __ _       / _| ___(_)_ __ __ _
 \\___ \\ / _ \\/ _\` | | | | '_ \\ / _\` |/ _\` |_____|  _|/ _ \\ | '__/ _\` |
  ___) |  __/ (_| | |_| | | | | (_| | (_| |_____|  _|  __/ | | | (_| |
 |____/ \\___|\\__, |\\__,_|_| |_|\\__,_|\\__,_|     |_|  \\___|_|_|  \\__,_|
             |___/                                                      ${c.reset}
  ${c.dim}v${VERSION} — 49+ agentes de IA. 68 skills. 15 rules. O terror do CLT.${c.reset}
`);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  let count = 0;
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'install';

  if (command === '--help' || command === '-h') {
    banner();
    console.log(`  ${c.bold}Comandos:${c.reset}`);
    console.log(`  ${c.cyan}segunda-feira${c.reset}            Instala o framework`);
    console.log(`  ${c.cyan}segunda-feira install${c.reset}    Instala o framework`);
    console.log(`  ${c.cyan}segunda-feira update${c.reset}     Atualiza para versao mais recente`);
    console.log(`  ${c.cyan}segunda-feira uninstall${c.reset}  Remove o framework`);
    console.log(`  ${c.cyan}segunda-feira status${c.reset}     Verifica instalacao`);
    console.log(`  ${c.cyan}segunda-feira --version${c.reset}  Mostra versao`);
    console.log('');
    return;
  }

  if (command === '--version' || command === '-v') {
    console.log(`segunda-feira v${VERSION}`);
    return;
  }

  if (command === 'uninstall') {
    uninstall();
    return;
  }

  if (command === 'status') {
    status();
    return;
  }

  if (command === 'install' || command === 'update') {
    install();
    return;
  }

  console.log(`Comando desconhecido: ${command}`);
  console.log('Use: segunda-feira --help');
}

function install() {
  banner();

  // --- Package root (where npm installed us) ---
  const PKG_ROOT = path.resolve(__dirname, '..');

  // ============================================================
  // 1. CHECK PREREQUISITES
  // ============================================================
  step('1/5  Verificando requisitos...');

  // Check git
  try {
    const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim().split(' ').pop();
    ok(`Git instalado (${gitVersion})`);
  } catch {
    fail('Git nao encontrado. Instale: https://git-scm.com/');
  }

  // Check Claude Code
  try {
    execSync('which claude', { encoding: 'utf8' });
    ok('Claude Code instalado');
  } catch {
    warn('Claude Code nao encontrado — instale em https://docs.anthropic.com/en/docs/claude-code');
    warn('Continuando mesmo assim (os arquivos serao copiados)');
  }

  // Check ~/.claude
  if (fs.existsSync(CLAUDE_DIR)) {
    ok('Diretorio ~/.claude/ existe');
  } else {
    info('Criando ~/.claude/');
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    ok('Diretorio ~/.claude/ criado');
  }

  // ============================================================
  // 2. SOURCE
  // ============================================================
  step('2/5  Preparando Segunda-feira v' + VERSION + '...');
  ok('Usando pacote npm local (sem download adicional)');

  // ============================================================
  // 3. BACKUP
  // ============================================================
  step('3/5  Verificando instalacao existente...');

  let backupDir = null;
  const coreDirs = ['commands', 'agents', 'skills', 'rules', 'organization'];
  let backupNeeded = false;

  for (const dir of coreDirs) {
    const dirPath = path.join(CLAUDE_DIR, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      if (files.length > 0) {
        backupNeeded = true;
        break;
      }
    }
  }

  if (backupNeeded) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    backupDir = path.join(CLAUDE_DIR, `.segunda-feira-backup-${timestamp}`);
    warn('Instalacao anterior detectada');
    info(`Criando backup em ${path.basename(backupDir)}/`);
    fs.mkdirSync(backupDir, { recursive: true });

    const backupDirs = ['commands', 'agents', 'skills', 'rules', 'organization', 'scripts', 'templates', 'data', 'docs', 'hooks'];
    for (const dir of backupDirs) {
      const src = path.join(CLAUDE_DIR, dir);
      if (fs.existsSync(src)) {
        copyDir(src, path.join(backupDir, dir));
      }
    }
    const claudeMd = path.join(CLAUDE_DIR, 'CLAUDE.md');
    if (fs.existsSync(claudeMd)) {
      fs.copyFileSync(claudeMd, path.join(backupDir, 'CLAUDE.md'));
    }
    ok('Backup salvo');
  } else {
    ok('Primeira instalacao — sem backup necessario');
  }

  // ============================================================
  // 4. INSTALL
  // ============================================================
  step('4/5  Instalando componentes...');

  // Core directories
  const installDirs = ['commands', 'agents', 'skills', 'rules', 'organization', 'hooks', 'scripts', 'templates', 'data', 'docs'];
  for (const dir of installDirs) {
    const src = path.join(PKG_ROOT, dir);
    if (fs.existsSync(src)) {
      const dest = path.join(CLAUDE_DIR, dir);
      const count = copyDir(src, dest);
      const tag = ['hooks', 'scripts', 'templates', 'data', 'docs'].includes(dir) ? ` ${c.dim}[V6.3]${c.reset}` : '';
      ok(`${dir}/ (${count} arquivos)${tag}`);
    }
  }

  // Make scripts executable
  const scriptsDir = path.join(CLAUDE_DIR, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.sh'));
    for (const script of scripts) {
      try { fs.chmodSync(path.join(scriptsDir, script), 0o755); } catch {}
    }
  }

  // Make hooks executable
  const hooksDir = path.join(CLAUDE_DIR, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hookFiles = fs.readdirSync(hooksDir).filter(f => f.endsWith('.sh') || f.endsWith('.py'));
    for (const hook of hookFiles) {
      try { fs.chmodSync(path.join(hooksDir, hook), 0o755); } catch {}
    }
  }

  // CLAUDE.md — special handling
  const claudeMdSrc = path.join(PKG_ROOT, 'CLAUDE.md');
  const claudeMdDest = path.join(CLAUDE_DIR, 'CLAUDE.md');

  if (fs.existsSync(claudeMdDest)) {
    const content = fs.readFileSync(claudeMdDest, 'utf8');
    if (content.includes('Segunda-feira')) {
      fs.copyFileSync(claudeMdSrc, claudeMdDest);
      ok('CLAUDE.md atualizado (Segunda-feira detectado)');
    } else {
      const refPath = path.join(CLAUDE_DIR, 'CLAUDE.segunda-feira.md');
      fs.copyFileSync(claudeMdSrc, refPath);
      warn('CLAUDE.md customizado encontrado — salvo como CLAUDE.segunda-feira.md');
      warn('Mescle manualmente se desejar: ~/.claude/CLAUDE.segunda-feira.md');
    }
  } else {
    fs.copyFileSync(claudeMdSrc, claudeMdDest);
    ok('CLAUDE.md instalado');
  }

  // ============================================================
  // 5. VERIFY
  // ============================================================
  step('5/5  Verificando instalacao...');

  let agentCount = 0;
  let skillCount = 0;
  let ruleCount = 0;

  const countMd = (dir) => {
    if (!fs.existsSync(dir)) return 0;
    let count = 0;
    const walk = (d) => {
      for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(d, entry.name));
        else if (entry.name.endsWith('.md')) count++;
      }
    };
    walk(dir);
    return count;
  };

  agentCount = countMd(path.join(CLAUDE_DIR, 'commands')) + countMd(path.join(CLAUDE_DIR, 'agents'));
  skillCount = countMd(path.join(CLAUDE_DIR, 'skills'));
  ruleCount = countMd(path.join(CLAUDE_DIR, 'rules'));

  ok(`Agentes instalados: ${agentCount}`);
  ok(`Skills instaladas: ${skillCount}`);
  ok(`Rules instaladas: ${ruleCount}`);

  if (fs.existsSync(path.join(CLAUDE_DIR, 'scripts', 'health-check.sh'))) {
    ok('Health check disponivel: bash ~/.claude/scripts/health-check.sh');
  }

  // ============================================================
  // DONE
  // ============================================================
  console.log(`
${c.green}${c.bold}  +======================================================+
  |       Segunda-feira v${VERSION} instalado com sucesso!      |
  +======================================================+${c.reset}

  ${c.bold}Proximos passos:${c.reset}

  ${c.cyan}1.${c.reset} Abra o Claude Code no terminal
  ${c.cyan}2.${c.reset} Digite ${c.bold}@aios-master${c.reset} para ativar o master orchestrator
  ${c.cyan}3.${c.reset} Use ${c.bold}*help${c.reset} para ver todos os comandos

  ${c.bold}Comandos uteis:${c.reset}
  ${c.dim}@dev${c.reset}              Ativa o engenheiro senior
  ${c.dim}@content${c.reset}          Ativa a estrategista de conteudo
  ${c.dim}/paid-ads${c.reset}         Gestao de trafego pago
  ${c.dim}/copywriting${c.reset}      Copy persuasivo
  ${c.dim}bash ~/.claude/scripts/health-check.sh${c.reset}  Verifica integridade

  ${c.dim}Docs: https://github.com/DOMINA-IA/segunda-feira${c.reset}
  ${c.dim}Backup: ${backupDir ? path.basename(backupDir) : 'nenhum'}${c.reset}
`);
}

function uninstall() {
  banner();
  step('Removendo Segunda-feira...');

  const dirsToRemove = ['commands', 'agents', 'skills', 'rules', 'organization', 'hooks', 'scripts', 'templates', 'data', 'docs'];

  // Create backup first
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = path.join(CLAUDE_DIR, `.segunda-feira-backup-${timestamp}`);
  fs.mkdirSync(backupDir, { recursive: true });

  for (const dir of dirsToRemove) {
    const dirPath = path.join(CLAUDE_DIR, dir);
    if (fs.existsSync(dirPath)) {
      copyDir(dirPath, path.join(backupDir, dir));
      fs.rmSync(dirPath, { recursive: true, force: true });
      ok(`${dir}/ removido`);
    }
  }

  const claudeMd = path.join(CLAUDE_DIR, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    if (content.includes('Segunda-feira')) {
      fs.copyFileSync(claudeMd, path.join(backupDir, 'CLAUDE.md'));
      fs.unlinkSync(claudeMd);
      ok('CLAUDE.md removido');
    }
  }

  console.log(`
${c.green}${c.bold}  Segunda-feira removido.${c.reset}
  ${c.dim}Backup salvo em: ~/.claude/${path.basename(backupDir)}/${c.reset}
  ${c.dim}Para restaurar: cp -r ~/.claude/${path.basename(backupDir)}/* ~/.claude/${c.reset}
`);
}

function status() {
  banner();
  step('Status da instalacao...');

  const checks = [
    { name: 'CLAUDE.md', path: path.join(CLAUDE_DIR, 'CLAUDE.md'), type: 'file' },
    { name: 'agents/', path: path.join(CLAUDE_DIR, 'agents'), type: 'dir' },
    { name: 'commands/', path: path.join(CLAUDE_DIR, 'commands'), type: 'dir' },
    { name: 'skills/', path: path.join(CLAUDE_DIR, 'skills'), type: 'dir' },
    { name: 'rules/', path: path.join(CLAUDE_DIR, 'rules'), type: 'dir' },
    { name: 'hooks/', path: path.join(CLAUDE_DIR, 'hooks'), type: 'dir' },
    { name: 'organization/', path: path.join(CLAUDE_DIR, 'organization'), type: 'dir' },
  ];

  let installed = 0;
  for (const check of checks) {
    if (fs.existsSync(check.path)) {
      if (check.type === 'dir') {
        const count = fs.readdirSync(check.path).length;
        ok(`${check.name} (${count} itens)`);
      } else {
        ok(check.name);
      }
      installed++;
    } else {
      warn(`${check.name} nao encontrado`);
    }
  }

  console.log(`\n  ${c.bold}${installed}/${checks.length} componentes instalados${c.reset}\n`);
}

main();
