const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();

  // Test WITHOUT deviceScaleFactor
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  const debug = await page.evaluate(() => {
    return {
      windowInnerWidth: window.innerWidth,
      windowOuterWidth: window.outerWidth,
      documentWidth: document.documentElement.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
      bodyOffsetWidth: document.body.offsetWidth,
      viewportMeta: document.querySelector('meta[name="viewport"]')?.content,
      devicePixelRatio: window.devicePixelRatio,

      gallery: {
        offsetWidth: document.querySelector('.gallery')?.offsetWidth,
        scrollWidth: document.querySelector('.gallery')?.scrollWidth,
        clientWidth: document.querySelector('.gallery')?.clientWidth,
        computedWidth: window.getComputedStyle(document.querySelector('.gallery')).width,
        computedMaxWidth: window.getComputedStyle(document.querySelector('.gallery')).maxWidth,
        computedMinWidth: window.getComputedStyle(document.querySelector('.gallery')).minWidth
      },

      hero: {
        offsetWidth: document.querySelector('.hero')?.offsetWidth,
        scrollWidth: document.querySelector('.hero')?.scrollWidth,
        gridTemplateColumns: window.getComputedStyle(document.querySelector('.hero')).gridTemplateColumns
      },

      container: {
        offsetWidth: document.querySelector('.container')?.offsetWidth,
        scrollWidth: document.querySelector('.container')?.scrollWidth,
        computedMaxWidth: window.getComputedStyle(document.querySelector('.container')).maxWidth
      }
    };
  });

  console.log('=== VIEWPORT DEBUG (NO deviceScaleFactor) ===');
  console.log(JSON.stringify(debug, null, 2));

  await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/debug-no-scale.png' });

  await context.close();
  await browser.close();
})();
