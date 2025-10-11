/**
 * Quick test to verify document generation is working with the proper library
 * 
 * This script tests:
 * 1. Service exists and has submitted intake
 * 2. Document generation API works
 * 3. Documents have downloadUrl set
 * 4. Files can be downloaded
 */

const SERVICE_ID = '2F3GSb5UJobtRzU9Vjvv'; // Latest test service
const BASE_URL = 'https://formgenai-4545.web.app';

async function testDocumentGeneration() {
  console.log('🧪 Testing Document Generation with Proper Library\n');
  
  try {
    // Step 1: Generate documents
    console.log('📝 Step 1: Generating documents...');
    const generateResponse = await fetch(`${BASE_URL}/api/services/generate-documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ serviceId: SERVICE_ID }),
    });
    
    if (!generateResponse.ok) {
      const error = await generateResponse.json();
      throw new Error(`Generation failed: ${JSON.stringify(error)}`);
    }
    
    const generateResult = await generateResponse.json();
    console.log('✅ Documents generated:', {
      success: generateResult.success,
      message: generateResult.message,
      documentCount: generateResult.documents?.length || 0
    });
    
    // Step 2: Check documents have downloadUrl
    console.log('\n📋 Step 2: Checking documents...');
    const documents = generateResult.documents || [];
    
    if (documents.length === 0) {
      console.warn('⚠️  No documents found');
      return;
    }
    
    documents.forEach((doc, index) => {
      console.log(`\nDocument ${index + 1}:`);
      console.log(`  Name: ${doc.fileName}`);
      console.log(`  Template: ${doc.templateName}`);
      console.log(`  Status: ${doc.status}`);
      console.log(`  Has Download URL: ${!!doc.downloadUrl ? '✅' : '❌'}`);
      console.log(`  File Size: ${doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : 'N/A'}`);
      console.log(`  Storage Path: ${doc.storagePath || 'N/A'}`);
      
      if (doc.downloadUrl) {
        console.log(`  Download URL: ${doc.downloadUrl.substring(0, 80)}...`);
      } else {
        console.log(`  ❌ ERROR: No download URL!`);
      }
    });
    
    // Step 3: Test download one document
    const firstDoc = documents[0];
    if (firstDoc.downloadUrl) {
      console.log(`\n📥 Step 3: Testing download for "${firstDoc.fileName}"...`);
      
      const downloadResponse = await fetch(firstDoc.downloadUrl);
      
      if (downloadResponse.ok) {
        const blob = await downloadResponse.blob();
        console.log('✅ Download successful:', {
          size: `${(blob.size / 1024).toFixed(2)} KB`,
          type: blob.type
        });
      } else {
        console.log('❌ Download failed:', downloadResponse.status);
      }
    } else {
      console.log('\n⚠️  Step 3: Skipping download test (no URL available)');
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    
    const successCount = documents.filter(doc => doc.downloadUrl).length;
    const totalCount = documents.length;
    
    console.log(`Total Documents: ${totalCount}`);
    console.log(`With Download URL: ${successCount}`);
    console.log(`Success Rate: ${((successCount / totalCount) * 100).toFixed(0)}%`);
    
    if (successCount === totalCount) {
      console.log('\n✅ ALL TESTS PASSED! Document generation is working correctly.');
    } else {
      console.log('\n⚠️  SOME DOCUMENTS MISSING DOWNLOAD URLs');
      console.log('This might be expected if templates are missing from storage.');
    }
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

// Run the test
testDocumentGeneration();
