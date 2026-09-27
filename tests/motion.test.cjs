const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const script = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

function sliceScript(fromMarker, untilMarker) {
  const from = script.indexOf(fromMarker);
  const until = script.indexOf(untilMarker, from);
  assert.ok(from > 0 && until > from, `slice exists: ${fromMarker}`);
  return script.slice(from, until);
}

function stubContext(reducedMotion, particles) {
  const gradient = { addColorStop() {} };
  const ctx = new Proxy({}, {
    get(target, prop) {
      if (prop === 'createRadialGradient') return () => gradient;
      if (typeof prop === 'symbol') return undefined;
      return target[prop] !== undefined ? target[prop] : () => {};
    },
    set(target, prop, value) { target[prop] = value; return true; }
  });
  return {
    prefersReducedMotion: () => reducedMotion,
    isLightTheme: () => false,
    particles,
    canvas: { getBoundingClientRect: () => ({ width: 800, height: 300 }) },
    ctx,
    getSpeedStrength: () => 0.5,
    clamp: (n, min, max) => Math.max(min, Math.min(max, n)),
    speed: 20,
    MAX_SPEED: 1000,
  };
}

test('no canvas particles spawn when the user prefers reduced motion', () => {
  const code = sliceScript('function spawnParticles', 'function maybeAppendWords');
  const particles = [];
  const sandbox = stubContext(true, particles);
  vm.runInNewContext(`${code}; result = spawnParticles(3);`, sandbox);
  assert.equal(particles.length, 0);
});

test('canvas particles spawn normally when motion is allowed', () => {
  const code = sliceScript('function spawnParticles', 'function maybeAppendWords');
  const particles = [];
  const sandbox = stubContext(false, particles);
  vm.runInNewContext(`${code}; result = spawnParticles(3);`, sandbox);
  assert.equal(particles.length, 3);
});

test('in-flight canvas particles stop when reduced motion is requested mid-session', () => {
  const code = sliceScript('function draw(dt)', '// Input bindings');
  const particles = [{ x: 10, y: 20, size: 3, vx: 100, alpha: 0.2, hue: 190, life: 0, maxLife: 5 }];
  const sandbox = stubContext(true, particles);
  vm.runInNewContext(`${code}; draw(0.016);`, sandbox);
  assert.equal(particles.length, 0);
});
