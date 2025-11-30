const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });

  console.log('=== MOBILE VERIFICATION ===');
  // Test Mobile
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto('https://reilly-dress.netlify.app');
  await mobilePage.waitForLoadState('networkidle');

  // Verify no horizontal scroll
  const overflow = await mobilePage.evaluate(() => document.body.scrollWidth > window.innerWidth);
  console.log('Mobile overflow:', overflow ? 'YES (FAILED)' : 'NO (PASSED)');

  // Check viewport width
  const bodyWidth = await mobilePage.evaluate(() => document.body.scrollWidth);
  const windowWidth = await mobilePage.evaluate(() => window.innerWidth);
  console.log(`Body width: ${bodyWidth}px, Window width: ${windowWidth}px`);

  // Screenshot verification
  await mobilePage.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/verify-mobile.png', fullPage: true });
  console.log('Mobile screenshot saved');

  await mobile.close();

  console.log('\n=== DESKTOP VERIFICATION ===');
  // Test Desktop
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktop.newPage();
  await desktopPage.goto('https://reilly-dress.netlify.app');
  await desktopPage.waitForLoadState('networkidle');

  const desktopTitle = await desktopPage.title();
  console.log('Page title:', desktopTitle);

  await desktopPage.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/verify-desktop.png', fullPage: true });
  console.log('Desktop screenshot saved');

  await browser.close();
  console.log('\nVisual verification complete!');
})();
