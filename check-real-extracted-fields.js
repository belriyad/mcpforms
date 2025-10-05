const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDuUQcqVg9eEyNMRgD7wSzaJZ5YiJp6mQc",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.appspot.com",
  messagingSenderId: "147060056706",
  appId: "1:147060056706:web:68db8cd29f4f3dc7b6b9e7",
  measurementId: "G-4XBQB5F92Y"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

(async () => {
  try {
    console.log('🔍 CHECKING REAL EXTRACTED FIELDS FROM FIRESTORE\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Get all templates with "Certificate of Trust" in the name
    const templatesRef = collection(db, 'templates');
    const templatesSnapshot = await getDocs(templatesRef);
    
    console.log(`📋 Found ${templatesSnapshot.size} total templates in Firestore\n`);
    
    let certificateTemplate = null;
    templatesSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`Template: ${doc.id}`);
      console.log(`  Name: ${data.name || 'N/A'}`);
      console.log(`  Status: ${data.status || 'N/A'}`);
      console.log(`  Fields: ${data.extractedFields?.length || 0}`);
      console.log('');
      
      if (data.name && (
        data.name.toLowerCase().includes('certificate') && data.name.toLowerCase().includes('trust') ||
        data.name.toLowerCase().includes('certificateoftrust')
      )) {
        certificateTemplate = { id: doc.id, ...data };
      }
    });
    
    if (!certificateTemplate) {
      console.log('❌ No Certificate of Trust template found!');
      process.exit(1);
    }
    
    console.log('\n🎯 CERTIFICATE OF TRUST TEMPLATE FOUND:');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`ID: ${certificateTemplate.id}`);
    console.log(`Name: ${certificateTemplate.name}`);
    console.log(`Status: ${certificateTemplate.status}`);
    console.log(`\n📝 EXTRACTED FIELDS (${certificateTemplate.extractedFields?.length || 0}):\n`);
    
    if (certificateTemplate.extractedFields && certificateTemplate.extractedFields.length > 0) {
      certificateTemplate.extractedFields.forEach((field, index) => {
        console.log(`${index + 1}. ${field.name} (${field.type})`);
        console.log(`   Label: ${field.label}`);
        console.log(`   Required: ${field.required}`);
        if (field.description) console.log(`   Description: ${field.description}`);
        if (field.options) console.log(`   Options: ${field.options.join(', ')}`);
        console.log('');
      });
    } else {
      console.log('⚠️ No extracted fields found for this template!');
    }
    
    // Now check if there's a service using this template
    console.log('\n🔍 CHECKING SERVICES USING THIS TEMPLATE:\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const servicesRef = collection(db, 'services');
    const servicesSnapshot = await getDocs(servicesRef);
    
    servicesSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.templateIds && data.templateIds.includes(certificateTemplate.id)) {
        console.log(`✅ Service: ${doc.id}`);
        console.log(`   Name: ${data.name || 'N/A'}`);
        console.log(`   Templates: ${data.templateIds?.length || 0}`);
        console.log(`   Master Form Fields: ${data.masterFormJson?.length || 0}`);
        
        if (data.masterFormJson && data.masterFormJson.length > 0) {
          console.log('\n   📋 MASTER FORM JSON (Consolidated Fields):');
          data.masterFormJson.forEach((field, index) => {
            console.log(`   ${index + 1}. ${field.name} (${field.type}) - ${field.label}`);
          });
        }
        console.log('');
      }
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
})();
