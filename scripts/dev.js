const { spawn } = require('child_process');

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const processes = [
  {
    name: 'backend',
    args: ['--prefix', 'backend', 'run', 'dev'],
  },
  {
    name: 'frontend',
    args: ['--prefix', 'frontend', 'run', 'dev'],
  },
];

const children = processes.map(({ name, args }) => {
  const child = spawn(npmCmd, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`${name} dev server exited with code ${code}`);
      shutdown(code);
    }
  });

  return child;
});

let shuttingDown = false;

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
