const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

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

// Test data matching the exact intake we analyzed
const TEST_INTAKE_ID = '46ea3329-bc90-4c51-8644-2228958e7c73';
const EXPECTED_CLIENT_DATA = {
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

async function testEnhancedFieldMapping() {
  console.log('🧪 TESTING ENHANCED FIELD MAPPING FOR CERTIFICATE OF TRUST');
  console.log('═'.repeat(70));
  console.log(`🆔 Test Intake ID: ${TEST_INTAKE_ID}`);
  console.log('📋 Testing with actual client data from successful intake');
  console.log('═'.repeat(70));
  
  try {
    // Test 1: Regenerate documents with enhanced field mapping
    console.log('\n📋 TEST 1: Regenerating documents with enhanced mapping...');
    
    const generateDocs = httpsCallable(functions, 'generateDocumentsFromIntake');
    const result = await generateDocs({ 
      intakeId: TEST_INTAKE_ID, 
      regenerate: true 
    });
    
    console.log('🔄 Generation result:', JSON.stringify(result.data, null, 2));
    
    if (result.data.success) {
      const artifactIds = result.data.data.artifactIds;
      console.log(`✅ Document generation successful! Artifact IDs: ${JSON.stringify(artifactIds)}`);
      
      // Wait a moment for generation to complete
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Test 2: Download and analyze the newly generated document
      if (artifactIds && artifactIds.length > 0) {
        const newArtifactId = artifactIds[0];
        
        console.log(`\n📄 TEST 2: Analyzing newly generated document ${newArtifactId}...`);
        
        const getDownloadUrl = httpsCallable(functions, 'getDocumentDownloadUrl');
        const downloadResult = await getDownloadUrl({ artifactId: newArtifactId });
        
        if (downloadResult.data.success) {
          const downloadUrl = downloadResult.data.data.downloadUrl;
          console.log('✅ Download URL obtained');
          
          // Download and analyze document
          const response = await fetch(downloadUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const mammoth = require('mammoth');
            const fs = require('fs');
            const path = require('path');
            
            // Save temporarily and extract text
            const tempPath = path.join(__dirname, `test_enhanced_${newArtifactId}.docx`);
            fs.writeFileSync(tempPath, Buffer.from(buffer));
            
            const textResult = await mammoth.extractRawText({ path: tempPath });
            const text = textResult.value;
            
            console.log('\n📊 ENHANCED DOCUMENT ANALYSIS:');
            console.log('═'.repeat(40));
            console.log(`Document length: ${text.length} characters`);
            
            // Test field mapping success rate
            let mappedFields = 0;
            let totalFields = Object.keys(EXPECTED_CLIENT_DATA).length;
            
            console.log('\n🔍 FIELD MAPPING VERIFICATION:');
            console.log('═'.repeat(40));
            
            Object.entries(EXPECTED_CLIENT_DATA).forEach(([fieldName, expectedValue]) => {
              const found = text.toLowerCase().includes(expectedValue.toLowerCase());
              console.log(`${found ? '✅' : '❌'} ${fieldName}: "${expectedValue}" - ${found ? 'FOUND' : 'MISSING'}`);
              if (found) mappedFields++;
            });
            
            const successRate = ((mappedFields / totalFields) * 100).toFixed(1);
            console.log(`\n📈 ENHANCED FIELD MAPPING SUCCESS RATE: ${successRate}% (${mappedFields}/${totalFields})`);
            
            // Compare with previous 25% rate
            console.log('\n📊 IMPROVEMENT ANALYSIS:');
            console.log('═'.repeat(30));
            console.log(`Previous Success Rate: 25.0% (3/12)`);
            console.log(`New Success Rate: ${successRate}% (${mappedFields}/${totalFields})`);
            
            const improvement = parseFloat(successRate) - 25.0;
            console.log(`Improvement: ${improvement > 0 ? '+' : ''}${improvement.toFixed(1)}%`);
            
            if (parseFloat(successRate) >= 80) {
              console.log('🎉 SUCCESS: Achieved target 80%+ field mapping rate!');
            } else if (parseFloat(successRate) >= 60) {
              console.log('⚠️ PROGRESS: Good improvement, approaching target rate');
            } else {
              console.log('❌ NEEDS WORK: Still below target, additional fixes needed');
            }
            
            // Show document preview
            console.log('\n📄 DOCUMENT PREVIEW (first 500 chars):');
            console.log('─'.repeat(50));
            console.log(text.substring(0, 500) + '...');
            
            // Clean up
            fs.unlinkSync(tempPath);
            
            return {
              successRate: parseFloat(successRate),
              mappedFields,
              totalFields,
              improvement: improvement,
              targetAchieved: parseFloat(successRate) >= 80
            };
            
          } else {
            console.log('❌ Failed to download document for analysis');
          }
        } else {
          console.log('❌ Failed to get download URL:', downloadResult.data.error);
        }
      }
    } else {
      console.log('❌ Document generation failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

async function main() {
  const result = await testEnhancedFieldMapping();
  
  console.log('\n🎯 TEST SUMMARY');
  console.log('═'.repeat(20));
  
  if (result) {
    if (result.targetAchieved) {
      console.log('🎉 PRIORITY FIX SUCCESSFUL!');
      console.log(`✅ Achieved ${result.successRate}% field mapping success rate`);
      console.log(`✅ Target of 80-90% field mapping rate: ACHIEVED`);
    } else {
      console.log('⚠️ PRIORITY FIX PARTIALLY SUCCESSFUL');
      console.log(`📈 Improved from 25% to ${result.successRate}% (+${result.improvement.toFixed(1)}%)`);
      console.log(`🎯 Target of 80-90% field mapping rate: ${80 - result.successRate}% away`);
    }
  } else {
    console.log('❌ PRIORITY FIX TESTING FAILED');
    console.log('❌ Unable to verify field mapping improvements');
  }
}

// Add fetch for Node.js if needed
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

main().catch(error => {
  console.error('❌ Script error:', error);
});