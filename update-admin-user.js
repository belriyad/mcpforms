require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID,
  clientEmail: process.env.ADMIN_CLIENT_EMAIL,
  privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

console.log('🔑 Initializing with project:', serviceAccount.projectId);
console.log('📧 Client email:', serviceAccount.clientEmail);
console.log('🔐 Private key loaded:', serviceAccount.privateKey ? 'Yes' : 'No');

if (!serviceAccount.privateKey) {
  console.error('❌ ADMIN_PRIVATE_KEY not found in environment');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateUserToAdmin() {
  try {
    const email = 'belal.riyad@gmail.com';
    console.log('\n🔍 Looking for user:', email);
    
    // Get user from Auth
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log('✅ Found in Firebase Auth:');
    console.log('   UID:', userRecord.uid);
    console.log('   Email:', userRecord.email);
    console.log('   Display Name:', userRecord.displayName || '(not set)');
    
    // Check if Firestore profile exists
    const userDoc = await db.collection('users').doc(userRecord.uid).get();
    
    const adminPermissions = {
      canManageUsers: true,
      canManageTemplates: true,
      canManageServices: true,
      canManageIntakes: true,
      canGenerateDocuments: true,
      canViewReports: true,
      canManageSettings: true,
      canAccessAPI: true,
      isAdmin: true
    };
    
    if (!userDoc.exists) {
      console.log('\n📝 Creating new Firestore profile with admin permissions...');
      
      await db.collection('users').doc(userRecord.uid).set({
        email: userRecord.email,
        displayName: userRecord.displayName || 'Admin User',
        role: 'admin',
        permissions: adminPermissions,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Admin profile created successfully!');
    } else {
      const currentData = userDoc.data();
      console.log('\n📋 Current permissions:');
      console.log('   Role:', currentData.role || 'none');
      console.log('   canManageUsers:', currentData.permissions?.canManageUsers || false);
      
      console.log('\n🔧 Updating to admin with full permissions...');
      
      await db.collection('users').doc(userRecord.uid).update({
        role: 'admin',
        permissions: adminPermissions,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ User updated to admin successfully!');
    }
    
    // Verify the update
    const finalDoc = await db.collection('users').doc(userRecord.uid).get();
    const finalData = finalDoc.data();
    
    console.log('\n✅ Final permissions for', email);
    console.log('   Role:', finalData.role);
    console.log('   Permissions:', JSON.stringify(finalData.permissions, null, 4));
    
    console.log('\n🎉 Done! User can now manage other users.');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.code) {
      console.error('   Code:', error.code);
    }
  } finally {
    process.exit(0);
  }
}

updateUserToAdmin();
