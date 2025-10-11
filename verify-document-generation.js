#!/usr/bin/env node

/**
 * Quick verification script to check document generation
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

async function verifyDocumentGeneration() {
  try {
    // Get the service ID from test results
    const serviceId = 'kpWG44PIt8uqp1uyk6Wz';
    
    console.log(`\n📋 Verifying Document Generation for Service: ${serviceId}\n`);
    console.log('━'.repeat(60));
    
    const serviceDoc = await db.collection('services').doc(serviceId).get();
    
    if (!serviceDoc.exists) {
      console.error('❌ Service not found!');
      return;
    }
    
    const service = serviceDoc.data();
    
    console.log(`\n📊 Service Status: ${service.status}`);
    console.log(`📅 Created: ${service.createdAt?.toDate?.() || 'N/A'}`);
    console.log(`📅 Updated: ${service.updatedAt?.toDate?.() || 'N/A'}`);
    
    if (service.documentsGeneratedAt) {
      console.log(`📅 Documents Generated: ${service.documentsGeneratedAt.toDate()}`);
    }
    
    console.log('\n📄 Generated Documents:');
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log(`✅ ${service.generatedDocuments.length} document(s) generated!\n`);
      
      service.generatedDocuments.forEach((doc, index) => {
        console.log(`Document ${index + 1}:`);
        console.log(`  Template: ${doc.templateName}`);
        console.log(`  Type: ${doc.documentType}`);
        console.log(`  Fields: ${Object.keys(doc.populatedFields || {}).length}`);
        console.log(`  AI Sections: ${Object.keys(doc.aiSections || {}).length}`);
        console.log(`  Status: ${doc.status || 'pending'}`);
        console.log('');
      });
      
      console.log('✅ VERIFICATION PASSED: Document generation completed successfully!');
    } else {
      console.log('⚠️  No documents found in generatedDocuments array');
      console.log('❌ VERIFICATION FAILED: Document generation did not create metadata');
    }
    
    console.log('\n━'.repeat(60));
    
  } catch (error) {
    console.error('❌ Error verifying document generation:', error.message);
    throw error;
  }
}

verifyDocumentGeneration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
