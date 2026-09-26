const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

function shortcutFixture() {
  const from = script.indexOf("window.addEventListener('keydown'");
  const until = script.indexOf('// Initialize', from);
  assert.ok(from > 0 && until > from, 'keyboard handler exists');
  let handler, pauses = 0, resets = 0;
  vm.runInNewContext(script.slice(from, until), {
    window: { addEventListener(type, fn) { assert.equal(type, 'keydown'); handler = fn; } },
    toggleBtn: { click() { pauses += 1; } },
    reset() { resets += 1; }
  });
  const target = (editable = false, selectorMatch = false) => ({
    isContentEditable: editable,
    closest() { return selectorMatch ? {} : null; }
  });
  return { handler, target, counts: () => [pauses, resets] };
}

test('space and r do not hijack focused controls', () => {
  const { handler, target, counts } = shortcutFixture();
  let prevented = 0;
  const e = { target: target(false, true), code: 'Space', key: ' ', preventDefault() { prevented += 1; } };
  handler(e);
  e.code = 'KeyR'; e.key = 'r';
  handler(e);
  assert.deepEqual(counts(), [0, 0]);
  assert.equal(prevented, 0);
  e.target = target(true, false);
  handler(e);
  assert.deepEqual(counts(), [0, 0]);
});

test('simulation announces only state changes, not every animation frame', () => {
  assert.ok(/id="simulation-status"[^>]*role="status"[^>]*aria-live="polite"[^>]*>Running<\/p>/.test(html), 'status is announced');
  assert.ok(!/<section class="stats"[^>]*aria-live/.test(html), 'per-frame stats are not live');
  assert.ok(!/id="outputBody"[^>]*aria-live/.test(html), 'per-frame output is not live');
  const from = script.indexOf("toggleBtn.addEventListener('click'");
  const until = script.indexOf("resetBtn.addEventListener('click'", from);
  assert.ok(from > 0 && until > from, 'toggle handler exists');
  const status = { textContent: 'Running' };
  const button = { textContent: 'Pause', style: {}, attributes: {},
    addEventListener(type, fn) { this.handler = fn; },
    setAttribute(name, value) { this.attributes[name] = value; } };
  vm.runInNewContext(script.slice(from, until), {
    toggleBtn: button,
    running: true,
    performance: { now: () => 100 },
    setTimeout: () => {},
    document: { getElementById: () => status }
  });
  button.handler();
  assert.equal(status.textContent, 'Paused');
  assert.equal(button.textContent, 'Resume');
});

test('status spans the controls grid without displacing inputs', () => {
  const css = fs.readFileSync(path.join(__dirname, '../styles.css'), 'utf8');
  assert.ok(/#simulation-status\s*\{[^}]*grid-column:\s*1\s*\/\s*-1;/s.test(css), 'status takes its own grid row');
});

test('body shortcuts still pause and reset', () => {
  const { handler, target, counts } = shortcutFixture();
  const e = { target: target(), code: 'Space', key: ' ', preventDefault() {} };
  handler(e);
  e.code = 'KeyR'; e.key = 'r';
  handler(e);
  assert.deepEqual(counts(), [1, 1]);
  e.repeat = true;
  handler(e);
  assert.deepEqual(counts(), [1, 1]);
});
