// Debug client data for a specific intake
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('./functions/service-account-key.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
  projectId: 'formgenai-4545'
});

const db = getFirestore();

async function debugClientData() {
  try {
    // Get the latest intake
    const intakesSnapshot = await db.collection('intakes')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (intakesSnapshot.empty) {
      console.log('No intakes found');
      return;
    }

    const intakeDoc = intakesSnapshot.docs[0];
    const intakeData = intakeDoc.data();
    
    console.log('🔍 INTAKE ID:', intakeDoc.id);
    console.log('🔍 CLIENT DATA KEYS:', Object.keys(intakeData.clientData || {}));
    console.log('🔍 CLIENT DATA VALUES:');
    
    for (const [key, value] of Object.entries(intakeData.clientData || {})) {
      console.log(`   ${key}: "${value}"`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugClientData();