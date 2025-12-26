import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, 'logs');
const ERROR_LOG = path.join(LOG_DIR, 'vite_errors.log');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR);
// Clear previous logs
fs.writeFileSync(ERROR_LOG, '');

console.log("📡 Sentinel is watching Vite...");

const vite = spawn('npm', ['run', 'dev'], { 
  cwd: path.join(__dirname, '../system/frontend-app'),
  shell: true 
});

vite.stdout.on('data', (data) => {
  // console.log(`[Vite]: ${data}`); // Optional: Show normal logs
});

vite.stderr.on('data', (data) => {
  const msg = data.toString();
  // Filter out harmless warnings
  if (msg.includes('Error') || msg.includes('Warning')) {
    console.error(`
🚨 ERROR DETECTED:
${msg}`);
    fs.appendFileSync(ERROR_LOG, `[${new Date().toISOString()}] ${msg}\n`);
  }
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});
