/**
 * Simple script to check what's in the intake document
 * Uses the same Firebase config as the Next.js app
 */

// Import Firebase client SDK (same as frontend uses)
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, collection, query, where, getDocs } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBnSj0MBWUZUcSHQ7sMZZfRcCZJxRbg0j4",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "428899894545",
  appId: "1:428899894545:web:bde1eac67e83cc6e2d4c1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkIntakeData() {
  const intakeId = 'WhilgLHSiGPRWKAoFwQ3';
  
  console.log('\n🔍 ===================================================================');
  console.log('🔍 CHECKING INTAKE DATA IN FIRESTORE');
  console.log('🔍 ===================================================================\n');
  console.log(`📋 Intake ID: ${intakeId}\n`);
  
  try {
    // Get the intake document
    const intakeRef = doc(db, 'intakes', intakeId);
    const intakeSnap = await getDoc(intakeRef);
    
    if (!intakeSnap.exists()) {
      console.log('❌ ERROR: Intake document not found!');
      console.log('   This intake ID does not exist in Firestore.\n');
      return;
    }
    
    const intake = intakeSnap.data();
    
    console.log('✅ Intake document found!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('INTAKE DOCUMENT DATA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`Service ID: ${intake.serviceId || 'N/A'}`);
    console.log(`Service Name: ${intake.serviceName || 'N/A'}`);
    console.log(`Status: ${intake.status || 'N/A'}`);
    console.log(`Link Token: ${intake.linkToken || 'N/A'}`);
    console.log(`Client Name: ${intake.clientName || 'N/A'}`);
    console.log(`Client Email: ${intake.clientEmail || 'N/A'}`);
    
    // Check if createdAt exists
    if (intake.createdAt) {
      const createdDate = intake.createdAt.toDate ? intake.createdAt.toDate() : new Date(intake.createdAt.seconds * 1000);
      console.log(`Created At: ${createdDate}`);
    }
    
    // Check if submittedAt exists
    if (intake.submittedAt) {
      const submittedDate = intake.submittedAt.toDate ? intake.submittedAt.toDate() : new Date(intake.submittedAt.seconds * 1000);
      console.log(`Submitted At: ${submittedDate}`);
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('CLIENT DATA FIELD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!intake.clientData) {
      console.log('❌ CRITICAL: clientData field is MISSING!');
      console.log('   The form data was not saved to Firestore.\n');
      console.log('💡 This means the issue is in the submission flow:');
      console.log('   → Check: functions/src/services/intakeManager.ts');
      console.log('   → Check: src/app/api/intake/[token]/submit/route.ts\n');
      return;
    }
    
    if (typeof intake.clientData !== 'object') {
      console.log(`❌ CRITICAL: clientData is not an object! Type: ${typeof intake.clientData}\n`);
      return;
    }
    
    const fields = Object.keys(intake.clientData);
    
    if (fields.length === 0) {
      console.log('❌ CRITICAL: clientData is an empty object {}');
      console.log('   The form exists but contains no fields.\n');
      console.log('💡 This means the form data is not being collected properly:');
      console.log('   → Check: Frontend form field collection');
      console.log('   → Check: FormData serialization\n');
      return;
    }
    
    console.log(`✅ clientData has ${fields.length} fields\n`);
    
    // Analyze field naming
    const snakeCase = fields.filter(f => f.includes('_'));
    const camelCase = fields.filter(f => /[A-Z]/.test(f) && !f.includes('_'));
    const lowercase = fields.filter(f => !f.includes('_') && !/[A-Z]/.test(f));
    
    console.log('📊 Field Naming Analysis:');
    console.log(`   snake_case: ${snakeCase.length} fields`);
    console.log(`   camelCase: ${camelCase.length} fields`);
    console.log(`   lowercase: ${lowercase.length} fields\n`);
    
    if (camelCase.length > 0 && snakeCase.length === 0) {
      console.log('🎯 DIAGNOSIS: Field Name Mismatch (HIGH CONFIDENCE)');
      console.log('   All fields are camelCase, but templates expect snake_case.\n');
    }
    
    // Show all fields and values
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ALL CLIENT DATA FIELDS & VALUES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (const [key, value] of Object.entries(intake.clientData)) {
      const displayValue = typeof value === 'string' && value.length > 80 
        ? value.substring(0, 80) + '...'
        : value;
      
      const namingStyle = key.includes('_') ? '[snake_case]' : /[A-Z]/.test(key) ? '[camelCase]' : '[lowercase]';
      const isEmpty = !value || value === '';
      
      if (isEmpty) {
        console.log(`   ⚠️  ${key} ${namingStyle}: (empty)`);
      } else {
        console.log(`   ✅ ${key} ${namingStyle}: "${displayValue}"`);
      }
    }
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('FULL JSON (for copying)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(JSON.stringify(intake.clientData, null, 2));
    
    // Check generated documents
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('GENERATED DOCUMENTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const artifactsQuery = query(
      collection(db, 'documentArtifacts'),
      where('intakeId', '==', intakeId)
    );
    
    const artifactsSnap = await getDocs(artifactsQuery);
    
    if (artifactsSnap.empty) {
      console.log('⚠️  No documents generated yet\n');
    } else {
      console.log(`✅ Found ${artifactsSnap.size} document(s):\n`);
      
      artifactsSnap.forEach(docSnap => {
        const artifact = docSnap.data();
        console.log(`   📄 ${artifact.fileName || 'Untitled'}`);
        console.log(`      Status: ${artifact.status || 'N/A'}`);
        console.log(`      Template: ${artifact.templateName || 'N/A'}`);
        console.log(`      URL: ${artifact.fileUrl || 'N/A'}`);
        console.log();
      });
    }
    
    // Summary and recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('DIAGNOSIS & RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (camelCase.length > 0 && snakeCase.length === 0) {
      console.log('🎯 ROOT CAUSE: Field Name Format Mismatch');
      console.log('   Confidence: HIGH (95%)\n');
      console.log('🔍 Problem:');
      console.log('   • Form submits fields in camelCase (e.g., "trustName")');
      console.log('   • Templates expect fields in snake_case (e.g., "trust_name")');
      console.log('   • AI cannot match camelCase to snake_case placeholders\n');
      console.log('✅ Solution: Add field normalization');
      console.log('   See DIAGNOSIS_INTAKE_DATA_FLOW.md for implementation steps\n');
      console.log('⏱️  Estimated fix time: 30 minutes');
      console.log('📋 Priority: P0 CRITICAL\n');
    } else if (fields.length === 0) {
      console.log('🎯 ROOT CAUSE: No Form Data Collected');
      console.log('   Confidence: HIGH\n');
      console.log('   Fix frontend form data collection\n');
    } else {
      console.log('✅ Data structure looks correct');
      console.log('   Issue may be in AI generation or template format\n');
    }
    
    console.log('✅ Analysis complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nFull error:', error);
  }
}

// Run the check
checkIntakeData()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
