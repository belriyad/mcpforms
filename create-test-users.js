const admin = require('firebase-admin');

// Initialize admin with service account
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'formgenai-4545'
});

async function createTestUsers() {
  try {
    // Create test user 1
    const user1 = await admin.auth().createUser({
      email: 'test@example.com',
      password: 'password123',
      emailVerified: true,
      displayName: 'Test User'
    });
    console.log('✅ Created user 1:', user1.uid);

    // Create test user 2
    const user2 = await admin.auth().createUser({
      email: 'briyad@gmail.com',
      password: 'testpassword123',
      emailVerified: true,
      displayName: 'Briyad Test User'
    });
    console.log('✅ Created user 2:', user2.uid);

    console.log('🎉 Test users created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    
    // If users already exist, that's fine too
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️ Users already exist, which is fine for testing');
    }
  }
  
  process.exit(0);
}

createTestUsers();