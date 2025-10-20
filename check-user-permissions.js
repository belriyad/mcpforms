const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID || 'formgenai-4545',
  clientEmail: process.env.ADMIN_CLIENT_EMAIL,
  privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAndUpdateUser() {
  try {
    const email = 'belal.riyad@gmail.com';
    
    // Find user by email
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found in Firestore with email:', email);
      
      // Try to find by Auth
      const userRecord = await admin.auth().getUserByEmail(email);
      console.log('\n✅ Found in Firebase Auth:');
      console.log('UID:', userRecord.uid);
      console.log('Email:', userRecord.email);
      console.log('Display Name:', userRecord.displayName);
      
      console.log('\n📝 Creating Firestore profile with admin permissions...');
      
      await db.collection('users').doc(userRecord.uid).set({
        email: userRecord.email,
        displayName: userRecord.displayName || 'Admin User',
        role: 'admin',
        permissions: {
          canManageUsers: true,
          canManageTemplates: true,
          canManageServices: true,
          canManageIntakes: true,
          canGenerateDocuments: true,
          canViewReports: true,
          canManageSettings: true,
          canAccessAPI: true,
          isAdmin: true
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log('✅ Admin profile created successfully!');
      return;
    }
    
    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();
    
    console.log('\n📋 Current User Data:');
    console.log('UID:', userDoc.id);
    console.log('Email:', userData.email);
    console.log('Role:', userData.role || 'none');
    console.log('Permissions:', JSON.stringify(userData.permissions || {}, null, 2));
    
    // Update to admin with full permissions
    console.log('\n🔧 Updating to admin with full permissions...');
    
    await db.collection('users').doc(userDoc.id).update({
      role: 'admin',
      permissions: {
        canManageUsers: true,
        canManageTemplates: true,
        canManageServices: true,
        canManageIntakes: true,
        canGenerateDocuments: true,
        canViewReports: true,
        canManageSettings: true,
        canAccessAPI: true,
        isAdmin: true
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('✅ User updated to admin successfully!');
    
    // Verify
    const updatedDoc = await db.collection('users').doc(userDoc.id).get();
    const updatedData = updatedDoc.data();
    
    console.log('\n✅ Updated Permissions:');
    console.log('Role:', updatedData.role);
    console.log('Permissions:', JSON.stringify(updatedData.permissions, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

checkAndUpdateUser();
