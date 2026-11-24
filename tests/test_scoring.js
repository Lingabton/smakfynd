#!/usr/bin/env node
/**
 * Tests for scoring logic — run with: node tests/test_scoring.js
 * No dependencies required.
 */

// ── Import scoring functions by eval ──
const fs = require('fs');
const utils = fs.readFileSync(__dirname + '/../src/utils.jsx', 'utf8');
const theme = fs.readFileSync(__dirname + '/../src/theme.jsx', 'utf8');

// Strip JSX-specific stuff for Node eval
const code = (theme + '\n' + utils).replace(/\/\/ src\/\w+\.jsx\n/g, '');
eval(code);

let passed = 0;
let failed = 0;

function assert(name, actual, expected) {
  if (actual === expected) {
    passed++;
  } else {
    console.error(`  FAIL: ${name} — got ${actual}, expected ${expected}`);
    failed++;
  }
}

function assertRange(name, actual, min, max) {
  if (actual >= min && actual <= max) {
    passed++;
  } else {
    console.error(`  FAIL: ${name} — got ${actual}, expected ${min}-${max}`);
    failed++;
  }
}

// ── rescale tests ──
console.log("rescale():");
assert("raw 16 → 90+", rescale(16), 90);
assert("raw 14 → 75", rescale(14), 75);
assert("raw 12 → 60", rescale(12), 60);
assert("raw 10 → 42", rescale(10), 42);
assert("raw 8 → 22", rescale(8), 22);
assert("raw 0 → 1 (floor)", rescale(0), 1);
assertRange("raw 18 → 90-99", rescale(18), 90, 99);
assertRange("raw 15 → 75-89", rescale(15), 75, 89);
assertRange("raw 6 → 1-21", rescale(6), 1, 21);

// ── getScoreInfo tests ──
console.log("getScoreInfo():");
// Bands per src/utils.jsx (S1-4, Sep 2026):
// 85+ Exceptionellt fynd | 75-84 Toppköp | 65-74 Starkt fynd | 50-64 Okej värde | <50 no badge
assert("score 95 → Exceptionellt fynd", getScoreInfo(95)[0], "Exceptionellt fynd");
assert("score 85 → Exceptionellt fynd", getScoreInfo(85)[0], "Exceptionellt fynd");
assert("score 84 → Toppköp", getScoreInfo(84)[0], "Toppköp");
assert("score 75 → Toppköp", getScoreInfo(75)[0], "Toppköp");
assert("score 65 → Starkt fynd", getScoreInfo(65)[0], "Starkt fynd");
assert("score 55 → Okej värde", getScoreInfo(55)[0], "Okej värde");
assert("score 50 → Okej värde", getScoreInfo(50)[0], "Okej värde");
assert("score 40 → no badge", getScoreInfo(40)[0], "");

// ── Summary ──
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
