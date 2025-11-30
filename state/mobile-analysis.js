const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

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

  // Full page screenshot
  await page1.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-full.png', fullPage: true });

  // Above fold only
  await page1.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-above-fold.png' });

  // Check for horizontal scroll issues
  const bodyWidth = await page1.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page1.evaluate(() => window.innerWidth);
  const hasOverflow = bodyWidth > viewportWidth;
  console.log(`iPhone 14 - Body width: ${bodyWidth}px, Viewport: ${viewportWidth}px, Overflow: ${hasOverflow}`);

  // Get element widths that might be causing overflow
  const overflowElements = await page1.evaluate(() => {
    const elements = [];
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth) {
        elements.push({
          tag: el.tagName,
          class: el.className,
          width: rect.width,
          computedWidth: window.getComputedStyle(el).width
        });
      }
    });
    return elements.slice(0, 10); // Top 10 offenders
  });
  console.log('Elements causing overflow:', JSON.stringify(overflowElements, null, 2));

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
  await page2.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-small.png', fullPage: true });

  const bodyWidth2 = await page2.evaluate(() => document.body.scrollWidth);
  const viewportWidth2 = await page2.evaluate(() => window.innerWidth);
  const hasOverflow2 = bodyWidth2 > viewportWidth2;
  console.log(`iPhone SE - Body width: ${bodyWidth2}px, Viewport: ${viewportWidth2}px, Overflow: ${hasOverflow2}`);

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
  await page3.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/mobile-large.png', fullPage: true });

  const bodyWidth3 = await page3.evaluate(() => document.body.scrollWidth);
  const viewportWidth3 = await page3.evaluate(() => window.innerWidth);
  const hasOverflow3 = bodyWidth3 > viewportWidth3;
  console.log(`Large Phone - Body width: ${bodyWidth3}px, Viewport: ${viewportWidth3}px, Overflow: ${hasOverflow3}`);

  await context3.close();

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
