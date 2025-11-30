const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testPreorderPopupFlow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const results = {
    test: "B - $19 Popup Flow",
    url: "https://reilly-dress.netlify.app",
    steps_completed: [],
    assertions: {
      page_loads: false,
      secondary_cta_visible: false,
      popup_shows_belt: false,
      popup_shows_correct_total: false,
      decline_triggers_19: false
    },
    pool_19_count: 0,
    pool_29_count: 10,
    passed: false,
    notes: ""
  };

  try {
    console.log('🧪 Test Agent B: $19 Pre-order Popup Flow Tester');
    console.log('='.repeat(60));

    // Listen to console messages
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('processOrder') || text.includes('INTERCEPTED')) {
        console.log(`🔊 Browser console: ${text}`);
      }
    });

    // Set up processOrder interception BEFORE navigation
    await page.addInitScript(() => {
      window.processOrderCalls = [];

      // Intercept by wrapping the function after page load
      window.addEventListener('load', () => {
        setTimeout(() => {
          if (typeof window.processOrder === 'function') {
            const original = window.processOrder;
            window.processOrder = function(amount) {
              window.processOrderCalls.push(amount);
              console.log(`[INTERCEPTED] processOrder(${amount})`);
              return original.call(this, amount);
            };
            console.log('[INTERCEPTOR] processOrder wrapper installed');
          } else {
            console.log('[INTERCEPTOR] processOrder function not found');
          }
        }, 500);
      });
    });

    // Step 1: Navigate to the site
    console.log('\n📍 Step 1: Navigating to https://reilly-dress.netlify.app...');
    await page.goto('https://reilly-dress.netlify.app', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    results.steps_completed.push('Navigated to site');

    // Verify page loads
    const pageTitle = await page.title();
    console.log(`✅ Page loaded: ${pageTitle}`);
    results.assertions.page_loads = true;
    results.steps_completed.push('Page loaded successfully');

    // Step 2: Verify secondary CTA is visible
    console.log('\n📍 Step 2: Checking for secondary CTA button...');
    const secondaryCTA = await page.locator('#secondaryCTA').first();
    const isVisible = await secondaryCTA.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      console.log('❌ Secondary CTA not found, checking for alternative selector...');
      const altButton = await page.locator('button:has-text("PRE-ORDER FOR 90% OFF")').first();
      const altVisible = await altButton.isVisible({ timeout: 5000 }).catch(() => false);

      if (altVisible) {
        console.log('✅ Found alternative secondary CTA button');
        results.assertions.secondary_cta_visible = true;
        results.steps_completed.push('Found secondary CTA (alternative selector)');
      } else {
        throw new Error('Secondary CTA button not found');
      }
    } else {
      const buttonText = await secondaryCTA.textContent();
      console.log(`✅ Secondary CTA visible: "${buttonText.trim()}"`);
      results.assertions.secondary_cta_visible = true;
      results.steps_completed.push('Secondary CTA visible');
    }

    // Step 3: Select a size
    console.log('\n📍 Step 3: Selecting a size...');
    const sizeButtons = await page.locator('.size-option').all();
    if (sizeButtons.length > 0) {
      await sizeButtons[0].click();
      await page.waitForTimeout(500);
      console.log('✅ Size selected');
      results.steps_completed.push('Selected size');
    } else {
      console.log('⚠️ No size buttons found, proceeding anyway...');
    }

    // Step 4: Click secondary CTA to trigger popup
    console.log('\n📍 Step 4: Clicking secondary CTA to trigger popup...');

    // Click the secondary CTA
    try {
      await secondaryCTA.click({ timeout: 5000 });
    } catch (e) {
      // Try alternative selector
      await page.locator('button:has-text("PRE-ORDER FOR 90% OFF")').first().click({ timeout: 5000 });
    }

    await page.waitForTimeout(1000);
    results.steps_completed.push('Clicked secondary CTA');

    // Step 5: Verify popup appears with Belt upsell
    console.log('\n📍 Step 5: Verifying order bump popup...');
    const popup = await page.locator('#orderBumpModal, .modal, [role="dialog"]').first();
    const popupVisible = await popup.isVisible({ timeout: 5000 }).catch(() => false);

    if (!popupVisible) {
      console.log('❌ Order bump popup did not appear');
      results.notes = 'Order bump popup did not appear after clicking secondary CTA';
    } else {
      console.log('✅ Order bump popup visible');

      // Check for Belt mention
      const popupContent = await popup.textContent();
      const hasBelt = popupContent.toLowerCase().includes('belt') ||
                      popupContent.toLowerCase().includes('upsell');

      if (hasBelt) {
        console.log('✅ Popup shows Belt upsell');
        results.assertions.popup_shows_belt = true;
        results.steps_completed.push('Popup shows Belt upsell');
      } else {
        console.log('❌ Popup does not mention Belt');
        console.log('Popup content:', popupContent);
      }

      // Step 6: Verify total shows $29 (19 + 10)
      console.log('\n📍 Step 6: Verifying popup shows correct total...');
      const hasCorrectTotal = popupContent.includes('$29') || popupContent.includes('29');
      const hasBasePrice = popupContent.includes('$19') || popupContent.includes('19');
      const hasUpsellPrice = popupContent.includes('$10') || popupContent.includes('10');

      if (hasCorrectTotal && hasBasePrice && hasUpsellPrice) {
        console.log('✅ Popup shows correct total: $19 + $10 = $29');
        results.assertions.popup_shows_correct_total = true;
        results.steps_completed.push('Popup shows correct total ($29)');
      } else {
        console.log('⚠️ Total calculation unclear in popup');
        console.log(`  - Has $29: ${hasCorrectTotal}`);
        console.log(`  - Has $19: ${hasBasePrice}`);
        console.log(`  - Has $10: ${hasUpsellPrice}`);
      }

      // Step 7: Click decline to test $19 flow
      console.log('\n📍 Step 7: Testing decline flow (should trigger $19)...');
      const declineButton = await page.locator('button[onclick="declineBump()"]').first();
      const declineVisible = await declineButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (declineVisible) {
        await declineButton.click();
        await page.waitForTimeout(2000);
        results.steps_completed.push('Clicked decline button');

        // Check if processOrder was called with amount 19
        const processOrderCalls = await page.evaluate(() => window.processOrderCalls || []);
        console.log(`📞 ProcessOrder calls detected:`, processOrderCalls);

        if (processOrderCalls.includes(19)) {
          console.log('✅ Decline correctly triggered processOrder(19)');
          results.assertions.decline_triggers_19 = true;
          results.steps_completed.push('Decline triggered processOrder(19)');
        } else if (processOrderCalls.length > 0) {
          console.log(`❌ Decline triggered processOrder(${processOrderCalls.join(', ')}) instead of 19`);
          results.notes = `Decline triggered wrong amount: ${processOrderCalls.join(', ')}`;
        } else {
          console.log('⚠️ No processOrder call detected after decline');
          results.notes = 'No processOrder call detected after decline';
        }
      } else {
        console.log('❌ Decline button not found in popup');
        results.notes = 'Decline button not found in popup';
      }
    }

    // Final assessment
    const allPassed = Object.values(results.assertions).every(v => v === true);
    results.passed = allPassed;

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(60));
    console.log(`Page loads: ${results.assertions.page_loads ? '✅' : '❌'}`);
    console.log(`Secondary CTA visible: ${results.assertions.secondary_cta_visible ? '✅' : '❌'}`);
    console.log(`Popup shows Belt: ${results.assertions.popup_shows_belt ? '✅' : '❌'}`);
    console.log(`Popup shows correct total: ${results.assertions.popup_shows_correct_total ? '✅' : '❌'}`);
    console.log(`Decline triggers $19: ${results.assertions.decline_triggers_19 ? '✅' : '❌'}`);
    console.log('='.repeat(60));
    console.log(`OVERALL: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    results.notes = `Error: ${error.message}`;
    results.passed = false;
  } finally {
    // Save results
    const outputPath = path.join('/Users/nelsonchan/Downloads/Reilly Dress/state', 'test-b.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\n💾 Results saved to: ${outputPath}`);

    await browser.close();
  }

  return results;
}

testPreorderPopupFlow();
