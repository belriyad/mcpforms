const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'formgenai-4545'
  });
}

const db = admin.firestore();

async function checkTemplateData() {
  console.log('🔍 CHECKING TEMPLATE DATA IN FIRESTORE');
  console.log('=' * 50);

  try {
    // Get all templates
    const templatesSnapshot = await db.collection('templates').orderBy('createdAt', 'desc').limit(5).get();
    
    if (templatesSnapshot.empty) {
      console.log('❌ No templates found in Firestore');
      return;
    }

    console.log(`✅ Found ${templatesSnapshot.size} templates (showing latest 5):`);
    console.log('');

    templatesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Template ${index + 1}: ${doc.id}`);
      console.log(`   📛 Name: ${data.name || 'Unnamed'}`);
      console.log(`   📅 Created: ${data.createdAt?.toDate()?.toISOString() || 'Unknown'}`);
      console.log(`   📊 Status: ${data.status || 'Unknown'}`);
      console.log(`   🔧 File Type: ${data.fileType || 'Unknown'}`);
      
      // Check for AI analysis results
      if (data.extractedFields) {
        console.log(`   ✅ AI Analysis: Found ${data.extractedFields.length} extracted fields`);
        data.extractedFields.forEach((field, i) => {
          console.log(`      ${i + 1}. ${field.name} (${field.type})`);
        });
      } else {
        console.log(`   ❌ AI Analysis: No extracted fields found`);
      }

      // Check for insertion points
      if (data.insertionPoints) {
        console.log(`   🎯 Insertion Points: Found ${data.insertionPoints.length} insertion points`);
        data.insertionPoints.forEach((point, i) => {
          console.log(`      ${i + 1}. Field: ${point.fieldName}, Placeholder: ${point.placeholder}`);
        });
      } else {
        console.log(`   ❌ Insertion Points: None found`);
      }

      if (data.errorMessage) {
        console.log(`   ⚠️ Error: ${data.errorMessage}`);
      }

      console.log('');
    });

    // Check services to see which templates are being used
    console.log('🔧 CHECKING SERVICES:');
    const servicesSnapshot = await db.collection('services').orderBy('createdAt', 'desc').limit(3).get();
    
    if (!servicesSnapshot.empty) {
      servicesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📋 Service ${index + 1}: ${doc.id}`);
        console.log(`   📛 Name: ${data.name || 'Unnamed'}`);
        console.log(`   📄 Templates: ${data.templateIds?.length || 0} templates`);
        if (data.templateIds) {
          data.templateIds.forEach((templateId, i) => {
            console.log(`      ${i + 1}. ${templateId}`);
          });
        }
        console.log('');
      });
    } else {
      console.log('❌ No services found');
    }

    // Check intakes to see what's being generated
    console.log('📝 CHECKING RECENT INTAKES:');
    const intakesSnapshot = await db.collection('intakes').orderBy('createdAt', 'desc').limit(3).get();
    
    if (!intakesSnapshot.empty) {
      intakesSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`📋 Intake ${index + 1}: ${doc.id}`);
        console.log(`   📛 Service: ${data.serviceId || 'Unknown'}`);
        console.log(`   📊 Status: ${data.status || 'Unknown'}`);
        console.log(`   📅 Created: ${data.createdAt?.toDate()?.toISOString() || 'Unknown'}`);
        if (data.formData) {
          const fieldCount = Object.keys(data.formData).length;
          console.log(`   📋 Form Data: ${fieldCount} fields submitted`);
        }
        console.log('');
      });
    } else {
      console.log('❌ No intakes found');
    }

  } catch (error) {
    console.error('❌ Error checking template data:', error.message);
  }
}

checkTemplateData()
  .then(() => {
    console.log('✅ Template data check complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Template data check failed:', error.message);
    process.exit(1);
  });