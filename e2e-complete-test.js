const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('=== COMPLETE E2E VERIFICATION ===\n');

  // 1. Load page
  console.log('1. Loading page...');
  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  console.log('✓ Page loaded. Title:', title);

  // 2. Verify all critical elements
  console.log('\n2. Verifying critical elements...');
  const elementsCheck = await page.evaluate(() => {
    return {
      primaryCTA: !!document.querySelector('button[onclick*="handleAddToCart(\'primary\')"]'),
      secondaryCTA: !!document.querySelector('button[onclick*="handleAddToCart(\'secondary\')"]'),
      modal: !!document.getElementById('orderBumpModal'),
      sizeButtons: document.querySelectorAll('button[data-size]').length
    };
  });

  console.log('✓ Primary CTA exists:', elementsCheck.primaryCTA);
  console.log('✓ Secondary CTA exists:', elementsCheck.secondaryCTA);
  console.log('✓ Modal exists:', elementsCheck.modal);
  console.log('✓ Size buttons count:', elementsCheck.sizeButtons);

  // 3. Test size selector
  console.log('\n3. Testing size selector...');
  await page.click('button[data-size="M"]');
  await page.waitForTimeout(300);

  const sizeSelected = await page.evaluate(() => {
    return document.querySelector('button[data-size="M"]').classList.contains('active');
  });
  console.log('✓ Size M selected:', sizeSelected);

  // 4. Screenshot before clicking CTA
  await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/before-cta-click.png' });

  // 5. Click Primary CTA
  console.log('\n4. Testing Primary CTA click...');
  await page.click('button[onclick*="handleAddToCart(\'primary\')"]');
  await page.waitForTimeout(500);

  // 6. Check modal visibility
  const modalVisible = await page.evaluate(() => {
    const modal = document.getElementById('orderBumpModal');
    return modal && modal.classList.contains('active');
  });
  console.log('✓ Modal visible:', modalVisible);

  if (modalVisible) {
    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/modal-visible.png' });
    console.log('✓ Modal screenshot saved');

    // 7. Get modal text
    const modalText = await page.evaluate(() => {
      const acceptBtn = document.getElementById('acceptBtnText');
      const declineBtn = document.getElementById('declineBtnText');
      return {
        accept: acceptBtn ? acceptBtn.textContent : 'NOT FOUND',
        decline: declineBtn ? declineBtn.textContent : 'NOT FOUND'
      };
    });
    console.log('✓ Accept button text:', modalText.accept);
    console.log('✓ Decline button text:', modalText.decline);

    // 8. Click decline button
    console.log('\n5. Testing decline to proceed to checkout...');

    // Set up listener for navigation
    const navigationPromise = page.waitForURL(/simpleswap\.io/, { timeout: 20000 }).catch(() => null);

    await page.click('button[onclick="declineBump()"]');
    console.log('✓ Decline button clicked');

    // Wait for navigation
    const navigated = await navigationPromise;

    if (navigated) {
      await page.waitForTimeout(2000);
      console.log('✓ SUCCESS: Redirected to SimpleSwap');
      console.log('✓ Final URL:', page.url());

      await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/simpleswap-page.png' });
      console.log('✓ SimpleSwap screenshot saved');
    } else {
      console.log('✗ FAILED: Did not redirect to SimpleSwap');
      console.log('✗ Current URL:', page.url());

      // Check for errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      if (consoleErrors.length) {
        console.log('✗ Console errors:', consoleErrors);
      }

      await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/redirect-failed.png' });
    }
  } else {
    console.log('✗ FAILED: Modal did not appear');
    await page.screenshot({ path: '/Users/nelsonchan/Downloads/Reilly Dress/state/modal-failed.png' });
  }

  console.log('\n=== E2E TEST COMPLETE ===');
  await browser.close();
})();
