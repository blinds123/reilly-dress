const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runTestA() {
    const testResults = {
        test: "A - $59 Direct Flow",
        url: "https://reilly-dress.netlify.app",
        timestamp: new Date().toISOString(),
        steps_completed: [],
        assertions: {
            page_loads: false,
            title_correct: false,
            hero_image_loads: false,
            size_selector_works: false,
            primary_cta_exists: false,
            popup_appears: false,
            decline_button_exists: false,
            redirect_triggers: false
        },
        pool_59_count: 0,
        passed: false,
        notes: "",
        errors: []
    };

    let browser;
    try {
        console.log('🚀 Starting Test A: $59 Direct Flow Test');
        console.log('📍 URL:', testResults.url);

        // Launch browser
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        // Enable console logging
        page.on('console', msg => console.log('  💬 Console:', msg.text()));
        page.on('pageerror', err => {
            console.error('  ❌ Page Error:', err.message);
            testResults.errors.push(`Page Error: ${err.message}`);
        });

        // Step 1: Navigate to page
        console.log('\n📋 Step 1: Navigate to page');
        await page.goto(testResults.url, { waitUntil: 'networkidle', timeout: 30000 });
        testResults.steps_completed.push('Navigate to page');
        testResults.assertions.page_loads = true;
        console.log('  ✅ Page loaded');

        // Step 2: Verify page title
        console.log('\n📋 Step 2: Verify page title');
        const title = await page.title();
        console.log('  📄 Title:', title);
        testResults.assertions.title_correct = title.toLowerCase().includes('reilly');
        if (testResults.assertions.title_correct) {
            console.log('  ✅ Title contains "Reilly"');
        } else {
            console.log('  ⚠️  Title does not contain "Reilly"');
            testResults.notes += 'Title missing "Reilly". ';
        }

        // Step 3: Verify hero image loads
        console.log('\n📋 Step 3: Verify hero image loads');
        const heroImage = await page.locator('img[src*="product"]').first();
        if (await heroImage.count() > 0) {
            const naturalHeight = await heroImage.evaluate(img => img.naturalHeight);
            testResults.assertions.hero_image_loads = naturalHeight > 0;
            console.log(`  📸 Hero image naturalHeight: ${naturalHeight}`);
            if (testResults.assertions.hero_image_loads) {
                console.log('  ✅ Hero image loaded successfully');
            } else {
                console.log('  ⚠️  Hero image not loaded');
                testResults.notes += 'Hero image failed to load. ';
            }
        } else {
            console.log('  ⚠️  Hero image not found');
            testResults.notes += 'Hero image element not found. ';
        }

        // Step 4: Select a size
        console.log('\n📋 Step 4: Select a size');
        const sizeButtons = await page.locator('.size-btn:not([disabled])').all();
        console.log(`  🔍 Found ${sizeButtons.length} available size buttons`);

        if (sizeButtons.length > 0) {
            // Click the first available size (or use the already active one)
            const activeSize = await page.locator('.size-btn.active').first();
            const hasActiveSize = await activeSize.count() > 0;

            if (!hasActiveSize) {
                await sizeButtons[0].click();
                await page.waitForTimeout(500);
            }

            // Check if size was selected
            const selectedSize = await page.locator('.size-btn.active').count();
            testResults.assertions.size_selector_works = selectedSize > 0;

            if (testResults.assertions.size_selector_works) {
                const activeSizeBtn = await page.locator('.size-btn.active').first();
                const sizeText = await activeSizeBtn.innerText();
                console.log(`  ✅ Size selected: ${sizeText}`);
                testResults.steps_completed.push(`Selected size: ${sizeText}`);
            } else {
                console.log('  ⚠️  Size selection did not apply');
                testResults.notes += 'Size selector did not show selected state. ';
            }
        } else {
            console.log('  ⚠️  No size buttons found');
            testResults.notes += 'No size buttons found on page. ';
        }

        // Step 5: Check primary CTA exists
        console.log('\n📋 Step 5: Check primary CTA button');
        const primaryCTA = page.locator('#primaryCTA, button:has-text("GET MINE NOW")').first();
        const ctaExists = await primaryCTA.count() > 0;
        testResults.assertions.primary_cta_exists = ctaExists;

        if (ctaExists) {
            const ctaText = await primaryCTA.innerText();
            console.log(`  ✅ Primary CTA found: "${ctaText}"`);
        } else {
            console.log('  ⚠️  Primary CTA not found');
            testResults.notes += 'Primary CTA button not found. ';
        }

        // Step 6: Click primary CTA and check popup
        console.log('\n📋 Step 6: Click primary CTA and verify popup');
        if (ctaExists) {
            await primaryCTA.click();
            await page.waitForTimeout(1500);

            // Check if popup appeared (modal overlay with specific ID)
            const modal = page.locator('#orderBumpModal');
            const popup = page.locator('#orderBumpModal .modal');
            const modalVisible = await modal.isVisible().catch(() => false);
            const popupVisible = await popup.isVisible().catch(() => false);
            testResults.assertions.popup_appears = modalVisible && popupVisible;

            if (popupVisible) {
                console.log('  ✅ Order bump popup appeared');
                testResults.steps_completed.push('Popup appeared after CTA click');

                // Step 7: Check decline button
                console.log('\n📋 Step 7: Find decline button');
                const declineButton = page.locator('button[onclick="declineBump()"]').first();
                const declineExists = await declineButton.count() > 0;
                testResults.assertions.decline_button_exists = declineExists;

                if (declineExists) {
                    const declineText = await declineButton.innerText();
                    console.log(`  ✅ Decline button found: "${declineText}"`);

                    // Set up navigation listener before clicking
                    const navigationPromise = page.waitForURL(/simpleswap\.io/, { timeout: 5000 }).catch(() => null);

                    console.log('\n📋 Step 8: Click decline and verify redirect');
                    await declineButton.click();
                    await page.waitForTimeout(1000);

                    const navigated = await navigationPromise;
                    if (navigated) {
                        const currentURL = page.url();
                        testResults.assertions.redirect_triggers = currentURL.includes('simpleswap.io');
                        console.log(`  ✅ Redirect triggered to: ${currentURL}`);
                        testResults.steps_completed.push('Redirected to SimpleSwap');
                    } else {
                        // Check if redirect was attempted via window.location
                        const currentURL = page.url();
                        if (currentURL.includes('simpleswap.io')) {
                            testResults.assertions.redirect_triggers = true;
                            console.log(`  ✅ Redirect successful: ${currentURL}`);
                            testResults.steps_completed.push('Redirected to SimpleSwap');
                        } else {
                            console.log(`  ⚠️  No redirect detected. Current URL: ${currentURL}`);
                            testResults.notes += 'Decline button did not trigger redirect to SimpleSwap. ';
                        }
                    }
                } else {
                    console.log('  ⚠️  Decline button not found in popup');
                    testResults.notes += 'Decline button not found in popup. ';
                }
            } else {
                console.log('  ⚠️  Popup did not appear after CTA click');
                testResults.notes += 'Order bump popup did not appear. ';
            }
        }

        // Check pool availability
        console.log('\n📋 Checking $59 pool availability');
        const poolResponse = await fetch('https://simpleswap-automation-1.onrender.com/');
        const poolData = await poolResponse.json();
        testResults.pool_59_count = poolData['59'] || 0;
        console.log(`  💰 Pool $59 count: ${testResults.pool_59_count}`);

        if (testResults.pool_59_count === 0) {
            testResults.notes += 'WARNING: $59 pool has 0 exchanges available. ';
        }

        // Take screenshot
        await page.screenshot({
            path: '/Users/nelsonchan/Downloads/Reilly Dress/state/test-a-screenshot.png',
            fullPage: true
        });
        console.log('\n📸 Screenshot saved');

        // Determine if test passed
        const criticalAssertions = [
            testResults.assertions.page_loads,
            testResults.assertions.title_correct,
            testResults.assertions.size_selector_works,
            testResults.assertions.primary_cta_exists,
            testResults.assertions.popup_appears,
            testResults.assertions.decline_button_exists,
            testResults.assertions.redirect_triggers
        ];

        testResults.passed = criticalAssertions.every(assertion => assertion === true);

        if (testResults.passed) {
            console.log('\n✅ TEST A PASSED - All assertions successful');
        } else {
            console.log('\n❌ TEST A FAILED - Some assertions failed');
            console.log('Failed assertions:', Object.entries(testResults.assertions)
                .filter(([key, value]) => !value)
                .map(([key]) => key)
                .join(', '));
        }

    } catch (error) {
        console.error('\n❌ Test Error:', error.message);
        testResults.errors.push(error.message);
        testResults.notes += `Error: ${error.message}. `;
    } finally {
        if (browser) {
            await browser.close();
        }

        // Save results
        const outputPath = '/Users/nelsonchan/Downloads/Reilly Dress/state/test-a.json';
        fs.writeFileSync(outputPath, JSON.stringify(testResults, null, 2));
        console.log(`\n💾 Results saved to: ${outputPath}`);

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('TEST A SUMMARY');
        console.log('='.repeat(60));
        console.log('Test:', testResults.test);
        console.log('URL:', testResults.url);
        console.log('Result:', testResults.passed ? '✅ PASSED' : '❌ FAILED');
        console.log('Pool $59 Count:', testResults.pool_59_count);
        console.log('Steps Completed:', testResults.steps_completed.length);
        console.log('Errors:', testResults.errors.length);
        if (testResults.notes) {
            console.log('Notes:', testResults.notes);
        }
        console.log('='.repeat(60));
    }
}

runTestA();
