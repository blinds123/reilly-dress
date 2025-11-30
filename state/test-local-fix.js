const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Use actual iPhone 13 Pro preset
  const iPhone13Pro = devices['iPhone 13 Pro'];
  const context = await browser.newContext({
    ...iPhone13Pro
  });

  const page = await context.newPage();

  console.log('Testing LOCAL version with fixed CSS...\n');

  await page.goto('http://localhost:8765/index.html');
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
      hero: {
        scrollWidth: document.querySelector('.hero')?.scrollWidth,
        offsetWidth: document.querySelector('.hero')?.offsetWidth,
        gridTemplateColumns: window.getComputedStyle(document.querySelector('.hero')).gridTemplateColumns
      },
      gallery: {
        scrollWidth: document.querySelector('.gallery')?.scrollWidth,
        offsetWidth: document.querySelector('.gallery')?.offsetWidth,
        computedWidth: window.getComputedStyle(document.querySelector('.gallery')).width,
        computedMinWidth: window.getComputedStyle(document.querySelector('.gallery')).minWidth
      },
      mainImage: {
        naturalWidth: document.querySelector('.main-image')?.naturalWidth,
        naturalHeight: document.querySelector('.main-image')?.naturalHeight,
        offsetWidth: document.querySelector('.main-image')?.offsetWidth,
        offsetHeight: document.querySelector('.main-image')?.offsetHeight,
        computedWidth: window.getComputedStyle(document.querySelector('.main-image')).width,
        computedMaxWidth: window.getComputedStyle(document.querySelector('.main-image')).maxWidth
      }
    };
  });

  console.log('=== LOCAL VERSION - iPhone 13 Pro ===');
  console.log(`Viewport: ${metrics.viewport.width}x${metrics.viewport.height} (DPR: ${metrics.viewport.devicePixelRatio})`);
  console.log(`Body scroll width: ${metrics.body.scrollWidth}px`);
  console.log(`Body client width: ${metrics.body.clientWidth}px`);
  console.log(`Has horizontal scroll: ${metrics.hasHorizontalScroll ? 'YES ❌' : 'NO ✅'}`);

  if (!metrics.hasHorizontalScroll) {
    console.log('\n🎉 SUCCESS! No horizontal scroll detected!');
  } else {
    console.log(`\n❌ STILL BROKEN - Overflow: ${metrics.body.scrollWidth - metrics.body.clientWidth}px`);
  }

  console.log('\n=== Grid Analysis ===');
  console.log(`Hero grid-template-columns: ${metrics.hero.gridTemplateColumns}`);
  console.log(`Hero scroll width: ${metrics.hero.scrollWidth}px`);
  console.log(`Gallery scroll width: ${metrics.gallery.scrollWidth}px`);
  console.log(`Gallery offset width: ${metrics.gallery.offsetWidth}px`);
  console.log(`Gallery computed width: ${metrics.gallery.computedWidth}`);
  console.log(`Gallery min-width: ${metrics.gallery.computedMinWidth}`);

  console.log('\n=== Image Analysis ===');
  console.log(`Main image natural size: ${metrics.mainImage.naturalWidth}x${metrics.mainImage.naturalHeight}px`);
  console.log(`Main image rendered size: ${metrics.mainImage.offsetWidth}x${metrics.mainImage.offsetHeight}px`);
  console.log(`Main image computed width: ${metrics.mainImage.computedWidth}`);
  console.log(`Main image max-width: ${metrics.mainImage.computedMaxWidth}`);

  await page.screenshot({
    path: '/Users/nelsonchan/Downloads/Reilly Dress/state/local-fixed-version.png',
    fullPage: true
  });

  await browser.close();

  console.log('\n✅ Screenshot saved to state/local-fixed-version.png');
})();
