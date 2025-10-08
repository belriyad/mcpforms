const admin = require('firebase-admin');

admin.initializeApp({
  projectId: 'formgenai-4545'
});

const db = admin.firestore();

async function checkService() {
  const serviceId = 'w9rq4zgEiihA17ZNjhSg';
  
  console.log('🔍 Checking service:', serviceId);
  console.log('');
  
  try {
    const serviceRef = db.collection('services').doc(serviceId);
    const doc = await serviceRef.get();
    
    if (!doc.exists) {
      console.log('❌ Service not found!');
      process.exit(1);
    }
    
    const data = doc.data();
    
    console.log('📦 Service Details:');
    console.log('  Name:', data.name || 'Unnamed');
    console.log('  Created By:', data.createdBy || '❌ MISSING');
    console.log('  Created At:', data.createdAt ? data.createdAt.toDate() : 'Unknown');
    console.log('');
    
    if (!data.createdBy) {
      console.log('⚠️  This service is missing the createdBy field!');
      console.log('✅ Security rules should allow access (migration mode)');
      console.log('');
      console.log('🔧 To fix: Run the migration tool at /migrate.html');
    } else {
      console.log('ℹ️  This service has an owner:', data.createdBy);
      console.log('');
      console.log('To access this service, you must be logged in as this user.');
      console.log('Or update the createdBy field to your user ID.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkService();
