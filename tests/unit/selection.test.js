'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { createGasEnv, ENUMS } = require('./helpers/gas-env');

describe('selection.js', () => {
  describe('getSelectedElementsOnPage', () => {
    it('returns selected elements for PAGE_ELEMENT and TEXT selections', () => {
      const env = createGasEnv();
      const s1 = env.createShape();
      const s2 = env.createShape();

      env.setSelection({ type: ENUMS.SelectionType.PAGE_ELEMENT, elements: [s1, s2] });
      assert.equal(env.ctx.getSelectedElementsOnPage(false).length, 2);

      env.setSelection({ type: ENUMS.SelectionType.TEXT, elements: [s1] });
      assert.equal(env.ctx.getSelectedElementsOnPage(false).length, 1);
    });

    it('falls back to all page elements on CURRENT_PAGE only when requested', () => {
      const env = createGasEnv();
      env.createShape();
      env.createShape();

      env.setSelection({ type: ENUMS.SelectionType.CURRENT_PAGE });
      assert.equal(env.ctx.getSelectedElementsOnPage(true).length, 2);
      assert.equal(env.ctx.getSelectedElementsOnPage(false).length, 0);
    });

    it('returns empty array for NONE / PAGE / unsupported selection types', () => {
      const env = createGasEnv();
      env.createShape();

      for (const type of [ENUMS.SelectionType.NONE, ENUMS.SelectionType.PAGE, ENUMS.SelectionType.UNSUPPORTED]) {
        env.setSelection({ type });
        assert.deepEqual(Array.from(env.ctx.getSelectedElementsOnPage(true)), []);
      }
    });
  });

  describe('withShapesOrGroupsRecursively', () => {
    it('recursively visits shapes inside nested groups', () => {
      const env = createGasEnv();
      const s1 = env.createShape({ id: 's1', addToPage: false });
      const s2 = env.createShape({ id: 's2', addToPage: false });
      const s3 = env.createShape({ id: 's3', addToPage: false });
      const innerGroup = env.createGroup([s1, s2], { id: 'g_inner', addToPage: false });
      const outerGroup = env.createGroup([innerGroup, s3], { id: 'g_outer' });

      const visited = [];
      env.ctx.withShapesOrGroupsRecursively([outerGroup], (shape) => {
        visited.push(shape.getObjectId());
      });

      assert.deepEqual(visited, ['s3', 's1', 's2']);
    });

    it('skips parent group when a single group and its child shape are both in selection', () => {
      const env = createGasEnv();
      const child1 = env.createShape({ id: 'c1', addToPage: false });
      const child2 = env.createShape({ id: 'c2', addToPage: false });
      const group = env.createGroup([child1, child2], { id: 'g1' });

      const visited = [];
      env.ctx.withShapesOrGroupsRecursively([group, child1], (shape) => {
        visited.push(shape.getObjectId());
      });

      assert.deepEqual(visited, ['c1']);
    });

    it.todo('Phase 3: skips ancestor groups even when multiple groups or top-level shapes are also selected');
  });
});
