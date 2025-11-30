const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== FUNCTIONAL E2E TEST ===\n');

  // 1. Load page
  console.log('1. Loading page...');
  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  console.log('✓ Page loaded. Title:', title);

  // 2. Test size selector
  console.log('\n2. Testing size selector...');
  try {
    await page.waitForSelector('button[data-size="M"]', { timeout: 5000 });
    await page.click('button[data-size="M"]');
    await page.waitForTimeout(500);

    const sizeSelected = await page.evaluate(() => {
      return window.selectedSize || document.querySelector('button[data-size="M"].selected') !== null;
    });
    console.log('✓ Size M selected:', sizeSelected);
  } catch (e) {
    console.log('✗ Size selector error:', e.message);
  }

  // 3. Test Primary CTA
  console.log('\n3. Testing Primary CTA...');
  try {
    const ctaSelector = 'button.primary-cta, #primaryCTA, button:has-text("GET MINE NOW")';
    await page.waitForSelector(ctaSelector, { timeout: 5000 });

    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/before-click.png' });

    await page.click(ctaSelector);
    await page.waitForTimeout(1000);

    console.log('✓ Primary CTA clicked');
  } catch (e) {
    console.log('✗ Primary CTA error:', e.message);
  }

  // 4. Check popup
  console.log('\n4. Checking popup...');
  try {
    const popupVisible = await page.isVisible('#orderBumpPopup, .order-bump-popup, [class*="popup"]');
    console.log('✓ Popup visible:', popupVisible);

    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/verify-popup.png' });
    console.log('✓ Popup screenshot saved');
  } catch (e) {
    console.log('✗ Popup check error:', e.message);
  }

  // 5. Test decline button
  console.log('\n5. Testing decline button...');
  try {
    const declineSelector = 'button:has-text("No thanks"), button:has-text("no thanks"), .decline-btn';
    await page.click(declineSelector);
    console.log('✓ Decline button clicked');
  } catch (e) {
    console.log('✗ Decline button error:', e.message);
  }

  // 6. Wait for SimpleSwap redirect
  console.log('\n6. Waiting for SimpleSwap redirect...');
  try {
    await page.waitForURL(/simpleswap\.io/, { timeout: 15000 });
    console.log('✓ SUCCESS: Redirected to SimpleSwap');
    console.log('✓ Final URL:', page.url());

    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/verify-simpleswap.png' });
    console.log('✓ SimpleSwap screenshot saved');
  } catch (e) {
    console.log('✗ FAILED: Did not redirect to SimpleSwap');
    console.log('✗ Current URL:', page.url());
    console.log('✗ Error:', e.message);

    // Check console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    if (errors.length) {
      console.log('✗ Console errors:', errors);
    }
  }

  console.log('\n=== FUNCTIONAL TEST COMPLETE ===');
  await browser.close();
})();
