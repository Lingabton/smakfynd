#!/usr/bin/env node
/**
 * Validate wines.json schema — run with: node tests/test_data.js
 * No dependencies required.
 */

const fs = require('fs');
const path = require('path');

const WINES_PATH = path.join(__dirname, '..', 'docs', 'wines.json');

let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) {
    passed++;
  } else {
    console.error(`  FAIL: ${name}`);
    failed++;
  }
}

// ── Load data ──
console.log("wines.json schema:");

if (!fs.existsSync(WINES_PATH)) {
  console.error("  FAIL: wines.json does not exist");
  process.exit(1);
}

const wines = JSON.parse(fs.readFileSync(WINES_PATH, 'utf8'));

assert("is array", Array.isArray(wines));
assert("has 100+ wines", wines.length >= 100);

// ── Required fields ──
const required = ['nr', 'name', 'smakfynd_score', 'price', 'type'];
for (const field of required) {
  const missing = wines.filter(w => !(field in w));
  assert(`all wines have '${field}'`, missing.length === 0);
}

// ── Score ranges ──
const badScores = wines.filter(w => w.smakfynd_score < 1 || w.smakfynd_score > 99);
assert("all scores in 1-99 range", badScores.length === 0);

// ── Price sanity ──
const badPrices = wines.filter(w => w.price && (w.price < 10 || w.price > 50000));
assert("no extreme prices", badPrices.length === 0);

// ── Types ──
const validTypes = new Set(['Rött', 'Vitt', 'Rosé', 'Mousserande']);
const badTypes = wines.filter(w => !validTypes.has(w.type));
assert("all wines have valid type", badTypes.length === 0);

// ── Coverage ──
const withImages = wines.filter(w => w.image_url).length;
const withCrowd = wines.filter(w => w.crowd_score).length;
assert(`image coverage >50% (${withImages}/${wines.length})`, withImages > wines.length * 0.5);
assert(`crowd coverage >80% (${withCrowd}/${wines.length})`, withCrowd > wines.length * 0.8);

// ── No unknown fields ──
const known = new Set([
  'nr', 'name', 'sub', 'price', 'vol', 'type', 'pkg', 'country', 'grape',
  'smakfynd_score', 'crowd_score', 'crowd_reviews', 'expert_score',
  'price_score', 'confidence', 'assortment', 'image_url',
  'organic', 'cat3', 'food_pairings', 'taste_body', 'taste_sweet',
  'taste_fruit', 'taste_bitter', 'style', 'region', 'expert_source',
  'launch_price', 'price_vs_launch_pct', 'is_new',
  'critics', 'num_critics', 'critic_spread', 'critic_consensus',
]);
const unknownFields = new Set();
wines.forEach(w => Object.keys(w).forEach(k => { if (!known.has(k)) unknownFields.add(k); }));
assert("no unknown fields", unknownFields.size === 0);
if (unknownFields.size > 0) console.log("  Unknown:", [...unknownFields]);

// ── Summary ──
console.log(`\n${wines.length} wines validated`);
console.log(`${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
