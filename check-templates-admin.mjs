import admin from 'firebase-admin';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const projectId = process.env.ADMIN_PROJECT_ID;
const clientEmail = process.env.ADMIN_CLIENT_EMAIL;
const privateKey = process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error('❌ Missing Firebase Admin credentials in .env file');
  console.error('   Required: ADMIN_PROJECT_ID, ADMIN_CLIENT_EMAIL, ADMIN_PRIVATE_KEY');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = admin.firestore();

console.log('🔍 Checking templates in Firestore...\n');
console.log('📊 Project:', projectId);
console.log('');

try {
  // Check ALL templates
  const allTemplatesSnapshot = await db.collection('templates').get();
  
  console.log(`📊 Total templates in database: ${allTemplatesSnapshot.size}\n`);
  
  if (allTemplatesSnapshot.empty) {
    console.log('❌ NO TEMPLATES FOUND IN DATABASE');
    console.log('   This means no templates have been uploaded yet.');
    console.log('');
    console.log('🔧 SOLUTION:');
    console.log('   1. Login to: https://formgenai-4545.web.app/login');
    console.log('   2. Email: belal.riyad@gmail.com');
    console.log('   3. Password: 9920032');
    console.log('   4. Go to Admin → Templates');
    console.log('   5. Upload a .docx file with {{placeholders}}');
    console.log('   6. Wait for "Parsed" status (~30-60 seconds)');
    console.log('');
  } else {
    console.log('📄 TEMPLATES FOUND:\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    allTemplatesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`📄 Template ID: ${doc.id}`);
      console.log(`   Name: ${data.name || 'N/A'}`);
      console.log(`   Status: ${data.status || 'N/A'}`);
      console.log(`   Created By: ${data.createdBy || 'N/A'}`);
      console.log(`   Created At: ${data.createdAt?.toDate?.() || 'N/A'}`);
      console.log(`   File Path: ${data.filePath || 'N/A'}`);
      console.log('');
    });
    
    console.log('═══════════════════════════════════════════════════════════════\n');
  }
  
  // Now check for test user
  console.log('🔐 CHECKING TEST USER...\n');
  
  const testEmail = 'belal.riyad@gmail.com';
  console.log(`Looking for user: ${testEmail}`);
  
  // Get user from Firebase Auth
  try {
    const userRecord = await admin.auth().getUserByEmail(testEmail);
    console.log(`✅ User found!`);
    console.log(`   UID: ${userRecord.uid}`);
    console.log('');
    
    // Now check templates for this specific user
    const userTemplatesSnapshot = await db.collection('templates')
      .where('createdBy', '==', userRecord.uid)
      .get();
    
    console.log(`📊 Templates owned by ${testEmail}: ${userTemplatesSnapshot.size}\n`);
    
    if (userTemplatesSnapshot.empty) {
      console.log('❌ NO TEMPLATES FOUND FOR TEST USER');
      console.log('');
      console.log('🔍 DIAGNOSIS:');
      if (allTemplatesSnapshot.size > 0) {
        console.log('   - Templates exist in database');
        console.log('   - BUT none are owned by test user');
        console.log('   - Template(s) uploaded by different account');
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('   1. Logout from current account');
        console.log('   2. Login as: belal.riyad@gmail.com');
        console.log('   3. Upload template from that account');
        console.log('   4. Verify template appears in YOUR templates list');
      } else {
        console.log('   - No templates in database at all');
        console.log('   - Need to upload first template');
      }
      console.log('');
    } else {
      console.log('✅ USER HAS TEMPLATES:\n');
      
      userTemplatesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 ${data.name || doc.id}`);
        console.log(`      Status: ${data.status || 'N/A'}`);
        console.log(`      Matches Query: ${data.status === 'parsed' ? '✅ YES' : '❌ NO'}`);
        console.log('');
      });
      
      // Check if any are 'parsed'
      const parsedCount = userTemplatesSnapshot.docs.filter(
        doc => doc.data().status === 'parsed'
      ).length;
      
      console.log('═══════════════════════════════════════════════════════════════\n');
      console.log(`📊 SUMMARY FOR TEST USER (${testEmail}):\n`);
      console.log(`   Total templates: ${userTemplatesSnapshot.size}`);
      console.log(`   Parsed templates: ${parsedCount}`);
      console.log(`   User UID: ${userRecord.uid}`);
      console.log('');
      
      if (parsedCount === 0) {
        console.log('⚠️  NO PARSED TEMPLATES');
        console.log('   Templates exist but status is not "parsed"');
        console.log('   Possible reasons:');
        console.log('   - Still parsing (wait 30-60 seconds)');
        console.log('   - Parsing failed (check errors)');
        console.log('   - Status set to something else');
        console.log('');
      } else {
        console.log(`✅ ${parsedCount} PARSED TEMPLATE(S) AVAILABLE`);
        console.log('   Test should be able to proceed!');
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ User not found:', error.message);
    console.error('   The test account may not exist in Firebase Auth');
    console.error('');
  }
  
} catch (error) {
  console.error('❌ Error querying Firestore:', error);
  process.exit(1);
}

process.exit(0);
