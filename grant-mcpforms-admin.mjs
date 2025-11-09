import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

console.log('🔧 Initializing Firebase Admin...');
console.log(`   Project ID: ${serviceAccount.projectId}`);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();
const userId = 'DHy0WR78GZV6LJS6IIfahggoDJQ2';

async function grantMCPFormsAdminPermissions() {
  try {
    console.log(`\n🔍 Looking up MCPForms user: ${userId}\n`);
    
    // Check current user document
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('✅ User found in Firestore:');
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log('⚠️  User not found in Firestore - will create profile');
    }
    
    // Define full MCPForms admin permissions
    const fullAdminPermissions = {
      role: 'admin',
      isAdmin: true,
      permissions: {
        // Template Management
        canCreateTemplates: true,
        canEditTemplates: true,
        canDeleteTemplates: true,
        canViewTemplates: true,
        canUploadTemplates: true,
        
        // Service Management
        canCreateServices: true,
        canEditServices: true,
        canDeleteServices: true,
        canViewServices: true,
        
        // Intake Management
        canViewIntakes: true,
        canEditIntakes: true,
        canDeleteIntakes: true,
        canCustomizeIntakes: true,
        canSendIntakes: true,
        
        // Document Management
        canGenerateDocuments: true,
        canViewDocuments: true,
        canEditDocuments: true,
        canDeleteDocuments: true,
        canDownloadDocuments: true,
        
        // AI Features
        canUseAI: true,
        canGenerateAISections: true,
        canEditAISections: true,
        canAcceptAISections: true,
        canRegenerateAI: true,
        
        // User Management
        canManageUsers: true,
        canInviteUsers: true,
        canEditUserRoles: true,
        canDeleteUsers: true,
        canViewUsers: true,
        
        // Settings & Configuration
        canManageSettings: true,
        canManageBranding: true,
        canEditBranding: true,
        canUploadLogo: true,
        
        // Analytics & Reporting
        canViewAnalytics: true,
        canViewActivityLog: true,
        canExportData: true,
        canViewMetrics: true,
        
        // Advanced Features
        canAccessLabs: true,
        canManagePrompts: true,
        canEditPrompts: true,
        canDeletePrompts: true,
        canManageIntegrations: true,
        
        // System Features
        canViewAllData: true,
        canManageSystem: true,
        canAccessAdminPanel: true
      },
      updatedAt: new Date().toISOString(),
      updatedBy: 'system-admin-grant'
    };
    
    // Preserve existing user data (email, displayName, etc.)
    const existingData = userDoc.exists ? userDoc.data() : {};
    const updatedData = {
      ...existingData,
      ...fullAdminPermissions,
      email: existingData.email || 'admin@mcpforms.com',
      displayName: existingData.displayName || 'MCPForms Admin'
    };
    
    // Update Firestore document
    await userRef.set(updatedData, { merge: true });
    
    console.log('\n✅ FULL ADMIN PERMISSIONS GRANTED!\n');
    console.log('📋 Updated User Profile:');
    console.log(JSON.stringify(updatedData, null, 2));
    
    // Verify the update
    const verifyDoc = await userRef.get();
    console.log('\n✅ Verification - User Document Updated Successfully!');
    console.log(`   Role: ${verifyDoc.data().role}`);
    console.log(`   Is Admin: ${verifyDoc.data().isAdmin}`);
    console.log(`   Total Permissions: ${Object.keys(verifyDoc.data().permissions || {}).length}`);
    
    console.log('\n🎉 SUCCESS! User now has all MCPForms admin permissions!');
    console.log('\n📝 Permissions Summary:');
    console.log('   ✅ Can upload and manage templates');
    console.log('   ✅ Can create and manage services');
    console.log('   ✅ Can manage intakes and documents');
    console.log('   ✅ Can use all AI features');
    console.log('   ✅ Can manage users and settings');
    console.log('   ✅ Can view analytics and logs');
    console.log('   ✅ Full system access');
    console.log('\n⚠️  User may need to refresh the page for changes to take effect.\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

grantMCPFormsAdminPermissions();
