// Check if documents actually have downloadUrls in Firestore
const admin = require('firebase-admin');
const serviceAccount = require('./formgenai-4545-firebase-adminsdk-uisjx-e34a81fc2d.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'formgenai-4545.firebasestorage.app'
  });
}

const db = admin.firestore();

async function checkServiceDocuments() {
  try {
    const serviceId = '2F3GSb5UJobtRzU9Vjvv';
    const serviceRef = db.collection('services').doc(serviceId);
    const serviceDoc = await serviceRef.get();
    
    if (!serviceDoc.exists) {
      console.log('❌ Service not found');
      return;
    }
    
    const service = serviceDoc.data();
    console.log('\n📄 Service:', service.name);
    console.log('Status:', service.status);
    console.log('Documents Generated At:', service.documentsGeneratedAt);
    console.log('\n📋 Generated Documents:');
    
    if (!service.generatedDocuments || service.generatedDocuments.length === 0) {
      console.log('❌ No generated documents found');
      return;
    }
    
    service.generatedDocuments.forEach((doc, index) => {
      console.log(`\n  Document ${index + 1}:`);
      console.log(`    File Name: ${doc.fileName}`);
      console.log(`    Template: ${doc.templateName}`);
      console.log(`    Status: ${doc.status}`);
      console.log(`    Has Download URL: ${!!doc.downloadUrl}`);
      console.log(`    Download URL: ${doc.downloadUrl || 'NULL'}`);
      console.log(`    Storage Path: ${doc.storagePath || 'NULL'}`);
      console.log(`    File Size: ${doc.fileSize || 'NULL'}`);
    });
    
    const docsWithUrls = service.generatedDocuments.filter(d => d.downloadUrl).length;
    const totalDocs = service.generatedDocuments.length;
    
    console.log(`\n📊 Summary: ${docsWithUrls}/${totalDocs} documents have download URLs`);
    
    if (docsWithUrls < totalDocs) {
      console.log('\n❌ PROBLEM IDENTIFIED: Some documents missing downloadUrls!');
      console.log('This means the backend API is NOT properly generating/uploading files');
    } else {
      console.log('\n✅ All documents have downloadUrls - problem is in frontend refresh');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkServiceDocuments();
