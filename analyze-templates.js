/**
 * Quick diagnostic script to check template data in Firestore
 * Run with: node analyze-templates.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where } = require('firebase/firestore');

// Firebase config (from your app)
const firebaseConfig = {
  apiKey: "AIzaSyDZXm-cR7oGiXeVNRrsf25eeeBc2w7d7YE",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "393887336962",
  appId: "1:393887336962:web:ad5e0de28d4f66d7f76b92"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function analyzeTemplates() {
  console.log('\n🔍 ANALYZING TEMPLATES IN FIRESTORE');
  console.log('='.repeat(60));
  
  // Get ALL templates
  const allTemplatesSnapshot = await getDocs(collection(db, 'templates'));
  console.log(`\n📊 Total templates in database: ${allTemplatesSnapshot.size}`);
  
  if (allTemplatesSnapshot.size === 0) {
    console.log('❌ No templates found!');
    return;
  }
  
  // Analyze each template
  const templates = [];
  allTemplatesSnapshot.forEach(doc => {
    const data = doc.data();
    templates.push({
      id: doc.id,
      name: data.name,
      status: data.status,
      createdBy: data.createdBy,
      userId: data.userId,
      fieldsCount: data.extractedFields?.length || 0,
      createdAt: data.createdAt?.toDate?.()?.toLocaleString() || 'Unknown'
    });
  });
  
  console.log('\n📋 Template Details:');
  console.log('-'.repeat(60));
  templates.forEach((t, i) => {
    console.log(`\n${i + 1}. ${t.name}`);
    console.log(`   ID: ${t.id}`);
    console.log(`   Status: ${t.status || 'MISSING!'}`);
    console.log(`   Created By: ${t.createdBy || 'MISSING!'}`);
    console.log(`   User ID: ${t.userId || 'N/A'}`);
    console.log(`   Fields: ${t.fieldsCount}`);
    console.log(`   Created: ${t.createdAt}`);
  });
  
  // Check for parsed templates
  console.log('\n' + '='.repeat(60));
  const parsedTemplates = templates.filter(t => t.status === 'parsed');
  console.log(`\n✅ Templates with status='parsed': ${parsedTemplates.length}`);
  
  const unparsedTemplates = templates.filter(t => t.status !== 'parsed');
  console.log(`⚠️  Templates WITHOUT status='parsed': ${unparsedTemplates.length}`);
  
  if (unparsedTemplates.length > 0) {
    console.log('\n⚠️  Templates that won\'t show in wizard:');
    unparsedTemplates.forEach(t => {
      console.log(`   - ${t.name} (status: ${t.status || 'MISSING'})`);
    });
  }
  
  // Check for createdBy field
  const withCreatedBy = templates.filter(t => t.createdBy);
  console.log(`\n✅ Templates with 'createdBy' field: ${withCreatedBy.length}`);
  
  const withoutCreatedBy = templates.filter(t => !t.createdBy);
  console.log(`⚠️  Templates WITHOUT 'createdBy' field: ${withoutCreatedBy.length}`);
  
  if (withoutCreatedBy.length > 0) {
    console.log('\n⚠️  Templates missing createdBy (won\'t show for any user):');
    withoutCreatedBy.forEach(t => {
      console.log(`   - ${t.name}`);
    });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n💡 WIZARD REQUIREMENTS:');
  console.log('   - status === "parsed"');
  console.log('   - createdBy === user.uid');
  console.log('\n🎯 Templates that WILL show in wizard:');
  const wizardTemplates = templates.filter(t => 
    t.status === 'parsed' && t.createdBy
  );
  console.log(`   Count: ${wizardTemplates.length}`);
  wizardTemplates.forEach(t => {
    console.log(`   - ${t.name} (for user: ${t.createdBy})`);
  });
  
  console.log('\n='.repeat(60) + '\n');
  process.exit(0);
}

analyzeTemplates().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
