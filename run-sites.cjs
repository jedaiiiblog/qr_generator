// Windows PTY adapter: keep credentials on hidden stdin and use ordinary pipes
// for the bundled helper's inherited child stdio.
const {spawn} = require('node:child_process');
let input = '';
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.setEncoding('utf8');
process.stderr.write('Ready for Site workflow JSON on stdin (input is hidden).\n');
process.stdin.on('data', chunk => {
  input += chunk;
  if (!input.includes('\n') && !input.includes('\r')) return;
  process.stdin.pause();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  const child = spawn(process.execPath, ['C:/Users/User/.codex/plugins/cache/openai-curated-remote/sites/1.0.0-d/scripts/site-workflow.mjs','--project-id','appgprj_6ac79862cb848191954528aa2d9e0b86'], {stdio:['pipe','pipe','pipe'],env:process.env});
  child.stdout.on('data', data=>process.stdout.write(data));
  child.stderr.on('data', data=>process.stderr.write(data));
  child.on('error', e=>{console.error(e.code);process.exitCode=1;});
  child.on('close', code=>{process.exitCode=code;});
  child.stdin.end(input.trim()+'\n');
  input = '';
});
