/**
 * Check template storage paths in Firestore
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'formgenai-4545'
  });
}

const db = admin.firestore();

async function checkTemplateStoragePaths() {
  console.log('🔍 Checking template storage paths...\n');
  
  try {
    // Get all templates
    const templatesSnapshot = await db.collection('templates').get();
    
    console.log(`Found ${templatesSnapshot.size} templates\n`);
    
    templatesSnapshot.forEach((doc) => {
      const template = doc.data();
      console.log(`Template: ${doc.id}`);
      console.log(`  Name: ${template.name}`);
      console.log(`  File Name: ${template.fileName || 'N/A'}`);
      console.log(`  Storage Path: ${template.storagePath || '❌ MISSING'}`);
      console.log(`  Created: ${template.createdAt?.toDate?.() || 'N/A'}`);
      console.log('');
    });
    
    // Check a specific service
    console.log('\n' + '='.repeat(60));
    console.log('Checking service templates...\n');
    
    const servicesSnapshot = await db.collection('services')
      .orderBy('createdAt', 'desc')
      .limit(3)
      .get();
    
    for (const serviceDoc of servicesSnapshot.docs) {
      const service = serviceDoc.data();
      console.log(`Service: ${serviceDoc.id}`);
      console.log(`  Name: ${service.name}`);
      console.log(`  Status: ${service.status}`);
      console.log(`  Templates: ${service.templates?.length || 0}`);
      
      if (service.templates && service.templates.length > 0) {
        service.templates.forEach((template, index) => {
          console.log(`\n  Template ${index + 1}:`);
          console.log(`    Name: ${template.name}`);
          console.log(`    Template ID: ${template.templateId}`);
          console.log(`    File Name: ${template.fileName || 'N/A'}`);
          console.log(`    Storage Path: ${template.storagePath || '❌ MISSING'}`);
        });
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

checkTemplateStoragePaths();
