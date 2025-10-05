const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWrEGHvJBw_VqHFqNO7c9Kc4T9qx8iXRY",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.appspot.com",
  messagingSenderId: "794117654871",
  appId: "1:794117654871:web:2b6g4pq9r7x1s3t2v5w8"
};

async function testEnhancedFieldMapping() {
  try {
    console.log('🧪 TESTING ENHANCED FIELD MAPPING WITH COMPREHENSIVE LOGGING\n');
    console.log('═'.repeat(60));
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    const intakeId = '8e57b9f0-62e9-4fe7-a237-77a08ccde5d9';
    
    console.log('📋 Test Parameters:');
    console.log(`   • Intake ID: ${intakeId}`);
    console.log('   • Enhanced logging: ENABLED');
    console.log('   • Field mapping rules: EXPANDED');
    console.log('   • Client data tracking: ACTIVE');
    
    console.log('\n🔧 Regenerating document with ENHANCED field mapping...');
    
    const generateDocuments = httpsCallable(functions, 'generateDocumentsFromIntake');
    const result = await generateDocuments({ 
      intakeId: intakeId,
      regenerate: true
    });
    
    if (result.data.success) {
      console.log('✅ Document generation completed!');
      console.log('📄 Generated artifacts:', result.data.data.artifactIds);
      
      const newArtifactId = result.data.data.artifactIds[0];
      console.log(`\n🔗 NEW ENHANCED DOCUMENT LINK:`);
      console.log(`https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument/${newArtifactId}`);
      
      console.log('\n📊 WHAT THE ENHANCED LOGGING WILL SHOW:');
      console.log('   • Full client data structure');
      console.log('   • Each field mapping attempt');
      console.log('   • Exact values being used for replacement');
      console.log('   • Success/failure reasons for each field');
      
      // Save the artifact ID for verification
      require('fs').writeFileSync('latest-artifact-id.txt', newArtifactId);
      console.log(`\n💾 Saved artifact ID to latest-artifact-id.txt`);
      
      console.log('\n📥 Next steps:');
      console.log('   1. Check Firebase logs for detailed field mapping debug info');
      console.log('   2. Download and verify the new document contains client data');
      console.log('   3. Compare with previous blank document results');
      
    } else {
      console.log('❌ Document generation failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Run the test
testEnhancedFieldMapping();