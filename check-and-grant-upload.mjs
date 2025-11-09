import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkAndGrantUploadPermission() {
  try {
    console.log('\n=== Checking Upload Permissions ===\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const hasPermission = userData.permissions?.canUploadTemplates === true;
      
      console.log(`User: ${userData.email || doc.id}`);
      console.log(`UID: ${doc.id}`);
      console.log(`canUploadTemplates: ${hasPermission ? '✅ YES' : '❌ NO'}`);
      
      // Grant permission if missing
      if (!hasPermission) {
        console.log(`   → Granting canUploadTemplates...`);
        await doc.ref.update({
          'permissions.canUploadTemplates': true
        });
        console.log(`   ✅ Permission granted!`);
      }
      console.log('---');
    }
    
    console.log('\n✅ All users now have upload permissions!\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkAndGrantUploadPermission();
