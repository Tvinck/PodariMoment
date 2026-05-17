#!/usr/bin/env node
// Минимальный build для Vercel: собираем статику из Des/ui_kits/website
// + копируем дизайн-референсы (preview, assets, colors_and_type.css) рядом,
// чтобы пути /des-preview/*, /des-assets/*, /colors_and_type.css из serve.py
// продолжали работать в проде.

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE = path.join(ROOT, 'Des', 'ui_kits', 'website');
const DES  = path.join(ROOT, 'Des');
const OUT  = path.join(ROOT, 'dist');

const SKIP = new Set(['serve.py', '.DS_Store']);

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}
function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    if (SKIP.has(name)) continue;
    const s = path.join(src, name);
    const d = path.join(dst, name);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

console.log('→ Cleaning', OUT);
rmrf(OUT);
fs.mkdirSync(OUT, { recursive: true });

console.log('→ Copy site root  Des/ui_kits/website → dist/');
copyDir(SITE, OUT);

console.log('→ Copy design refs Des/preview → dist/des-preview/');
copyDir(path.join(DES, 'preview'), path.join(OUT, 'des-preview'));

console.log('→ Copy design assets Des/assets → dist/des-assets/');
copyDir(path.join(DES, 'assets'), path.join(OUT, 'des-assets'));

console.log('→ Copy tokens Des/colors_and_type.css → dist/colors_and_type.css');
const tokens = path.join(DES, 'colors_and_type.css');
if (fs.existsSync(tokens)) fs.copyFileSync(tokens, path.join(OUT, 'colors_and_type.css'));

console.log('✓ Build done. Output:', OUT);
