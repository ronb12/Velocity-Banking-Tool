const puppeteer = require('puppeteer');
const path = require('path');

async function createAppDemo() {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1920, height: 1080 },
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--start-maximized']
  });

  try {
    const page = await browser.newPage();
    
    // Set viewport for high-quality recording
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log('🎬 Starting app demonstration video creation...');
    
    // Demo 1: Main Dashboard
    console.log('📊 Recording Main Dashboard...');
    await page.goto('https://mobile-debt-tracker.web.app', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Take screenshot of dashboard
    await page.screenshot({
      path: path.join(__dirname, 'demo_dashboard.png'),
      fullPage: true
    });
    
    // Demo 2: Debt Tracker
    console.log('💳 Recording Debt Tracker...');
    await page.goto('https://mobile-debt-tracker.web.app/Debt_Tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Add sample debt data
    try {
      const inputs = await page.$$('input[type="number"], input[type="text"]');
      if (inputs.length >= 3) {
        await inputs[0].type('15000'); // Debt amount
        await inputs[1].type('24'); // Interest rate
        await inputs[2].type('500'); // Payment
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.log('Could not add sample debt data');
    }
    
    await page.screenshot({
      path: path.join(__dirname, 'demo_debt_tracker.png'),
      fullPage: true
    });
    
    // Demo 3: Budget Tracker
    console.log('💰 Recording Budget Tracker...');
    await page.goto('https://mobile-debt-tracker.web.app/budget.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({
      path: path.join(__dirname, 'demo_budget_tracker.png'),
      fullPage: true
    });
    
    // Demo 4: Velocity Calculator
    console.log('🚀 Recording Velocity Calculator...');
    await page.goto('https://mobile-debt-tracker.web.app/Velocity_Calculator.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to load example data
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
      path: path.join(__dirname, 'demo_velocity_calculator.png'),
      fullPage: true
    });
    
    // Demo 5: Net Worth Tracker
    console.log('📊 Recording Net Worth Tracker...');
    await page.goto('https://mobile-debt-tracker.web.app/net_worth_tracker.html', {
      waitUntil: 'networkidle0'
    });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await page.screenshot({
      path: path.join(__dirname, 'demo_net_worth_tracker.png'),
      fullPage: true
    });
    
    console.log('✅ Demo screenshots created successfully!');
    console.log('📁 Files created:');
    console.log('  - demo_dashboard.png');
    console.log('  - demo_debt_tracker.png');
    console.log('  - demo_budget_tracker.png');
    console.log('  - demo_velocity_calculator.png');
    console.log('  - demo_net_worth_tracker.png');
    
  } catch (error) {
    console.error('Error creating demo:', error);
  } finally {
    await browser.close();
  }
}

// Run the demo creation
createAppDemo().then(() => {
  console.log('🎉 App demonstration completed!');
  process.exit(0);
}).catch(error => {
  console.error('Demo creation failed:', error);
  process.exit(1);
});
