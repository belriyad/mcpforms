const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWrEGHvJBw_VqHFqNO7c9Kc4T9qx8iXRY",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.appspot.com",
  messagingSenderId: "794117654871",
  appId: "1:794117654871:web:2b6g4pq9r7x1s3t2v5w8"
};

async function debugClientData() {
  try {
    console.log('🔍 DEBUGGING CLIENT DATA AVAILABILITY\n');
    console.log('═'.repeat(60));
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Get the intake document
    const intakeId = '8e57b9f0-62e9-4fe7-a237-77a08ccde5d9';
    const intakeRef = doc(db, 'intakes', intakeId);
    const intakeSnap = await getDoc(intakeRef);
    
    if (!intakeSnap.exists()) {
      console.log('❌ Intake document not found!');
      return;
    }
    
    const intakeData = intakeSnap.data();
    console.log('📋 FULL INTAKE DOCUMENT:');
    console.log(JSON.stringify(intakeData, null, 2));
    
    console.log('\n🔍 CLIENT DATA SPECIFICALLY:');
    if (intakeData.clientData) {
      console.log('✅ clientData field exists:');
      console.log(JSON.stringify(intakeData.clientData, null, 2));
      
      console.log('\n📊 CLIENT DATA ANALYSIS:');
      console.log(`   • Keys: ${Object.keys(intakeData.clientData).length}`);
      console.log(`   • Keys: [${Object.keys(intakeData.clientData).join(', ')}]`);
      
      // Check for specific expected fields
      const expectedFields = [
        'fullName', 'trusteeName', 'email', 'phone', 
        'documentDate', 'propertyAddress', 'companyName'
      ];
      
      console.log('\n🎯 EXPECTED FIELD CHECK:');
      for (const field of expectedFields) {
        const value = intakeData.clientData[field];
        if (value) {
          console.log(`   ✅ ${field}: "${value}"`);
        } else {
          console.log(`   ❌ ${field}: missing`);
        }
      }
    } else {
      console.log('❌ No clientData field found!');
    }
    
    // Also check formData if it exists
    if (intakeData.formData) {
      console.log('\n📝 FORM DATA (alternative):');
      console.log(JSON.stringify(intakeData.formData, null, 2));
    }
    
    // Check the most recent document artifact
    console.log('\n📄 CHECKING RECENT DOCUMENT ARTIFACT:');
    const artifactId = '57e0a1db-6cd0-46a5-b991-f127218aa98d';
    const artifactRef = doc(db, 'documentArtifacts', artifactId);
    const artifactSnap = await getDoc(artifactRef);
    
    if (artifactSnap.exists()) {
      const artifactData = artifactSnap.data();
      console.log('✅ Document artifact found:');
      console.log(`   • Status: ${artifactData.status}`);
      console.log(`   • File Name: ${artifactData.fileName}`);
      console.log(`   • Generated At: ${artifactData.generatedAt?.toDate?.() || artifactData.generatedAt}`);
    }
    
  } catch (error) {
    console.error('❌ Error debugging client data:', error);
  }
}

// Run the debug
debugClientData();