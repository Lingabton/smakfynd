#!/usr/bin/env node
/**
 * Basic build validation tests — verifies the output is correct.
 * Run: node tests/test_build.js
 */

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function assert(name, condition) {
  if (condition) { passed++; }
  else { console.error(`  FAIL: ${name}`); failed++; }
}

const DOCS = path.join(__dirname, '..', 'docs');

// index.html exists and has content
const html = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
assert("index.html exists", html.length > 1000);
assert("has React", html.includes('react.production'));
assert("no Babel runtime", !html.includes('babel-standalone'));
assert("has service worker registration", html.includes('serviceWorker'));
assert("has manifest link", html.includes('manifest.json'));
assert("has privacy link", html.includes('/integritet/'));
assert("has CSS variables", html.includes(':root'));
assert("has noscript fallback", html.includes('<noscript>'));
assert("has JSON-LD", html.includes('application/ld+json'));
assert("has FAQPage schema", html.includes('FAQPage'));

// wines.json exists and has valid data
const wines = JSON.parse(fs.readFileSync(path.join(DOCS, 'wines.json'), 'utf8'));
assert("wines.json has 100+ wines", wines.length >= 100);
assert("no wines with empty name", wines.every(w => w.name && w.name.length >= 1));
assert("no wines with zero score", wines.every(w => w.smakfynd_score > 0));
assert("no trailing dashes in names", wines.every(w => !w.name.endsWith('—') && !w.name.endsWith('-')));

// Landing pages exist
const landingPages = ['basta-roda-vin', 'vin-under-100-kr', 'ekologiskt-vin'];
for (const page of landingPages) {
  const exists = fs.existsSync(path.join(DOCS, page, 'index.html'));
  assert(`landing page ${page}/ exists`, exists);
}

// Privacy policy exists
assert("privacy policy exists", fs.existsSync(path.join(DOCS, 'integritet', 'index.html')));

// Sitemap has multiple URLs
const sitemap = fs.readFileSync(path.join(DOCS, 'sitemap.xml'), 'utf8');
const urlCount = (sitemap.match(/<url>/g) || []).length;
assert(`sitemap has ${urlCount} URLs (>5)`, urlCount > 5);

// manifest.json valid
const manifest = JSON.parse(fs.readFileSync(path.join(DOCS, 'manifest.json'), 'utf8'));
assert("manifest has name", manifest.name === "Smakfynd");

// sw.js exists
assert("service worker exists", fs.existsSync(path.join(DOCS, 'sw.js')));

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
