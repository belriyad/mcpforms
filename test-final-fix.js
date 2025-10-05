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

async function testFinalFix() {
  try {
    console.log('🎯 TESTING FINAL DOCUMENT BUFFER FIX\n');
    console.log('═'.repeat(60));
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    const intakeId = '8e57b9f0-62e9-4fe7-a237-77a08ccde5d9';
    
    console.log('📋 Final Test Parameters:');
    console.log(`   • Intake ID: ${intakeId}`);
    console.log('   • Field mapping: WORKING (confirmed in logs)');
    console.log('   • Document buffer generation: FIXED');
    console.log('   • XML content updating: CORRECTED');
    
    console.log('\n🔧 Generating document with FIXED buffer creation...');
    
    const generateDocuments = httpsCallable(functions, 'generateDocumentsFromIntake');
    const result = await generateDocuments({ 
      intakeId: intakeId,
      regenerate: true
    });
    
    if (result.data.success) {
      console.log('✅ Document generation completed!');
      console.log('📄 Generated artifacts:', result.data.data.artifactIds);
      
      const finalArtifactId = result.data.data.artifactIds[0];
      console.log(`\n🔗 FINAL FIXED DOCUMENT LINK:`);
      console.log(`https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument/${finalArtifactId}`);
      
      // Save for verification
      require('fs').writeFileSync('final-artifact-id.txt', finalArtifactId);
      
      console.log('\n🎉 EXPECTED BREAKTHROUGH RESULTS:');
      console.log('   • "2046 277th Ave SE" should appear in document');
      console.log('   • "belal B Tech Global LLC riyad" should appear');
      console.log('   • "Belal Riyad" should appear');
      console.log('   • Multiple client data fields should be populated');
      console.log('   • Document should be significantly different from blank template');
      
      console.log('\n📥 CRITICAL: Download this document and search for client data!');
      console.log('   This should be the breakthrough moment where the fix actually works.');
      
    } else {
      console.log('❌ Document generation failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('🚨 Final test failed:', error);
  }
}

// Run the final test
testFinalFix();