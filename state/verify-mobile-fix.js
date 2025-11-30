const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  console.log('Testing mobile fix on live site...\n');

  // Test iPhone 14 (390x844)
  const context1 = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page1 = await context1.newPage();

  await page1.goto('https://reilly-dress.netlify.app');
  await page1.waitForLoadState('networkidle');

  // Capture after fix
  await page1.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-fixed-full.png', fullPage: true });
  await page1.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-fixed-above-fold.png' });

  // Check for horizontal scroll issues
  const bodyWidth = await page1.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page1.evaluate(() => window.innerWidth);
  const hasOverflow = bodyWidth > viewportWidth;

  console.log('=== AFTER FIX - iPhone 14 (390x844) ===');
  console.log(`Body width: ${bodyWidth}px`);
  console.log(`Viewport: ${viewportWidth}px`);
  console.log(`Horizontal overflow: ${hasOverflow ? 'YES ❌' : 'NO ✅'}`);

  if (hasOverflow) {
    console.log(`Overflow amount: ${bodyWidth - viewportWidth}px`);
  }

  // Get element widths
  const elementWidths = await page1.evaluate(() => {
    const elements = [];
    const selectors = ['.container', '.hero', '.gallery', '.main-image', '.product-info', 'h1', '.announcement-bar'];
    selectors.forEach(selector => {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        const computed = window.getComputedStyle(el);
        elements.push({
          selector: selector,
          width: Math.round(rect.width),
          maxWidth: computed.maxWidth,
          overflow: computed.overflowX
        });
      }
    });
    return elements;
  });

  console.log('\n=== Key Element Widths ===');
  elementWidths.forEach(el => {
    const status = el.width <= viewportWidth ? '✅' : '❌';
    console.log(`${status} ${el.selector}: ${el.width}px (max-width: ${el.maxWidth}, overflow: ${el.overflow})`);
  });

  await context1.close();

  // Test iPhone SE (smaller - 375x667)
  const context2 = await browser.newContext({
    viewport: { width: 375, height: 667 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });
  const page2 = await context2.newPage();

  await page2.goto('https://reilly-dress.netlify.app');
  await page2.waitForLoadState('networkidle');
  await page2.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-fixed-small.png', fullPage: true });

  const bodyWidth2 = await page2.evaluate(() => document.body.scrollWidth);
  const viewportWidth2 = await page2.evaluate(() => window.innerWidth);
  const hasOverflow2 = bodyWidth2 > viewportWidth2;

  console.log('\n=== AFTER FIX - iPhone SE (375x667) ===');
  console.log(`Body width: ${bodyWidth2}px`);
  console.log(`Viewport: ${viewportWidth2}px`);
  console.log(`Horizontal overflow: ${hasOverflow2 ? 'YES ❌' : 'NO ✅'}`);

  await context2.close();

  // Test larger phone (414x896)
  const context3 = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  });
  const page3 = await context3.newPage();

  await page3.goto('https://reilly-dress.netlify.app');
  await page3.waitForLoadState('networkidle');
  await page3.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-fixed-large.png', fullPage: true });

  const bodyWidth3 = await page3.evaluate(() => document.body.scrollWidth);
  const viewportWidth3 = await page3.evaluate(() => window.innerWidth);
  const hasOverflow3 = bodyWidth3 > viewportWidth3;

  console.log('\n=== AFTER FIX - Large Phone (414x896) ===');
  console.log(`Body width: ${bodyWidth3}px`);
  console.log(`Viewport: ${viewportWidth3}px`);
  console.log(`Horizontal overflow: ${hasOverflow3 ? 'YES ❌' : 'NO ✅'}`);

  await context3.close();

  await browser.close();

  console.log('\n=== SUMMARY ===');
  console.log('Screenshots captured to /state/ directory');
  console.log('✅ Mobile fix verification complete!');
})();
