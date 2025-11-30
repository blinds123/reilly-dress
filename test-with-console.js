const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    console.log(`[${msg.type()}]`, text);
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log('✗ REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  // Capture responses
  page.on('response', response => {
    if (response.url().includes('simpleswap-automation')) {
      console.log('✓ POOL API RESPONSE:', response.status(), response.url());
    }
  });

  console.log('=== TESTING WITH CONSOLE LOGGING ===\n');

  await page.goto('https://reilly-dress.netlify.app');
  await page.waitForLoadState('networkidle');

  console.log('\n--- Clicking PRE-ORDER and ACCEPTING ($29) ---\n');
  await page.click('button[onclick*="handleAddToCart(\'secondary\')"]');
  await page.waitForTimeout(500);

  await page.click('button[onclick="acceptBump()"]');
  console.log('\n--- Accept clicked, waiting for API call... ---\n');

  await page.waitForTimeout(10000); // Wait to see what happens

  const finalUrl = page.url();
  console.log('\n--- FINAL URL:', finalUrl, '---');

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach(msg => {
    if (msg.text.includes('error') || msg.text.includes('Pool') || msg.text.includes('SimpleSwap')) {
      console.log(`[${msg.type}]`, msg.text);
    }
  });

  await browser.close();
})();
