const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const devices = [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 12 Pro', width: 390, height: 844 },
    { name: 'Pixel 5', width: 393, height: 851 },
    { name: 'Samsung Galaxy S21', width: 360, height: 800 }
  ];

  const issues = [];

  for (const device of devices) {
    console.log(`\n=== Testing ${device.name} (${device.width}x${device.height}) ===`);

    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    const page = await context.newPage();
    await page.goto('https://reilly-dress.netlify.app');
    await page.waitForLoadState('networkidle');

    // Check for horizontal overflow
    const overflow = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      return {
        bodyWidth: body.scrollWidth,
        htmlWidth: html.scrollWidth,
        viewportWidth: window.innerWidth,
        hasOverflow: body.scrollWidth > window.innerWidth || html.scrollWidth > window.innerWidth
      };
    });

    console.log(`Viewport: ${overflow.viewportWidth}px`);
    console.log(`Body: ${overflow.bodyWidth}px, HTML: ${overflow.htmlWidth}px`);
    console.log(`Overflow: ${overflow.hasOverflow ? 'YES ❌' : 'NO ✓'}`);

    if (overflow.hasOverflow) {
      issues.push(`${device.name}: Horizontal overflow detected`);
    }

    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, a, .thumbnail, .size-btn');
      const tooSmall = [];

      buttons.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        // Minimum recommended touch target is 44x44px
        if ((width < 44 || height < 44) && width > 0 && height > 0) {
          tooSmall.push({
            element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
            width: Math.round(width),
            height: Math.round(height)
          });
        }
      });

      return tooSmall;
    });

    console.log(`Touch targets smaller than 44px: ${touchTargets.length}`);
    if (touchTargets.length > 0) {
      console.log('Small targets:', touchTargets.slice(0, 5));
      issues.push(`${device.name}: ${touchTargets.length} touch targets too small`);
    }

    // Check font sizes
    const fontSizes = await page.evaluate(() => {
      const textElements = document.querySelectorAll('p, span, div, button, a, li');
      const tooSmall = [];

      textElements.forEach(el => {
        const fontSize = parseFloat(window.getComputedStyle(el).fontSize);
        const text = el.textContent.trim();

        // Minimum recommended is 16px for body text
        if (fontSize < 14 && text.length > 0 && el.offsetParent !== null) {
          tooSmall.push({
            tag: el.tagName,
            fontSize: fontSize,
            text: text.substring(0, 30)
          });
        }
      });

      return tooSmall.slice(0, 10);
    });

    console.log(`Text smaller than 14px: ${fontSizes.length} elements`);
    if (fontSizes.length > 3) {
      issues.push(`${device.name}: Many text elements too small (${fontSizes.length})`);
    }

    // Check images
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img');
      const problems = [];

      imgs.forEach((img, i) => {
        const rect = img.getBoundingClientRect();
        if (rect.width > window.innerWidth) {
          problems.push({
            src: img.src.substring(img.src.lastIndexOf('/') + 1),
            width: Math.round(rect.width),
            viewport: window.innerWidth
          });
        }
      });

      return problems;
    });

    console.log(`Images exceeding viewport: ${images.length}`);
    if (images.length > 0) {
      console.log('Oversized images:', images);
      issues.push(`${device.name}: ${images.length} images too wide`);
    }

    // Take screenshot
    await page.screenshot({
      path: `state/audit-${device.name.toLowerCase().replace(/ /g, '-')}.png`,
      fullPage: true
    });

    await context.close();
  }

  await browser.close();

  console.log('\n\n=== AUDIT SUMMARY ===');
  if (issues.length === 0) {
    console.log('✓ All checks passed! Mobile site is properly formatted.');
  } else {
    console.log('Issues found:');
    issues.forEach(issue => console.log('- ' + issue));
  }
})();
