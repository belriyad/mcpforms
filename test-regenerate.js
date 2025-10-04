// Initialize Firebase Admin
const admin = require('firebase-admin');

// Use service account key or default credentials
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'formgenai-4545'
  });
}

const db = admin.firestore();

async function testRegenerate() {
  try {
    console.log('🔄 Testing document regeneration...');
    
    // Find an intake with documents-generated status
    const intakesSnapshot = await db.collection('intakes')
      .where('status', '==', 'documents-generated')
      .limit(1)
      .get();
    
    if (intakesSnapshot.empty) {
      console.log('❌ No intakes with documents-generated status found');
      return;
    }
    
    const intake = intakesSnapshot.docs[0];
    const intakeId = intake.id;
    const intakeData = intake.data();
    
    console.log('📋 Found intake:', intakeId);
    console.log('📋 Intake data keys:', Object.keys(intakeData.clientData || {}));
    console.log('📋 Client data:', JSON.stringify(intakeData.clientData, null, 2));
    
    console.log('🚀 Calling generateDocumentsFromIntake with regenerate=true...');
    
    // Make an HTTP request to the Cloud Function
    const fetch = require('node-fetch');
    
    const response = await fetch('https://us-central1-formgenai-4545.cloudfunctions.net/generateDocumentsFromIntake', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: {
          intakeId: intakeId,
          regenerate: true
        }
      })
    });
    
    const result = await response.json();
    console.log('✅ Function result:', result);
    
    // Wait a moment then check logs
    console.log('⏳ Waiting 5 seconds for logs to populate...');
    setTimeout(() => {
      console.log('✅ Check Firebase logs now with: firebase functions:log');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error testing regenerate:', error);
  }
}

testRegenerate();