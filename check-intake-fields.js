const admin = require('firebase-admin');
require('dotenv').config();

// Initialize if not already
if (!admin.apps.length) {
  const projectId = process.env.ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (process.env.ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n');
  
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });
}

const db = admin.firestore();

async function checkService() {
  const serviceId = 'T9tYyU9RoSHSyOIc3xVn';
  
  console.log(`\n🔍 Checking service: ${serviceId}\n`);
  
  const serviceDoc = await db.collection('services').doc(serviceId).get();
  
  if (!serviceDoc.exists) {
    console.log('❌ Service not found!');
    return;
  }
  
  const data = serviceDoc.data();
  
  console.log('📋 Service Status:', data.status);
  console.log('📧 Client:', data.clientName, `<${data.clientEmail}>`);
  console.log('🔗 Intake Token:', data.intakeToken);
  console.log('\n📝 Intake Form:');
  
  if (!data.intakeForm) {
    console.log('❌ No intake form!');
  } else {
    console.log('Fields:', data.intakeForm.fields?.length || 0);
    if (data.intakeForm.fields && data.intakeForm.fields.length > 0) {
      console.log('\n📋 Fields:');
      data.intakeForm.fields.forEach((field, i) => {
        console.log(`  ${i + 1}. ${field.label} (${field.type})`);
        if (field.placeholder) console.log(`     Placeholder: ${field.placeholder}`);
      });
    } else {
      console.log('❌ Fields array is empty or missing!');
    }
  }
  
  console.log('\n📄 Selected Templates:', data.selectedTemplates?.length || 0);
  if (data.selectedTemplates) {
    data.selectedTemplates.forEach((templateId) => {
      console.log(`  - ${templateId}`);
    });
  }
}

checkService().catch(console.error);
