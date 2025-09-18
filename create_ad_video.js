const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function createAdVideo() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for high-quality recording
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🎬 Creating professional advertisement video...');
    
    // Create ad directory
    const adDir = path.join(__dirname, 'ad_video');
    if (!fs.existsSync(adDir)) {
      fs.mkdirSync(adDir);
    }
    
    // Ad Scene 1: Opening with Dashboard (0-3 seconds)
    console.log('📊 Recording opening scene - Dashboard...');
    await page.goto('https://mobile-debt-tracker.web.app', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(adDir, '01_opening_dashboard.png'),
      fullPage: true
    });
    
    // Ad Scene 2: Dashboard with AI insights (3-8 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({
      path: path.join(adDir, '02_dashboard_insights.png'),
      fullPage: true
    });
    
    // Ad Scene 3: Debt Tracker (8-13 seconds)
    console.log('💳 Recording debt tracker scene...');
    await page.goto('https://mobile-debt-tracker.web.app/Debt_Tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Add sample debt data for dramatic effect
    try {
      const inputs = await page.$$('input[type="number"], input[type="text"]');
      if (inputs.length >= 3) {
        await inputs[0].type('25000'); // Higher debt amount for impact
        await new Promise(resolve => setTimeout(resolve, 500));
        await inputs[1].type('24'); // High interest rate
        await new Promise(resolve => setTimeout(resolve, 500));
        await inputs[2].type('800'); // Higher payment
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.log('Could not add sample debt data');
    }
    
    await page.screenshot({
      path: path.join(adDir, '03_debt_tracker_dramatic.png'),
      fullPage: true
    });
    
    // Ad Scene 4: Budget Tracker (13-18 seconds)
    console.log('💰 Recording budget tracker scene...');
    await page.goto('https://mobile-debt-tracker.web.app/budget.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(adDir, '04_budget_tracker.png'),
      fullPage: true
    });
    
    // Ad Scene 5: Velocity Calculator with results (18-25 seconds)
    console.log('🚀 Recording velocity calculator scene...');
    await page.goto('https://mobile-debt-tracker.web.app/Velocity_Calculator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Load example and show dramatic results
    try {
      const buttons = await page.$$('button');
      for (let button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && (text.includes('Example') || text.includes('📋'))) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
      }
      
      for (let button of buttons) {
        const text = await button.evaluate(el => el.textContent);
        if (text && text.includes('Calculate')) {
          await button.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
      }
    } catch (e) {
      console.log('Could not interact with velocity calculator');
    }
    
    await page.screenshot({
      path: path.join(adDir, '05_velocity_results.png'),
      fullPage: true
    });
    
    // Ad Scene 6: Net Worth Tracker (25-32 seconds)
    console.log('📊 Recording net worth tracker scene...');
    await page.goto('https://mobile-debt-tracker.web.app/net_worth_tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(adDir, '06_net_worth_tracker.png'),
      fullPage: true
    });
    
    // Ad Scene 7: Credit Score Estimator (32-35 seconds)
    console.log('💳 Recording credit score estimator scene...');
    await page.goto('https://mobile-debt-tracker.web.app/Credit_Score_Estimator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(adDir, '07_credit_score.png'),
      fullPage: true
    });
    
    // Ad Scene 8: Call to Action (35-38 seconds)
    console.log('🎯 Recording call to action scene...');
    await page.goto('https://mobile-debt-tracker.web.app', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(adDir, '08_call_to_action.png'),
      fullPage: true
    });
    
    console.log('✅ Advertisement video frames created successfully!');
    console.log('📁 Files created in ad_video/ directory:');
    
    // List created files
    const files = fs.readdirSync(adDir);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    console.log('\n🎬 Next steps for professional ad:');
    console.log('1. Use the advertisement_script.txt for voice-over');
    console.log('2. Record professional voice-over (38 seconds total)');
    console.log('3. Combine audio with video frames');
    console.log('4. Add background music and sound effects');
    console.log('5. Add text overlays and call-to-action graphics');
    
  } catch (error) {
    console.error('Error creating ad video:', error);
  } finally {
    await browser.close();
  }
}

// Run the ad video creation
createAdVideo().then(() => {
  console.log('🎉 Advertisement video creation completed!');
  process.exit(0);
}).catch(error => {
  console.error('Ad video creation failed:', error);
  process.exit(1);
});
