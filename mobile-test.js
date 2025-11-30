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
  
  console.log('Loading https://reilly-dress.netlify.app...');
  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');
  
  // Create state directory if it doesn't exist
  const fs = require('fs');
  if (!fs.existsSync('state')) {
    fs.mkdirSync('state');
  }
  
  // Screenshots
  console.log('Taking mobile screenshots...');
  await page.screenshot({ path: 'state/mobile-full.png', fullPage: true });
  await page.screenshot({ path: 'state/mobile-above-fold.png' });
  
  // Check overflow
  const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
  const viewportWidth = await page.evaluate(() => window.innerWidth);
  console.log('Body:', bodyWidth, 'Viewport:', viewportWidth, 'Overflow:', bodyWidth > viewportWidth);
  
  // iPhone SE (smaller screen)
  console.log('Testing iPhone SE size...');
  await page.setViewportSize({ width: 375, height: 667 });
  await page.screenshot({ path: 'state/mobile-small.png', fullPage: true });
  
  // Get computed styles of key elements
  const diagnostics = await page.evaluate(() => {
    const issues = [];
    
    // Check for horizontal overflow
    const body = document.body;
    if (body.scrollWidth > window.innerWidth) {
      issues.push(`Body overflow: ${body.scrollWidth}px > ${window.innerWidth}px`);
    }
    
    // Check all images
    const images = document.querySelectorAll('img');
    images.forEach((img, i) => {
      const rect = img.getBoundingClientRect();
      if (rect.width > window.innerWidth) {
        issues.push(`Image ${i}: ${rect.width}px wide (viewport: ${window.innerWidth}px)`);
      }
    });
    
    // Check containers
    const containers = document.querySelectorAll('div, section');
    containers.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (rect.width > window.innerWidth) {
        const id = el.id || el.className || `element-${i}`;
        issues.push(`Container ${id}: ${rect.width}px wide`);
      }
    });
    
    return issues;
  });
  
  console.log('\n=== DIAGNOSTIC ISSUES ===');
  diagnostics.forEach(issue => console.log('- ' + issue));
  
  await browser.close();
  console.log('\nScreenshots saved to state/ directory');
})();
