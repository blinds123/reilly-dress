const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== TESTING SECONDARY CTA (PRE-ORDER) ===\n');

  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  console.log('1. Clicking PRE-ORDER button...');
  await page.click('button[onclick*="handleAddToCart(\'secondary\')"]');
  await page.waitForTimeout(500);

  const modalVisible = await page.evaluate(() => {
    const modal = document.getElementById('orderBumpModal');
    return modal && modal.classList.contains('active');
  });
  console.log('✓ Modal visible:', modalVisible);

  if (modalVisible) {
    const modalText = await page.evaluate(() => {
      const acceptBtn = document.getElementById('acceptBtnText');
      const declineBtn = document.getElementById('declineBtnText');
      return {
        accept: acceptBtn ? acceptBtn.textContent : 'NOT FOUND',
        decline: declineBtn ? declineBtn.textContent : 'NOT FOUND'
      };
    });
    console.log('✓ Accept button:', modalText.accept);
    console.log('✓ Decline button:', modalText.decline);

    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/preorder-modal.png' });

    // Test ACCEPT (should be $29)
    console.log('\n2. Testing ACCEPT to add belt ($29 total)...');

    const navigationPromise = page.waitForURL(/simpleswap\.io/, { timeout: 20000 }).catch(() => null);

    await page.click('button[onclick="acceptBump()"]');
    console.log('✓ Accept button clicked');

    const navigated = await navigationPromise;

    if (navigated) {
      await page.waitForTimeout(2000);
      console.log('✓ SUCCESS: Redirected to SimpleSwap');
      console.log('✓ Final URL:', page.url());

      await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/simpleswap-29.png' });
      console.log('✓ SimpleSwap screenshot saved');
    } else {
      console.log('✗ FAILED: Did not redirect to SimpleSwap');
      console.log('✗ Current URL:', page.url());
      await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/accept-failed.png' });
    }
  }

  console.log('\n=== TEST COMPLETE ===');
  await browser.close();
})();
