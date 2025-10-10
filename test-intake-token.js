const admin = require('firebase-admin');
require('dotenv').config();

// Initialize
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

async function testIntakeToken() {
  // Try reading the service directly
  const serviceId = 'HrJ0BDHQRN86dbyG4AXL';
  
  console.log(`\n🔍 Reading service directly: ${serviceId}\n`);
  
  const serviceDoc = await db.collection('services').doc(serviceId).get();
  
  if (!serviceDoc.exists) {
    console.log('❌ Service not found!');
    return;
  }
  
  const service = serviceDoc.data();
  
  console.log('✅ Service found');
  console.log('📝 Service name:', service.name);
  console.log('� Status:', service.status);
  console.log('\n🔗 Intake Form:');
  
  if (!service.intakeForm) {
    console.log('❌ No intakeForm object!');
    console.log('\n📋 Top-level fields:');
    console.log(Object.keys(service));
  } else {
    console.log('✅ intakeForm object exists');
    console.log('  Fields in intakeForm:',  Object.keys(service.intakeForm));
    console.log('  Token:', service.intakeForm.token || 'NOT SET');
    console.log('  ID:', service.intakeForm.id);
    console.log('  Fields array length:', service.intakeForm.fields?.length || 0);
    
    if (service.intakeForm.fields && service.intakeForm.fields.length > 0) {
      console.log('\n📋 First 3 Fields:');
      service.intakeForm.fields.slice(0, 3).forEach((field, i) => {
        console.log(`  ${i + 1}. ${field.label} (${field.type})`);
      });
      if (service.intakeForm.fields.length > 3) {
        console.log(`  ... and ${service.intakeForm.fields.length - 3} more`);
      }
    } else {
      console.log('❌ No fields in array!');
    }
  }
  
  // Now test the query
  if (service.intakeForm?.token) {
    console.log(`\n🔍 Testing query with token: ${service.intakeForm.token}\n`);
    
    const querySnapshot = await db
      .collection('services')
      .where('intakeForm.token', '==', service.intakeForm.token)
      .limit(1)
      .get();
    
    console.log('📡 Query results:', querySnapshot.size, 'documents');
    
    if (querySnapshot.empty) {
      console.log('❌ Query failed even though we know the token exists!');
      console.log('This is likely a Firestore indexing or permissions issue');
    } else {
      console.log('✅ Query succeeded!');
    }
  }
}

testIntakeToken().catch(console.error);
