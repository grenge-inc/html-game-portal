// 新しいゲームを追加したらリポジトリ直下で: node tools/generate_thumbs.js
// 必要: npm i playwright && npx playwright install chromium
// games/*.html を撮影し thumbs/gNN.webp を生成、index.html の GAMES 配列に thumb 名を追記してください
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const GAMES_DIR = path.join(__dirname, '..', 'games');
const OUT_DIR = path.join(__dirname, '..', 'thumbs');
fs.mkdirSync(OUT_DIR, { recursive: true });
const skip = new Set(['_test_verify.html', 'test.html']);
const files = fs.readdirSync(GAMES_DIR).filter(f => f.endsWith('.html') && !skip.has(f)).sort();
(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  let i = 0;
  for (const f of files) {
    i++;
    const ctx = await browser.newContext({ viewport: { width: 390, height: 620 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    try {
      await page.goto('file://' + path.join(GAMES_DIR, f), { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1200);
      try { await page.touchscreen.tap(195, 380); } catch (e) {}
      await page.waitForTimeout(1800);
      const png = await page.screenshot();
      // sharp があれば webp 圧縮、なければ png のまま保存
      const out = path.join(OUT_DIR, `g${String(i).padStart(2, '0')}`);
      try {
        const sharp = require('sharp');
        await sharp(png).resize(300).webp({ quality: 82 }).toFile(out + '.webp');
      } catch (e) { fs.writeFileSync(out + '.png', png); }
      console.log('OK', i, f);
    } catch (e) { console.log('FAIL', f, String(e).slice(0, 80)); }
    await ctx.close();
  }
  await browser.close();
})();
