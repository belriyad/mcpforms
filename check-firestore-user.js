require('dotenv').config();
const admin = require('firebase-admin');

const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID,
  clientEmail: process.env.ADMIN_CLIENT_EMAIL,
  privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUser() {
  try {
    const uid = 'vodEJBzcX3Va3GzdiGYFwIpps6H3'; // belal.riyad@gmail.com
    
    const doc = await db.collection('users').doc(uid).get();
    
    if (!doc.exists) {
      console.log('❌ User document not found');
      return;
    }
    
    const data = doc.data();
    console.log('📄 Full Firestore document:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUser();
