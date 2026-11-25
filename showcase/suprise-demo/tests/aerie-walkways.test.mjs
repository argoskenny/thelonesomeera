import {test} from 'node:test';
import assert from 'node:assert/strict';
import {railSpans} from '../src/scenes/aerie/walkways.ts';

test('the central cross-bridge leaves a nine-metre opening for the intersecting promenade',()=>{
  const spans=railSpans(80,[[-4.5,4.5]]);
  assert.deepEqual(spans,[[-40,-4.5],[4.5,40]]);
  for(const x of[-3.9,0,3.9])assert.equal(spans.some(([a,b])=>x>=a&&x<=b),false);
});
test('overlapping openings cannot restore an invisible collision barrier',()=>{
  assert.deepEqual(railSpans(20,[[2,7],[-3,4],[-20,-8]]),[[-8,-3],[7,10]]);
});
test('a full-width opening has no rail; an ordinary edge remains continuous',()=>{
  assert.deepEqual(railSpans(10,[[-8,8]]),[]);
  assert.deepEqual(railSpans(10),[[-5,5]]);
});
