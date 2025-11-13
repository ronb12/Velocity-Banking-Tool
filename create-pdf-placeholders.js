/**
 * Create placeholder PDF files for savings challenges
 * These are minimal valid PDF files that can be replaced with actual content later
 */

const fs = require('fs');
const path = require('path');

// Minimal valid PDF structure
function createMinimalPDF(title, description) {
  // PDF header and minimal structure
  const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
>>
>>
endobj
4 0 obj
<<
/Length 200
>>
stream
BT
/F1 24 Tf
100 700 Td
(${title}) Tj
0 -30 Td
/F1 12 Tf
(${description}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000306 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
506
%%EOF`;

  return pdfContent;
}

// Challenge definitions
const challenges = [
  {
    filename: '5000_biweekly.pdf',
    title: '$5,000 Biweekly Challenge',
    description: 'Save $5,000 over 26 biweekly periods. Start with $75 and increase by $75 each period.'
  },
  {
    filename: '52_week_1378.pdf',
    title: '$1,378 52-Week Challenge',
    description: 'Save $1,378 over 52 weeks. Start with $1 in week 1 and increase by $1 each week.'
  },
  {
    filename: 'emergency_fund.pdf',
    title: 'Emergency Fund (3 Months)',
    description: 'Build a 3-month emergency fund. Save $1,000 per month for 3 months ($3,000 total).'
  },
  {
    filename: 'no_spend_30day.pdf',
    title: '30-Day No Spend Challenge',
    description: 'Avoid unnecessary spending for 30 days. Reward yourself $5 (or custom amount) per no-spend day.'
  },
  {
    filename: 'vacation_12month.pdf',
    title: '12-Month Vacation Fund',
    description: 'Save for your dream vacation. Save $100 per month for 12 months ($1,200 total).'
  },
  {
    filename: 'holiday_12week.pdf',
    title: '12-Week Holiday Savings',
    description: 'Prepare for holiday expenses. Save $50 per week for 12 weeks ($600 total).'
  },
  {
    filename: 'weekly_10up.pdf',
    title: '$10 Weekly Ramp-Up',
    description: 'Gradually increase your savings. Start with $10 in week 1, increase by $10 each week for 12 weeks.'
  },
  {
    filename: 'random_dice.pdf',
    title: 'Dice Roll Challenge (30 Days)',
    description: 'Roll a die each day and save that amount ($1-$6). Make saving fun and unpredictable!'
  }
];

// Create pdfs directory if it doesn't exist
const pdfsDir = path.join(__dirname, 'pdfs');
if (!fs.existsSync(pdfsDir)) {
  fs.mkdirSync(pdfsDir, { recursive: true });
  console.log('✅ Created pdfs/ directory');
}

// Create PDF files
console.log('\n📄 Creating PDF placeholder files...\n');

let created = 0;
let skipped = 0;

challenges.forEach(challenge => {
  const filePath = path.join(pdfsDir, challenge.filename);
  
  // Check if file already exists
  if (fs.existsSync(filePath)) {
    console.log(`⏭️  Skipped: ${challenge.filename} (already exists)`);
    skipped++;
    return;
  }
  
  try {
    const pdfContent = createMinimalPDF(challenge.title, challenge.description);
    fs.writeFileSync(filePath, pdfContent, 'binary');
    const stats = fs.statSync(filePath);
    console.log(`✅ Created: ${challenge.filename} (${(stats.size / 1024).toFixed(2)} KB)`);
    created++;
  } catch (error) {
    console.error(`❌ Error creating ${challenge.filename}:`, error.message);
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');
console.log(`Created: ${created} PDF files`);
console.log(`Skipped: ${skipped} PDF files (already exist)`);
console.log(`Total: ${challenges.length} challenges\n`);

if (created > 0) {
  console.log('✅ All PDF placeholder files created successfully!');
  console.log('💡 Note: These are minimal placeholder PDFs. Replace them with actual content when available.\n');
}

