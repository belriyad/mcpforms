#!/usr/bin/env node

/**
 * Check if documents have downloadUrl set
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'formgenai-4545',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

async function checkDownloadUrl() {
  try {
    // Get the latest service
    const servicesSnapshot = await db.collection('services')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    
    if (servicesSnapshot.empty) {
      console.error('❌ No services found!');
      return;
    }
    
    const serviceDoc = servicesSnapshot.docs[0];
    const service = serviceDoc.data();
    
    console.log('\n📋 Latest Service Check\n');
    console.log('━'.repeat(60));
    console.log(`Service ID: ${serviceDoc.id}`);
    console.log(`Service Name: ${service.name}`);
    console.log(`Status: ${service.status}`);
    console.log(`Created: ${service.createdAt?.toDate?.()}`);
    
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log(`\n✅ ${service.generatedDocuments.length} document(s) found\n`);
      
      service.generatedDocuments.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`);
        console.log(`  ID: ${doc.id}`);
        console.log(`  Name: ${doc.fileName}`);
        console.log(`  Template: ${doc.templateName}`);
        console.log(`  Status: ${doc.status}`);
        console.log(`  Has downloadUrl: ${!!doc.downloadUrl ? '✅ YES' : '❌ NO'}`);
        if (doc.downloadUrl) {
          console.log(`  Download URL: ${doc.downloadUrl}`);
        }
        console.log(`  Has storagePath: ${!!doc.storagePath ? '✅ YES' : '❌ NO'}`);
        if (doc.storagePath) {
          console.log(`  Storage Path: ${doc.storagePath}`);
        }
        console.log(`  File Size: ${doc.fileSize ? `${doc.fileSize} bytes` : 'N/A'}`);
        console.log('');
      });
      
      const hasDownloadUrls = service.generatedDocuments.every(doc => doc.downloadUrl);
      if (hasDownloadUrls) {
        console.log('✅ All documents have downloadUrl - Downloads should work!');
      } else {
        console.log('❌ Some documents missing downloadUrl - Downloads will be stuck at "Generating..."');
      }
    } else {
      console.log('\n⚠️  No generated documents found');
      console.log('Run "Generate All Documents" first');
    }
    
    console.log('\n━'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

checkDownloadUrl()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
