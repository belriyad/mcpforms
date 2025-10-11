// Check service using Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');

// Check if already initialized
if (!admin.apps.length) {
  // Look for service account key
  const possiblePaths = [
    './formgenai-4545-firebase-adminsdk-uisjx-e34a81fc2d.json',
    './serviceAccountKey.json',
    process.env.GOOGLE_APPLICATION_CREDENTIALS
  ];
  
  let serviceAccount = null;
  for (const path of possiblePaths) {
    if (path && fs.existsSync(path)) {
      serviceAccount = require(path);
      console.log(`✅ Found service account key: ${path}\n`);
      break;
    }
  }
  
  if (!serviceAccount) {
    console.log('⚠️  No service account key found locally');
    console.log('Using Application Default Credentials...\n');
    admin.initializeApp({
      projectId: 'formgenai-4545'
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'formgenai-4545.firebasestorage.app'
    });
  }
}

const db = admin.firestore();
const storage = admin.storage();

async function checkService() {
  try {
    const serviceId = '2F3GSb5UJobtRzU9Vjvv';
    
    console.log('🔍 Fetching service data...\n');
    
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    
    if (!serviceDoc.exists) {
      console.log('❌ Service not found!');
      process.exit(1);
    }
    
    const service = serviceDoc.data();
    
    console.log('📋 Service Info:');
    console.log(`   Name: ${service.name}`);
    console.log(`   Client: ${service.clientName}`);
    console.log(`   Status: ${service.status}`);
    console.log(`   Templates Count: ${service.templates?.length || 0}\n`);
    
    if (service.templates && service.templates.length > 0) {
      console.log('📄 Templates:\n');
      
      for (let i = 0; i < service.templates.length; i++) {
        const template = service.templates[i];
        console.log(`   Template ${i + 1}:`);
        console.log(`   ├─ Template ID: ${template.templateId}`);
        console.log(`   ├─ Name: ${template.name}`);
        console.log(`   ├─ File Name: ${template.fileName || 'N/A'}`);
        console.log(`   ├─ Storage Path: ${template.storagePath || '❌ MISSING'}`);
        console.log(`   ├─ Extracted Fields: ${template.extractedFields?.length || 0}`);
        
        // Check if file exists in storage
        if (template.storagePath) {
          try {
            const bucket = storage.bucket();
            const file = bucket.file(template.storagePath);
            const [exists] = await file.exists();
            console.log(`   └─ File Exists in Storage: ${exists ? '✅ YES' : '❌ NO'}`);
            
            if (exists) {
              const [metadata] = await file.getMetadata();
              console.log(`      └─ Size: ${(metadata.size / 1024).toFixed(2)} KB`);
              console.log(`      └─ Type: ${metadata.contentType}`);
            }
          } catch (storageError) {
            console.log(`   └─ Storage Check Error: ${storageError.message}`);
          }
        }
        
        console.log('');
      }
    } else {
      console.log('❌ No templates found!\n');
    }
    
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log('📦 Generated Documents:\n');
      service.generatedDocuments.forEach((doc, index) => {
        console.log(`   Document ${index + 1}:`);
        console.log(`   ├─ File Name: ${doc.fileName}`);
        console.log(`   ├─ Status: ${doc.status}`);
        console.log(`   ├─ Has Download URL: ${!!doc.downloadUrl}`);
        console.log(`   └─ Download URL: ${doc.downloadUrl || 'NULL'}\n`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

checkService();
