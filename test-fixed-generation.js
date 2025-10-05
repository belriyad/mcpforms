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

async function testFixedDocumentGeneration() {
  try {
    console.log('🧪 TESTING FIXED DOCUMENT GENERATION\n');
    console.log('═'.repeat(60));
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app);
    
    // Use the most recent intake ID
    const intakeId = '8e57b9f0-62e9-4fe7-a237-77a08ccde5d9';
    
    console.log('📋 Test Parameters:');
    console.log(`   • Intake ID: ${intakeId}`);
    console.log('   • Expected Client Data:');
    console.log('     - fullName: "belal B Tech Global LLC riyad"');
    console.log('     - trusteeName: "Belal Riyad"');
    console.log('     - email: "belal@btechglobal.com"');
    console.log('     - documentDate: "2024-10-04"');
    console.log('     - propertyAddress: "123 Main St, City, State 12345"');
    
    console.log('\n🔧 Regenerating document with FIXED replacement logic...');
    
    // Call the generateDocumentsFromIntake function
    const generateDocuments = httpsCallable(functions, 'generateDocumentsFromIntake');
    const result = await generateDocuments({ 
      intakeId: intakeId,
      regenerate: true  // This will delete old documents and create new ones
    });
    
    if (result.data.success) {
      console.log('✅ Document generation completed successfully!');
      console.log('📄 Generated artifacts:', result.data.data.artifactIds);
      
      // Get the first artifact ID for download
      const newArtifactId = result.data.data.artifactIds[0];
      console.log(`\n🔗 NEW DOWNLOAD LINK:`);
      console.log(`https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument/${newArtifactId}`);
      
      console.log('\n✨ EXPECTED IMPROVEMENTS:');
      console.log('   • " Grantor\'s name" should now show: "belal B Tech Global LLC riyad"');
      console.log('   • " Identify Successor trustees" should show: "Belal Riyad"');
      console.log('   • " Date of Birth" should show: "2024-10-04"');
      console.log('   • Other quoted placeholders should be filled');
      
      console.log('\n📥 Download the new document and search for "belal" to verify the fix!');
      
    } else {
      console.log('❌ Document generation failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Run the test
testFixedDocumentGeneration();