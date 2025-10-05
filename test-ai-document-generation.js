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

// Use the existing test intake
const TEST_INTAKE_ID = '46ea3329-bc90-4c51-8644-2228958e7c73';

(async () => {
  try {
    console.log('🤖 TESTING AI-POWERED DOCUMENT GENERATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`🆔 Test Intake ID: ${TEST_INTAKE_ID}`);
    console.log('📋 This will use OpenAI to intelligently fill the document\n');
    console.log('⏳ Generating document with AI (this may take 30-60 seconds)...\n');

    const generateWithAI = httpsCallable(functions, 'generateDocumentsWithAI');
    
    const startTime = Date.now();
    const result = await generateWithAI({ 
      intakeId: TEST_INTAKE_ID, 
      regenerate: true 
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✅ AI Generation completed in ${duration}s\n`);
    console.log('📄 Result:', JSON.stringify(result.data, null, 2));

    if (result.data.success) {
      console.log('\n🎉 SUCCESS! AI-powered document generation complete!');
      console.log(`📁 Generated ${result.data.data.artifactIds.length} document(s)`);
      console.log(`🆔 Artifact IDs:`, result.data.data.artifactIds);
      console.log('\n💡 Next steps:');
      console.log('   1. Download the generated document from Firebase Console');
      console.log('   2. Review the document quality and formatting');
      console.log('   3. Verify all fields are correctly filled');
      console.log('   4. Compare with placeholder replacement method');
    } else {
      console.log('\n❌ FAILED:', result.data.error);
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.details) {
      console.error('Details:', error.details);
    }
  }

  process.exit(0);
})();
