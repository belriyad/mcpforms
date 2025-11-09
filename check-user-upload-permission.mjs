import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUploadPermission() {
  try {
    // Get current user (you might need to provide your UID)
    const usersSnapshot = await db.collection('users').limit(5).get();
    
    console.log('\n=== User Upload Permissions ===\n');
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const hasPermission = userData.permissions?.canUploadTemplates === true;
      
      console.log(`User: ${userData.email || doc.id}`);
      console.log(`UID: ${doc.id}`);
      console.log(`canUploadTemplates: ${hasPermission ? '✅ YES' : '❌ NO'}`);
      console.log(`Total Permissions: ${userData.permissions ? Object.keys(userData.permissions).length : 0}`);
      console.log('---');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkUploadPermission();
