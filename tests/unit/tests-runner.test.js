'use strict';

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv } = require('./helpers/gas-env');

function loadIntegrationTestFile(env) {
  const filePath = path.resolve(__dirname, '../../src/tests/tests.js');
  const code = fs.readFileSync(filePath, 'utf8');
  vm.runInContext(code, env.ctx, { filename: filePath });
}

describe('src/tests/tests.js (integration test harness)', () => {
  it('createTapRunner records passes, failures, and uncaught exceptions', () => {
    const env = createGasEnv();
    loadIntegrationTestFile(env);

    const test = env.ctx.createTapRunner();
    test('passing suite', (t) => {
      t.ok(true, 'truthy');
      t.equal(2 + 2, 4, 'math');
      t.approxEqual(1.0001, 1.0, 0.001, 'approx');
    });
    test('failing suite', (t) => {
      t.equal(1, 2, 'mismatch');
    });
    test('throwing suite', () => {
      throw new Error('boom');
    });

    const summary = test.finish();
    assert.equal(summary.total, 5);
    assert.equal(summary.passed, 3);
    assert.equal(summary.failed, 2);
    assert.match(summary.output, /^TAP version 13/);
    assert.match(summary.output, /# pass  3/);
    assert.match(summary.output, /# fail  2/);
    assert.equal(env.logs.length, 1);
  });

  it('withTestSlide always removes the temporary slide even when testFn throws', () => {
    const env = createGasEnv();
    loadIntegrationTestFile(env);

    let removed = false;
    const fakeDoc = {
      appendSlide: () => ({
        remove: () => { removed = true; },
      }),
    };

    assert.throws(() => {
      env.ctx.withTestSlide(fakeDoc, () => {
        throw new Error('assertion blew up');
      });
    }, /assertion blew up/);

    assert.equal(removed, true);
  });

  it('getTestSlidesDocument falls back to SlidesApp.getActivePresentation()', () => {
    const env = createGasEnv();
    loadIntegrationTestFile(env);

    const doc = env.ctx.getTestSlidesDocument();
    assert.equal(doc, env.SlidesApp.getActivePresentation());
  });
});
