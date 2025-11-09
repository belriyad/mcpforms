// Create a test user in Firebase
const admin = require('firebase-admin');
const serviceAccount = require('./formgenai-4545-firebase-adminsdk.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'formgenai-4545'
  });
}

async function createTestUser() {
  try {
    const auth = admin.auth();
    const db = admin.firestore();

    // Create user in Firebase Auth
    let user;
    try {
      user = await auth.createUser({
        email: 'admin@test.com',
        password: 'password123',
        displayName: 'Admin User'
      });
      console.log('✅ Created Firebase Auth user:', user.uid);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log('ℹ️  User already exists in Firebase Auth');
        const userRecord = await auth.getUserByEmail('admin@test.com');
        user = userRecord;
        console.log('✅ Found existing user:', user.uid);
      } else {
        throw error;
      }
    }

    // Create user profile in Firestore
    const userProfile = {
      uid: user.uid,
      email: 'admin@test.com',
      displayName: 'Admin User',
      role: 'admin',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await db.collection('users').doc(user.uid).set(userProfile, { merge: true });
    console.log('✅ Created/Updated Firestore user profile');

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ TEST USER READY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    admin@test.com');
    console.log('Password: password123');
    console.log('Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser().then(() => process.exit(0));
