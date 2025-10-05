const admin = require('firebase-admin');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const https = require('https');

// Initialize Firebase Admin with proper credentials
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      projectId: 'formgenai-4545'
    });
  } catch (error) {
    console.log('⚠️ Firebase Admin initialization failed, using HTTP API approach instead');
    console.log('Error:', error.message);
  }
}

let db, storage;
let useHttpApi = false;

try {
  db = admin.firestore();
  storage = admin.storage();
} catch (error) {
  console.log('⚠️ Firebase Admin not available, will use HTTP API for testing');
  useHttpApi = true;
}

/**
 * Test to verify that generated documents contain the expected client data
 */
async function testDocumentDataInclusion() {
  console.log('🧪 Starting Document Data Inclusion Test...\n');
  
  try {
    // Step 1: Find a recent intake with generated documents
    console.log('1️⃣ Finding intake with generated documents...');
    const intakesSnapshot = await db.collection('intakes')
      .where('status', '==', 'documents-generated')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    
    if (intakesSnapshot.empty) {
      console.log('❌ No intakes with generated documents found');
      return false;
    }
    
    const intake = intakesSnapshot.docs[0];
    const intakeData = intake.data();
    const intakeId = intake.id;
    
    console.log(`✅ Found intake: ${intakeId}`);
    console.log('📋 Client data:', JSON.stringify(intakeData.clientData, null, 2));
    
    // Step 2: Get the generated document artifacts
    console.log('\n2️⃣ Retrieving generated document artifacts...');
    const artifactsSnapshot = await db.collection('documentArtifacts')
      .where('intakeId', '==', intakeId)
      .where('status', '==', 'generated')
      .get();
    
    if (artifactsSnapshot.empty) {
      console.log('❌ No generated document artifacts found');
      return false;
    }
    
    console.log(`✅ Found ${artifactsSnapshot.docs.length} generated documents`);
    
    let testResults = [];
    
    // Step 3: Test each generated document
    for (const artifactDoc of artifactsSnapshot.docs) {
      const artifact = artifactDoc.data();
      const artifactId = artifactDoc.id;
      
      console.log(`\n3️⃣ Testing document: ${artifact.fileName}`);
      console.log(`📁 File type: ${artifact.fileType}`);
      console.log(`🔗 File URL: ${artifact.fileUrl}`);
      
      try {
        // Download the generated document
        const file = storage.bucket().file(artifact.fileUrl);
        const [exists] = await file.exists();
        
        if (!exists) {
          console.log('❌ Document file does not exist in storage');
          testResults.push({
            artifactId,
            fileName: artifact.fileName,
            success: false,
            error: 'File not found in storage'
          });
          continue;
        }
        
        const [fileBuffer] = await file.download();
        console.log(`✅ Downloaded document (${fileBuffer.length} bytes)`);
        
        // Extract text content from the document
        let documentText = '';
        if (artifact.fileType === 'docx') {
          const result = await mammoth.extractRawText({ buffer: fileBuffer });
          documentText = result.value;
        } else if (artifact.fileType === 'pdf') {
          const result = await pdfParse(fileBuffer);
          documentText = result.text;
        } else {
          console.log('❌ Unsupported file type for text extraction');
          testResults.push({
            artifactId,
            fileName: artifact.fileName,
            success: false,
            error: 'Unsupported file type'
          });
          continue;
        }
        
        console.log(`📄 Extracted text length: ${documentText.length} characters`);
        console.log('📄 Document preview (first 200 chars):');
        console.log(documentText.substring(0, 200) + '...\n');
        
        // Step 4: Check if client data appears in the document
        const clientData = intakeData.clientData || {};
        const dataInclusionResults = {};
        let totalFields = 0;
        let fieldsFound = 0;
        
        console.log('🔍 Checking for client data in document...');
        
        for (const [fieldName, fieldValue] of Object.entries(clientData)) {
          if (!fieldValue || typeof fieldValue !== 'string') continue;
          
          totalFields++;
          const isFound = documentText.includes(fieldValue);
          dataInclusionResults[fieldName] = {
            value: fieldValue,
            found: isFound
          };
          
          if (isFound) {
            fieldsFound++;
            console.log(`✅ Found "${fieldName}": "${fieldValue}"`);
          } else {
            console.log(`❌ Missing "${fieldName}": "${fieldValue}"`);
          }
        }
        
        const successRate = totalFields > 0 ? (fieldsFound / totalFields) * 100 : 0;
        
        console.log(`\n📊 Data Inclusion Results:`);
        console.log(`   Total fields checked: ${totalFields}`);
        console.log(`   Fields found in document: ${fieldsFound}`);
        console.log(`   Success rate: ${successRate.toFixed(1)}%`);
        
        const isSuccess = fieldsFound > 0; // At least some data should be found
        
        testResults.push({
          artifactId,
          fileName: artifact.fileName,
          fileType: artifact.fileType,
          success: isSuccess,
          totalFields,
          fieldsFound,
          successRate,
          dataInclusionResults,
          documentLength: documentText.length
        });
        
        if (isSuccess) {
          console.log('✅ TEST PASSED: Document contains client data');
        } else {
          console.log('❌ TEST FAILED: No client data found in document');
        }
        
      } catch (error) {
        console.error(`❌ Error testing document ${artifact.fileName}:`, error);
        testResults.push({
          artifactId,
          fileName: artifact.fileName,
          success: false,
          error: error.message
        });
      }
    }
    
    // Step 5: Summary results
    console.log('\n📈 OVERALL TEST RESULTS:');
    console.log('=' .repeat(50));
    
    const successfulTests = testResults.filter(r => r.success);
    const overallSuccess = successfulTests.length > 0;
    
    console.log(`Total documents tested: ${testResults.length}`);
    console.log(`Successful tests: ${successfulTests.length}`);
    console.log(`Failed tests: ${testResults.length - successfulTests.length}`);
    console.log(`Overall success rate: ${((successfulTests.length / testResults.length) * 100).toFixed(1)}%`);
    
    if (overallSuccess) {
      console.log('\n🎉 OVERALL RESULT: SUCCESS - At least one document contains client data');
      
      // Show best performing document
      const bestResult = testResults.reduce((best, current) => 
        (current.successRate || 0) > (best.successRate || 0) ? current : best
      );
      
      if (bestResult.successRate) {
        console.log(`🏆 Best performing document: ${bestResult.fileName} (${bestResult.successRate.toFixed(1)}% data inclusion)`);
      }
    } else {
      console.log('\n💥 OVERALL RESULT: FAILURE - No documents contain client data');
      console.log('\n🔧 Recommended actions:');
      console.log('1. Check template parsing for insertion points');
      console.log('2. Verify document generation is using AI insertion points');
      console.log('3. Review client data field names and template content');
      console.log('4. Test with templates that have proper placeholders');
    }
    
    // Save test results to a file for analysis
    const testResultsFile = {
      timestamp: new Date().toISOString(),
      intakeId,
      clientData: intakeData.clientData,
      testResults,
      overallSuccess,
      summary: {
        totalDocuments: testResults.length,
        successfulTests: successfulTests.length,
        overallSuccessRate: ((successfulTests.length / testResults.length) * 100)
      }
    };
    
    console.log('\n💾 Test results saved for analysis');
    console.log('Raw results:', JSON.stringify(testResultsFile, null, 2));
    
    return overallSuccess;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    return false;
  }
}

// Helper function to run the test
async function runTest() {
  console.log('🚀 Document Data Inclusion Test Started');
  console.log('====================================\n');
  
  const success = await testDocumentDataInclusion();
  
  console.log('\n====================================');
  console.log(`🏁 Test Completed: ${success ? 'SUCCESS' : 'FAILURE'}`);
  
  process.exit(success ? 0 : 1);
}

// Run the test if this file is executed directly
if (require.main === module) {
  runTest().catch(error => {
    console.error('Fatal test error:', error);
    process.exit(1);
  });
}

module.exports = { testDocumentDataInclusion };