const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const mammoth = require('mammoth');
const https = require('https');
const fs = require('fs');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuUQcqVg9eEyNMRgD7wSzaJZ5YiJp6mQc",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.appspot.com",
  messagingSenderId: "147060056706",
  appId: "1:147060056706:web:68db8cd29f4f3dc7b6b9e7",
  measurementId: "G-4XBQB5F92Y"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

const AI_ARTIFACT_ID = 'fac82dfe-f3f0-4ecb-a17e-03cdb4659fbb'; // Hybrid system test

// Expected client data
const EXPECTED_DATA = {
  "grantor_names": "saleh",
  "successor_co_trustees": "mahmoud",
  "notary_commission_expires": "2025-10-14",
  "signature_authority": "Signatures of all Trustees",
  "notary_public_name": "mohammad",
  "county": "king  county",
  "execution_year": "2030",
  "successor_trustees": "soso",
  "current_trustees": "belal riyad",
  "trust_name": "riyad trust",
  "execution_day": "22",
  "execution_month": "may"
};

(async () => {
  try {
    console.log('📊 ANALYZING AI-GENERATED DOCUMENT');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`🆔 Artifact ID: ${AI_ARTIFACT_ID}\n`);

    // Get download URL
    const getDownloadUrl = httpsCallable(functions, 'getDocumentDownloadUrl');
    const urlResult = await getDownloadUrl({ artifactId: AI_ARTIFACT_ID });
    
    if (!urlResult.data.success) {
      console.error('❌ Failed to get download URL:', urlResult.data.error);
      process.exit(1);
    }

    const downloadUrl = urlResult.data.data.downloadUrl;
    console.log('✅ Download URL obtained\n');

    // Download document
    console.log('📥 Downloading AI-generated document...');
    const buffer = await new Promise((resolve, reject) => {
      https.get(downloadUrl, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      });
    });

    console.log(`✅ Downloaded (${buffer.length} bytes)\n`);

    // Extract text
    console.log('🔍 Extracting text from document...');
    const result = await mammoth.extractRawText({ buffer });
    const docText = result.value.toLowerCase();
    
    console.log(`✅ Extracted ${docText.length} characters\n`);

    // Analyze field mapping
    console.log('📋 FIELD MAPPING ANALYSIS:');
    console.log('═══════════════════════════════════════════════════════════\n');

    let foundCount = 0;
    let totalFields = Object.keys(EXPECTED_DATA).length;

    for (const [field, expectedValue] of Object.entries(EXPECTED_DATA)) {
      const searchValue = String(expectedValue).toLowerCase();
      const found = docText.includes(searchValue);
      
      if (found) {
        console.log(`✅ ${field}: "${expectedValue}" - FOUND`);
        foundCount++;
      } else {
        console.log(`❌ ${field}: "${expectedValue}" - MISSING`);
      }
    }

    const successRate = ((foundCount / totalFields) * 100).toFixed(1);
    
    console.log(`\n📈 AI-POWERED FIELD MAPPING SUCCESS RATE: ${successRate}% (${foundCount}/${totalFields})`);

    // Document quality analysis
    console.log(`\n\n📄 DOCUMENT QUALITY ANALYSIS:`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const qualityChecks = {
      'Contains "CERTIFICATE OF TRUST"': docText.includes('certificate of trust'),
      'Contains "A.R.S. §"': docText.includes('a.r.s.'),
      'Contains "Grantor"': docText.includes('grantor'),
      'Contains "Trustee"': docText.includes('trustee'),
      'Contains "Notary Public"': docText.includes('notary public'),
      'Has reasonable length (>500 chars)': docText.length > 500,
      'Not too long (<10000 chars)': docText.length < 10000,
    };

    let qualityScore = 0;
    for (const [check, passed] of Object.entries(qualityChecks)) {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
      if (passed) qualityScore++;
    }

    console.log(`\n📊 Document Quality Score: ${qualityScore}/${Object.keys(qualityChecks).length}`);

    // Save document preview
    console.log(`\n\n📄 DOCUMENT PREVIEW (first 800 chars):`);
    console.log('──────────────────────────────────────────────────────');
    console.log(result.value.substring(0, 800) + '...');

    // Summary
    console.log(`\n\n🎯 AI GENERATION SUMMARY`);
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`✅ Field Mapping: ${successRate}% (${foundCount}/${totalFields} fields)`);
    console.log(`✅ Document Quality: ${qualityScore}/${Object.keys(qualityChecks).length} checks passed`);
    console.log(`📏 Document Length: ${docText.length} characters`);
    
    if (foundCount === totalFields) {
      console.log(`\n🎉 PERFECT! All fields successfully mapped by AI!`);
    } else if (foundCount / totalFields >= 0.8) {
      console.log(`\n✅ GOOD! Achieved 80%+ field mapping target!`);
    } else {
      console.log(`\n⚠️  NEEDS IMPROVEMENT: Below 80% target`);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }

  process.exit(0);
})();
