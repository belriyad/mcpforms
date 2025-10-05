// Document Comparison Test - Generate document and compare with template
const https = require('https');
const fs = require('fs');
const path = require('path');

// Function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({ statusCode: res.statusCode, body: jsonBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Function to download file
function downloadFile(url, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve(filePath);
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

// Function to extract text from Word document
async function extractTextFromDocx(filePath) {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    console.log('⚠️ Mammoth not available, using basic ZIP extraction');
    
    // Fallback: Use built-in ZIP extraction
    const AdmZip = require('adm-zip');
    try {
      const zip = new AdmZip(filePath);
      const documentXml = zip.readAsText('word/document.xml');
      
      // Basic XML text extraction - remove tags and decode entities
      let text = documentXml
        .replace(/<[^>]*>/g, ' ')  // Remove XML tags
        .replace(/&lt;/g, '<')     // Decode entities
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
      
      return text;
    } catch (zipError) {
      console.log('❌ Could not extract text from document:', zipError.message);
      return null;
    }
  }
}

async function runDocumentComparisonTest() {
  console.log('🔍 DOCUMENT COMPARISON TEST');
  console.log('=' .repeat(80));
  
  try {
    // Step 1: Get the latest intake
    console.log('\n📋 Step 1: Finding latest intake...');
    const latestIntakeId = '8e57b9f0-62e9-4fe7-a237-77a08ccde5d9'; // Known working intake
    console.log(`✅ Using intake ID: ${latestIntakeId}`);
    
    // Step 2: Generate a new document using our working test method
    console.log('\n🔄 Step 2: Generating new document using working test method...');
    
    // First run our working test to generate a document
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
      console.log('🚀 Running test-latest-ai.js to generate document...');
      const { stdout, stderr } = await execAsync('node test-latest-ai.js');
      console.log('📊 Test output:');
      console.log(stdout);
      if (stderr) console.log('⚠️ Test errors:', stderr);
      
      // Extract artifact ID from output
      const artifactMatch = stdout.match(/Generated artifacts: ([a-f0-9-]+)/);
      if (!artifactMatch) {
        throw new Error('Could not extract artifact ID from test output');
      }
      
      const artifactIds = [artifactMatch[1]];
      console.log(`✅ Generated document successfully`);
      console.log(`📦 Artifact ID: ${artifactIds[0]}`);
      
      // Continue with the rest of the test
      return await analyzeGeneratedDocument(latestIntakeId, artifactIds[0]);
      
    } catch (testError) {
      console.log('⚠️ Test method failed, trying direct approach...');
      console.log('Error:', testError.message);
      
      // Fallback: use a known recent artifact ID from Firebase Storage
      // Let's assume the most recent artifact from our tests
      const recentArtifactId = 'db85a9cc-e26c-495a-9f8e-cd60dbd86f14'; // From recent logs
      console.log(`📦 Using recent artifact ID: ${recentArtifactId}`);
      
      return await analyzeGeneratedDocument(latestIntakeId, recentArtifactId);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Separate function to analyze the generated document
async function analyzeGeneratedDocument(intakeId, artifactId) {
  try {
    // Step 3: Download the generated document
    console.log('\n📥 Step 3: Downloading generated document...');
    const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/formgenai-4545.appspot.com/o/generated-documents%2F${latestIntakeId}%2F${artifactIds[0]}.docx?alt=media`;
    const downloadPath = path.join(__dirname, 'temp-generated-document.docx');
    
    console.log('🌐 Download URL:', downloadUrl);
    await downloadFile(downloadUrl, downloadPath);
    console.log(`✅ Downloaded to: ${downloadPath}`);
    
    // Step 4: Extract text from generated document
    console.log('\n📄 Step 4: Extracting text from generated document...');
    const generatedText = await extractTextFromDocx(downloadPath);
    
    if (!generatedText) {
      throw new Error('Could not extract text from generated document');
    }
    
    console.log(`✅ Extracted ${generatedText.length} characters of text`);
    console.log(`📝 Preview: "${generatedText.substring(0, 200)}..."`);
    
    // Step 5: Get the original template for comparison
    console.log('\n📋 Step 5: Getting template information...');
    
    // We know from previous tests that these are the client data fields available:
    const expectedClientData = {
      'companyName': 'B Tech Global LLC',
      'fullName': 'belal B Tech Global LLC riyad',
      'granteeName': 'Some Grantee',
      'grantorName': 'belal B Tech Global LLC riyad', 
      'phone': '+1-555-123-4567',
      'trusteeName': 'Belal Riyad',
      'trustorName': 'Belal Riyad',
      'email': 'belal@btechglobal.com',
      'documentDate': '2024-10-04',
      'incorporationState': 'Delaware',
      'additionalNotes': 'Some additional notes',
      'beneficiaries': 'John Doe, Jane Doe',
      'propertyAddress': '123 Main St, City, State 12345'
    };
    
    // Step 6: Analyze data insertion
    console.log('\n🔍 Step 6: Analyzing data insertion...');
    
    const insertionResults = [];
    let successfulInsertions = 0;
    let totalFields = 0;
    
    for (const [fieldName, expectedValue] of Object.entries(expectedClientData)) {
      totalFields++;
      const found = generatedText.includes(expectedValue);
      
      insertionResults.push({
        field: fieldName,
        expectedValue: expectedValue,
        found: found,
        status: found ? '✅ FOUND' : '❌ MISSING'
      });
      
      if (found) successfulInsertions++;
    }
    
    // Step 7: Generate comparison report
    console.log('\n📊 Step 7: DOCUMENT COMPARISON REPORT');
    console.log('=' .repeat(80));
    
    console.log(`\n📈 INSERTION SUCCESS RATE: ${successfulInsertions}/${totalFields} (${Math.round(successfulInsertions/totalFields*100)}%)`);
    
    console.log('\n✅ SUCCESSFULLY INSERTED DATA:');
    insertionResults.filter(r => r.found).forEach(result => {
      console.log(`   ${result.status} ${result.field}: "${result.expectedValue}"`);
    });
    
    console.log('\n❌ MISSING DATA:');
    insertionResults.filter(r => !r.found).forEach(result => {
      console.log(`   ${result.status} ${result.field}: "${result.expectedValue}"`);
    });
    
    console.log('\n📄 GENERATED DOCUMENT CONTENT SAMPLE:');
    console.log('-' .repeat(50));
    console.log(generatedText.substring(0, 1000) + '...');
    console.log('-' .repeat(50));
    
    // Clean up
    try {
      fs.unlinkSync(downloadPath);
      console.log('\n🧹 Cleaned up temporary files');
    } catch (e) {
      console.log('\n⚠️ Could not clean up temporary files');
    }
    
    console.log('\n🎯 CONCLUSION:');
    if (successfulInsertions >= totalFields * 0.5) {
      console.log('✅ GOOD: More than 50% of fields were successfully inserted');
    } else {
      console.log('⚠️ NEEDS IMPROVEMENT: Less than 50% of fields were inserted');
    }
    
    console.log(`\n🔄 Total fields processed: ${totalFields}`);
    console.log(`✅ Successful insertions: ${successfulInsertions}`);
    console.log(`❌ Missing insertions: ${totalFields - successfulInsertions}`);
    console.log(`📊 Success rate: ${Math.round(successfulInsertions/totalFields*100)}%`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Install required dependencies if not available
async function checkAndInstallDependencies() {
  const requiredPackages = ['mammoth', 'adm-zip'];
  
  for (const pkg of requiredPackages) {
    try {
      require(pkg);
    } catch (e) {
      console.log(`📦 Installing ${pkg}...`);
      const { execSync } = require('child_process');
      try {
        execSync(`npm install ${pkg}`, { stdio: 'inherit' });
      } catch (installError) {
        console.log(`⚠️ Could not install ${pkg}, will use fallback methods`);
      }
    }
  }
}

// Run the test
async function main() {
  await checkAndInstallDependencies();
  await runDocumentComparisonTest();
}

main().catch(console.error);