const fs = require('node:fs/promises');
const path = require('node:path');
let pending = Promise.resolve();
const defaults = () => ({ theme: 'light', foldersOpen: [], autoSave: true });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
function parse(raw) {
  const text = raw.replace(/^\uFEFF/, '');
  try { const value = JSON.parse(text); if (!object(value)) throw new Error('Settings must be an object'); return { value, recovered: false }; } catch {}
  // Recover the observed premature closing brace followed by another property.
  try { const value = JSON.parse(text.replace(/}\s*(?="[^"]+"\s*:)/, ',')); if (object(value)) return { value, recovered: true }; } catch {}
  // Preserve a complete leading object when unrelated text follows it.
  let depth = 0, quoted = false, escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) { if (escaped) escaped = false; else if (c === '\\') escaped = true; else if (c === '"') quoted = false; continue; }
    if (c === '"') quoted = true;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) {
      try { const value = JSON.parse(text.slice(0, i + 1)); if (object(value)) return { value, recovered: true }; } catch {}
      break;
    }
  }
  return { value: defaults(), recovered: true };
}
function serial(task) { const result = pending.then(task); pending = result.catch(() => {}); return result; }
async function atomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temp = file + '.writing-' + process.pid;
  try { await fs.writeFile(temp, JSON.stringify(value, null, 2) + '\n'); await fs.rename(temp, file); }
  finally { await fs.rm(temp, { force: true }).catch(() => {}); }
}
exports.parse = parse;
exports.read = file => serial(async () => {
  let raw; try { raw = await fs.readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return defaults(); throw error; }
  const result = parse(raw);
  if (result.recovered) {
    await fs.writeFile(file + '.invalid-' + Date.now() + '.bak', raw, { flag: 'wx' });
    await atomic(file, result.value);
  }
  return result.value;
});
exports.write = (file, value) => serial(async () => {
  if (!object(value)) throw new Error('Settings must be an object');
  await atomic(file, value);
});
