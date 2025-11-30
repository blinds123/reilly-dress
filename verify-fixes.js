const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  console.log('Testing live site: https://reilly-dress.netlify.app\n');
  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  // Wait a bit for deployment to propagate
  await page.waitForTimeout(2000);

  // Check touch targets
  const touchTargets = await page.evaluate(() => {
    const sizeBtns = document.querySelectorAll('.size-btn');
    const results = [];

    sizeBtns.forEach((btn, i) => {
      const rect = btn.getBoundingClientRect();
      results.push({
        index: i,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        passes: rect.height >= 44
      });
    });

    return results;
  });

  console.log('=== SIZE BUTTON TOUCH TARGETS ===');
  touchTargets.forEach(target => {
    const status = target.passes ? '✓' : '❌';
    console.log(`${status} Button ${target.index}: ${target.width}x${target.height}px`);
  });

  const allPass = touchTargets.every(t => t.passes);
  console.log(`\nTouch target test: ${allPass ? 'PASS ✓' : 'FAIL ❌'}`);

  // Check font sizes
  const fontSizes = await page.evaluate(() => {
    const checks = [
      { selector: '.testimonial-meta', name: 'Testimonial metadata' },
      { selector: '.stars', name: 'Star ratings' },
      { selector: '.option-time', name: 'Shipping time' }
    ];

    return checks.map(check => {
      const el = document.querySelector(check.selector);
      if (!el) return { name: check.name, fontSize: 0, passes: false };

      const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
      return {
        name: check.name,
        fontSize: Math.round(fontSize),
        passes: fontSize >= 14
      };
    });
  });

  console.log('\n=== FONT SIZE CHECKS ===');
  fontSizes.forEach(check => {
    const status = check.passes ? '✓' : '❌';
    console.log(`${status} ${check.name}: ${check.fontSize}px`);
  });

  const allFontsPass = fontSizes.every(f => f.passes);
  console.log(`\nFont size test: ${allFontsPass ? 'PASS ✓' : 'FAIL ❌'}`);

  // Overall overflow check
  const overflow = await page.evaluate(() => {
    return {
      bodyWidth: document.body.scrollWidth,
      viewportWidth: window.innerWidth,
      hasOverflow: document.body.scrollWidth > window.innerWidth
    };
  });

  console.log('\n=== HORIZONTAL OVERFLOW ===');
  console.log(`Viewport: ${overflow.viewportWidth}px`);
  console.log(`Body width: ${overflow.bodyWidth}px`);
  console.log(`Overflow test: ${overflow.hasOverflow ? 'FAIL ❌' : 'PASS ✓'}`);

  // Take screenshots
  await page.screenshot({ path: 'state/verified-mobile-above-fold.png' });
  await page.screenshot({ path: 'state/verified-mobile-full.png', fullPage: true });

  console.log('\n=== FINAL RESULT ===');
  if (allPass && allFontsPass && !overflow.hasOverflow) {
    console.log('✓ ALL TESTS PASSED - Mobile site is properly formatted!');
  } else {
    console.log('❌ Some tests failed - additional fixes needed');
  }

  await browser.close();
})();
