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
  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Scroll to size selector to show the improved touch targets
  await page.evaluate(() => {
    const sizeSection = document.querySelector('.size-selector');
    if (sizeSection) {
      sizeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  
  await page.waitForTimeout(1000);
  
  // Take focused screenshot of size buttons
  const sizeSelector = await page.locator('.size-selector');
  await sizeSelector.screenshot({ path: 'state/size-buttons-after.png' });
  
  // Scroll to testimonials to show improved text
  await page.evaluate(() => {
    const testimonials = document.querySelector('.testimonials-section');
    if (testimonials) {
      testimonials.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
  
  await page.waitForTimeout(1000);
  
  const testimonialsSection = await page.locator('.testimonials-section').first();
  await testimonialsSection.screenshot({ path: 'state/testimonials-after.png' });
  
  console.log('✓ Comparison screenshots saved');
  console.log('  - state/size-buttons-after.png');
  console.log('  - state/testimonials-after.png');
  
  await browser.close();
})();
