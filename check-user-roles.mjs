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

async function checkAndUpdateRoles() {
  try {
    console.log('\n=== Checking User Roles ===\n');
    
    const usersSnapshot = await db.collection('users').get();
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const currentRole = userData.role || 'none';
      
      console.log(`User: ${userData.email || doc.id}`);
      console.log(`UID: ${doc.id}`);
      console.log(`Current Role: ${currentRole}`);
      
      // Grant lawyer role if missing
      if (!userData.role || userData.role === 'user') {
        console.log(`   → Setting role to 'lawyer'...`);
        await doc.ref.update({
          role: 'lawyer'
        });
        console.log(`   ✅ Role updated to lawyer!`);
      }
      console.log('---');
    }
    
    console.log('\n✅ All users now have lawyer role!\n');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkAndUpdateRoles();
