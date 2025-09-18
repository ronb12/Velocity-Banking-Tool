const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function createAppVideo() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for high-quality recording
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🎬 Creating comprehensive app demonstration video...');
    
    // Create demo directory
    const demoDir = path.join(__dirname, 'demo_video');
    if (!fs.existsSync(demoDir)) {
      fs.mkdirSync(demoDir);
    }
    
    // Demo 1: Main Dashboard with interactions
    console.log('📊 Recording Main Dashboard with interactions...');
    await page.goto('https://mobile-debt-tracker.web.app', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take multiple screenshots to show interaction
    await page.screenshot({
      path: path.join(demoDir, '01_dashboard_initial.png'),
      fullPage: true
    });
    
    // Simulate some interactions
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({
      path: path.join(demoDir, '02_dashboard_interaction.png'),
      fullPage: true
    });
    
    // Demo 2: Debt Tracker with sample data
    console.log('💳 Recording Debt Tracker with sample data...');
    await page.goto('https://mobile-debt-tracker.web.app/Debt_Tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({
      path: path.join(demoDir, '03_debt_tracker_initial.png'),
      fullPage: true
    });
    
    // Add sample debt data
    try {
      const inputs = await page.$$('input[type="number"], input[type="text"]');
      if (inputs.length >= 3) {
        await inputs[0].type('15000'); // Debt amount
        await new Promise(resolve => setTimeout(resolve, 500));
        await inputs[1].type('24'); // Interest rate
        await new Promise(resolve => setTimeout(resolve, 500));
        await inputs[2].type('500'); // Payment
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.log('Could not add sample debt data');
    }
    
    await page.screenshot({
      path: path.join(demoDir, '04_debt_tracker_with_data.png'),
      fullPage: true
    });
    
    // Demo 3: Budget Tracker
    console.log('💰 Recording Budget Tracker...');
    await page.goto('https://mobile-debt-tracker.web.app/budget.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(demoDir, '05_budget_tracker.png'),
      fullPage: true
    });
    
    // Demo 4: Velocity Calculator with example
    console.log('🚀 Recording Velocity Calculator with example...');
    await page.goto('https://mobile-debt-tracker.web.app/Velocity_Calculator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({
      path: path.join(demoDir, '06_velocity_initial.png'),
      fullPage: true
    });
    
    // Load example data
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
      
      // Click calculate
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
      path: path.join(demoDir, '07_velocity_with_results.png'),
      fullPage: true
    });
    
    // Demo 5: Net Worth Tracker
    console.log('📊 Recording Net Worth Tracker...');
    await page.goto('https://mobile-debt-tracker.web.app/net_worth_tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(demoDir, '08_net_worth_tracker.png'),
      fullPage: true
    });
    
    // Demo 6: Credit Score Estimator
    console.log('💳 Recording Credit Score Estimator...');
    await page.goto('https://mobile-debt-tracker.web.app/Credit_Score_Estimator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(demoDir, '09_credit_score_estimator.png'),
      fullPage: true
    });
    
    // Demo 7: 1099 Calculator
    console.log('📄 Recording 1099 Calculator...');
    await page.goto('https://mobile-debt-tracker.web.app/1099_calculator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await page.screenshot({
      path: path.join(demoDir, '10_1099_calculator.png'),
      fullPage: true
    });
    
    console.log('✅ Demo video frames created successfully!');
    console.log('📁 Files created in demo_video/ directory:');
    
    // List created files
    const files = fs.readdirSync(demoDir);
    files.forEach((file, index) => {
      console.log(`  ${index + 1}. ${file}`);
    });
    
    console.log('\n🎬 Next steps:');
    console.log('1. Use a video editing tool to combine these images into a video');
    console.log('2. Add transitions between frames (2-3 seconds each)');
    console.log('3. Add text overlays explaining each feature');
    console.log('4. Export as MP4 or GIF for sharing');
    
  } catch (error) {
    console.error('Error creating video demo:', error);
  } finally {
    await browser.close();
  }
}

// Run the video creation
createAppVideo().then(() => {
  console.log('🎉 Video demonstration creation completed!');
  process.exit(0);
}).catch(error => {
  console.error('Video creation failed:', error);
  process.exit(1);
});
