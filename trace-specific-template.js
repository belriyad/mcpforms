const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, orderBy } = require('firebase/firestore');
const { getStorage, ref, listAll, getDownloadURL, getMetadata } = require('firebase/storage');
const { getFunctions, httpsCallable } = require('firebase/functions');

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
const storage = getStorage(app);
const functions = getFunctions(app);

// Target file details
const TARGET_FILENAME = '001 Certificate_of_Trust_Fillable Template_46ea3329-bc90-4c51-8644-2228958e7c73.docx';
const TARGET_GUID = '46ea3329-bc90-4c51-8644-2228958e7c73';

async function traceTemplateInStorage() {
  console.log('🔍 STEP 1: Searching Firebase Storage');
  console.log('═'.repeat(60));
  
  try {
    // List all files in templates folder
    const templatesRef = ref(storage, 'templates');
    const templatesList = await listAll(templatesRef);
    
    console.log(`📁 Found ${templatesList.items.length} files in templates folder:`);
    
    let targetFound = false;
    
    for (const itemRef of templatesList.items) {
      const metadata = await getMetadata(itemRef);
      const filename = itemRef.name;
      
      console.log(`   📄 ${filename}`);
      console.log(`      - Size: ${metadata.size} bytes`);
      console.log(`      - Created: ${metadata.timeCreated}`);
      console.log(`      - Updated: ${metadata.updated}`);
      
      // Check if this matches our target
      if (filename.includes(TARGET_GUID) || filename === TARGET_FILENAME) {
        console.log(`   ✅ FOUND TARGET FILE: ${filename}`);
        targetFound = true;
        
        try {
          const downloadUrl = await getDownloadURL(itemRef);
          console.log(`      - Download URL: ${downloadUrl}`);
        } catch (error) {
          console.log(`      - ❌ Error getting download URL: ${error.message}`);
        }
      }
    }
    
    if (!targetFound) {
      console.log(`❌ Target file not found in Storage`);
    }
    
    // Also check processed folder
    console.log('\n📁 Checking processed folder...');
    try {
      const processedRef = ref(storage, 'processed');
      const processedList = await listAll(processedRef);
      
      console.log(`📁 Found ${processedList.items.length} files in processed folder:`);
      
      for (const itemRef of processedList.items) {
        const filename = itemRef.name;
        console.log(`   📄 ${filename}`);
        
        if (filename.includes(TARGET_GUID)) {
          console.log(`   ✅ FOUND TARGET FILE IN PROCESSED: ${filename}`);
          targetFound = true;
        }
      }
    } catch (error) {
      console.log('❌ No processed folder or access denied');
    }
    
    // Check documents folder
    console.log('\n📁 Checking documents folder...');
    try {
      const documentsRef = ref(storage, 'documents');
      const documentsList = await listAll(documentsRef);
      
      console.log(`📁 Found ${documentsList.items.length} files in documents folder:`);
      
      for (const itemRef of documentsList.items) {
        const filename = itemRef.name;
        console.log(`   📄 ${filename}`);
        
        if (filename.includes(TARGET_GUID)) {
          console.log(`   ✅ FOUND TARGET FILE IN DOCUMENTS: ${filename}`);
          targetFound = true;
        }
      }
    } catch (error) {
      console.log('❌ No documents folder or access denied');
    }
    
    return targetFound;
    
  } catch (error) {
    console.error('❌ Error searching storage:', error);
    return false;
  }
}

async function traceTemplateInFirestore() {
  console.log('\n🔍 STEP 2: Searching Firestore Templates Collection');
  console.log('═'.repeat(60));
  
  try {
    // Search by exact ID
    const templatesQuery = query(
      collection(db, 'templates'),
      where('__name__', '==', TARGET_GUID)
    );
    
    const templatesSnapshot = await getDocs(templatesQuery);
    
    if (!templatesSnapshot.empty) {
      console.log('✅ Found template by ID!');
      templatesSnapshot.forEach(doc => {
        console.log(`📄 Template ID: ${doc.id}`);
        const data = doc.data();
        console.log('📋 Template Data:');
        console.log(JSON.stringify(data, null, 2));
      });
      return true;
    }
    
    // Search by filename pattern
    const allTemplatesQuery = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));
    const allSnapshot = await getDocs(allTemplatesQuery);
    
    console.log(`📊 Total templates in Firestore: ${allSnapshot.size}`);
    
    let found = false;
    allSnapshot.forEach(doc => {
      const data = doc.data();
      const filename = data.originalFileName || data.fileName || '';
      
      console.log(`\n📄 Template: ${doc.id}`);
      console.log(`   - Filename: ${filename}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Created: ${data.createdAt?.toDate()?.toISOString() || 'Unknown'}`);
      console.log(`   - File Type: ${data.fileType || 'Unknown'}`);
      console.log(`   - Extracted Fields: ${data.extractedFields?.length || 0}`);
      
      if (filename.includes(TARGET_GUID) || 
          filename.includes('Certificate_of_Trust') ||
          doc.id === TARGET_GUID) {
        console.log('   ✅ POTENTIAL MATCH!');
        found = true;
        
        if (data.extractedFields) {
          console.log('   📋 Extracted Fields:');
          data.extractedFields.forEach((field, index) => {
            console.log(`      ${index + 1}. ${field.name} (${field.type})`);
          });
        }
        
        if (data.error) {
          console.log('   ❌ Processing Error:', data.error);
        }
      }
    });
    
    return found;
    
  } catch (error) {
    console.error('❌ Error searching Firestore:', error);
    return false;
  }
}

async function checkDocumentArtifacts() {
  console.log('\n🔍 STEP 3: Checking Document Artifacts');
  console.log('═'.repeat(60));
  
  try {
    const artifactsQuery = query(collection(db, 'documentArtifacts'), orderBy('generatedAt', 'desc'));
    const artifactsSnapshot = await getDocs(artifactsQuery);
    
    console.log(`📊 Total document artifacts: ${artifactsSnapshot.size}`);
    
    let found = false;
    artifactsSnapshot.forEach(doc => {
      const data = doc.data();
      
      console.log(`\n📄 Artifact: ${doc.id}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Generated: ${data.generatedAt?.toDate()?.toISOString() || 'Unknown'}`);
      console.log(`   - Template IDs: ${JSON.stringify(data.templateIds || [])}`);
      console.log(`   - Files: ${data.files?.length || 0} files`);
      
      // Check if this artifact relates to our target
      if (data.templateIds?.includes(TARGET_GUID) ||
          data.files?.some(file => file.includes(TARGET_GUID)) ||
          doc.id === TARGET_GUID) {
        console.log('   ✅ FOUND RELATED ARTIFACT!');
        found = true;
        
        if (data.files) {
          console.log('   📋 Generated Files:');
          data.files.forEach((file, index) => {
            console.log(`      ${index + 1}. ${file}`);
          });
        }
        
        if (data.error) {
          console.log('   ❌ Generation Error:', data.error);
        }
      }
    });
    
    return found;
    
  } catch (error) {
    console.error('❌ Error checking artifacts:', error);
    return false;
  }
}

async function checkServices() {
  console.log('\n🔍 STEP 4: Checking Services Using This Template');
  console.log('═'.repeat(60));
  
  try {
    const servicesQuery = query(collection(db, 'services'), orderBy('createdAt', 'desc'));
    const servicesSnapshot = await getDocs(servicesQuery);
    
    console.log(`📊 Total services: ${servicesSnapshot.size}`);
    
    let found = false;
    servicesSnapshot.forEach(doc => {
      const data = doc.data();
      
      console.log(`\n⚙️ Service: ${doc.id}`);
      console.log(`   - Name: ${data.name}`);
      console.log(`   - Status: ${data.status}`);
      console.log(`   - Template IDs: ${JSON.stringify(data.templateIds || [])}`);
      console.log(`   - Created: ${data.createdAt?.toDate()?.toISOString() || 'Unknown'}`);
      
      if (data.templateIds?.includes(TARGET_GUID)) {
        console.log('   ✅ FOUND SERVICE USING THIS TEMPLATE!');
        found = true;
        
        if (data.masterFormJson) {
          const formFields = JSON.parse(data.masterFormJson);
          console.log(`   📋 Form Fields: ${formFields.length} fields`);
        }
      }
    });
    
    return found;
    
  } catch (error) {
    console.error('❌ Error checking services:', error);
    return false;
  }
}

async function checkFunctionLogs() {
  console.log('\n🔍 STEP 5: Checking Recent Function Logs');
  console.log('═'.repeat(60));
  
  try {
    // This would require admin access to logs, so we'll simulate
    console.log('📋 Recent processing activity (last 24 hours):');
    console.log('   - Upload functions: Check template upload logs');
    console.log('   - Parse functions: Check AI parsing logs');
    console.log('   - Generation functions: Check document generation logs');
    console.log('   - Error logs: Check for any failures related to this template');
    
    console.log('\n💡 To check actual logs, run:');
    console.log('   firebase functions:log --only parseTemplate');
    console.log('   firebase functions:log --only generateDocumentsFromIntake');
    console.log('   firebase functions:log --since 24h');
    
  } catch (error) {
    console.error('❌ Error checking logs:', error);
  }
}

// Main execution
async function main() {
  console.log('🔍 TRACING TEMPLATE FILE THROUGH BACKEND SYSTEM');
  console.log('═'.repeat(70));
  console.log(`🎯 Target File: ${TARGET_FILENAME}`);
  console.log(`🆔 Target GUID: ${TARGET_GUID}`);
  console.log('═'.repeat(70));
  
  const storageFound = await traceTemplateInStorage();
  const firestoreFound = await traceTemplateInFirestore();
  const artifactsFound = await checkDocumentArtifacts();
  const servicesFound = await checkServices();
  await checkFunctionLogs();
  
  console.log('\n📊 TRACE SUMMARY');
  console.log('═'.repeat(30));
  console.log(`Firebase Storage: ${storageFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Firestore Templates: ${firestoreFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Document Artifacts: ${artifactsFound ? '✅ Found' : '❌ Not Found'}`);
  console.log(`Services: ${servicesFound ? '✅ Found' : '❌ Not Found'}`);
  
  if (!storageFound && !firestoreFound && !artifactsFound && !servicesFound) {
    console.log('\n❌ CONCLUSION: Template not found in any backend system');
    console.log('   - File may have been deleted');
    console.log('   - File may never have been uploaded');
    console.log('   - GUID may be incorrect');
    console.log('   - File may be in different storage location');
  } else {
    console.log('\n✅ CONCLUSION: Template found in backend system');
    console.log('   - Check above details for processing status and issues');
  }
}

main().catch(error => {
  console.error('❌ Script error:', error);
});