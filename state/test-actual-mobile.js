const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Use actual iPhone 13 Pro preset
  const iPhone13Pro = devices['iPhone 13 Pro'];
  const context = await browser.newContext({
    ...iPhone13Pro
  });

  const page = await context.newPage();

  console.log('Testing with iPhone 13 Pro preset (actual device settings)...\n');

  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  const metrics = await page.evaluate(() => {
    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      body: {
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.body.clientWidth,
        offsetWidth: document.body.offsetWidth
      },
      hasHorizontalScroll: document.body.scrollWidth > window.innerWidth,
      overflowingElements: Array.from(document.querySelectorAll('*'))
        .filter(el => el.scrollWidth > window.innerWidth)
        .slice(0, 10)
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          scrollWidth: el.scrollWidth,
          offsetWidth: el.offsetWidth
        }))
    };
  });

  console.log('=== iPhone 13 Pro Real Device Metrics ===');
  console.log(`Viewport: ${metrics.viewport.width}x${metrics.viewport.height}`);
  console.log(`DPR: ${metrics.viewport.devicePixelRatio}`);
  console.log(`Body scroll width: ${metrics.body.scrollWidth}px`);
  console.log(`Body client width: ${metrics.body.clientWidth}px`);
  console.log(`Has horizontal scroll: ${metrics.hasHorizontalScroll ? 'YES ❌' : 'NO ✅'}`);

  if (metrics.hasHorizontalScroll) {
    console.log(`\nOverflow amount: ${metrics.body.scrollWidth - metrics.viewport.width}px`);
    console.log('\nElements causing overflow:');
    metrics.overflowingElements.forEach(el => {
      console.log(`  - ${el.tag}.${el.className}: ${el.scrollWidth}px`);
    });
  }

  await page.screenshot({
    path: '/Users/nelsonchan/Downloads/Reilly Dress/state/iphone13pro-real.png',
    fullPage: true
  });

  await browser.close();

  console.log('\n✅ Screenshot saved to state/iphone13pro-real.png');
})();
