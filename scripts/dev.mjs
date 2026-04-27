import { spawn } from 'node:child_process';

const commands = [
  ['server', ['--prefix', 'packages/server', 'run', 'dev']],
  ['client', ['--prefix', 'packages/client', 'run', 'dev']],
];

const children = commands.map(([name, args]) => {
  const child = spawn('npm', args, {
    stdio: 'inherit',
    env: { ...process.env, npm_config_auto_install_peers: '', npm_config_strict_peer_dependencies: '' },
  });

  child.on('exit', (code, signal) => {
    if (signal) return;
    if (code && code !== 0) {
      console.error(`${name} dev server exited with code ${code}`);
      stopAll();
      process.exit(code);
    }
  });

  return child;
});

function stopAll() {
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
}

process.on('SIGINT', () => {
  stopAll();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stopAll();
  process.exit(0);
});
