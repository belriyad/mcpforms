const admin = require('firebase-admin');

// Initialize with application default credentials
admin.initializeApp({
  projectId: 'formgenai-4545'
});

const db = admin.firestore();

async function checkMigrationNeeds() {
  console.log('🔍 Checking which documents need migration...\n');
  
  const collections = [
    'services',
    'templates', 
    'intakes',
    'documentArtifacts',
    'intakeSubmissions',
    'intakeCustomizations'
  ];
  
  let totalNeedsMigration = 0;
  const results = {};
  
  for (const collectionName of collections) {
    try {
      const snapshot = await db.collection(collectionName).get();
      const needsMigration = [];
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.createdBy && !data.userId) {
          needsMigration.push({
            id: doc.id,
            name: data.name || data.serviceName || data.templateName || 'Unnamed',
            createdAt: data.createdAt?.toDate?.() || 'Unknown'
          });
        }
      });
      
      results[collectionName] = {
        total: snapshot.size,
        needsMigration: needsMigration.length,
        documents: needsMigration
      };
      
      totalNeedsMigration += needsMigration.length;
      
      if (needsMigration.length > 0) {
        console.log(`📦 ${collectionName}:`);
        console.log(`   Total: ${snapshot.size}, Need Migration: ${needsMigration.length}`);
        needsMigration.forEach(doc => {
          console.log(`   - ${doc.id}: "${doc.name}" (${doc.createdAt})`);
        });
        console.log('');
      } else {
        console.log(`✅ ${collectionName}: All ${snapshot.size} documents have ownership`);
      }
    } catch (error) {
      console.error(`❌ Error checking ${collectionName}:`, error.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`Total documents needing migration: ${totalNeedsMigration}`);
  
  if (totalNeedsMigration > 0) {
    console.log('\n⚠️  These documents need the createdBy field added.');
    console.log('Run the migration tool at https://formgenai-4545.web.app/migrate.html');
  } else {
    console.log('\n✨ All documents have proper ownership!');
  }
  
  process.exit(0);
}

checkMigrationNeeds();
