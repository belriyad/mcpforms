const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, getDoc } = require('firebase/firestore');

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

// The GUID is actually an intake ID based on the logs
const INTAKE_ID = '46ea3329-bc90-4c51-8644-2228958e7c73';

async function traceIntakeProcessing() {
  console.log('🔍 CORRECTED ANALYSIS: Tracing Intake Processing');
  console.log('═'.repeat(60));
  console.log(`🆔 Intake ID: ${INTAKE_ID}`);
  console.log('📋 From Firebase logs: Status changed from approved to documents-generated');
  console.log('═'.repeat(60));
  
  try {
    // Get the specific intake
    const intakeDoc = await getDoc(doc(db, 'intakes', INTAKE_ID));
    
    if (!intakeDoc.exists()) {
      console.log('❌ Intake not found in Firestore');
      return;
    }
    
    const intakeData = intakeDoc.data();
    console.log('\n📄 INTAKE DETAILS:');
    console.log('═'.repeat(30));
    console.log(`Status: ${intakeData.status}`);
    console.log(`Service ID: ${intakeData.serviceId}`);
    console.log(`Created: ${intakeData.createdAt?.toDate()?.toISOString()}`);
    console.log(`Submitted: ${intakeData.submittedAt?.toDate()?.toISOString()}`);
    console.log(`Client Token: ${intakeData.clientToken}`);
    
    if (intakeData.clientData) {
      console.log('\n📋 CLIENT DATA:');
      console.log(JSON.stringify(intakeData.clientData, null, 2));
    }
    
    // Get the related service
    if (intakeData.serviceId) {
      console.log('\n⚙️ RELATED SERVICE:');
      console.log('═'.repeat(30));
      
      const serviceDoc = await getDoc(doc(db, 'services', intakeData.serviceId));
      if (serviceDoc.exists()) {
        const serviceData = serviceDoc.data();
        console.log(`Service Name: ${serviceData.name}`);
        console.log(`Template IDs: ${JSON.stringify(serviceData.templateIds)}`);
        console.log(`Status: ${serviceData.status}`);
        
        // Get template details
        if (serviceData.templateIds && serviceData.templateIds.length > 0) {
          console.log('\n📄 TEMPLATES USED:');
          console.log('═'.repeat(30));
          
          for (const templateId of serviceData.templateIds) {
            const templateDoc = await getDoc(doc(db, 'templates', templateId));
            if (templateDoc.exists()) {
              const templateData = templateDoc.data();
              console.log(`\n📄 Template: ${templateId}`);
              console.log(`   - Filename: ${templateData.originalFileName}`);
              console.log(`   - Status: ${templateData.status}`);
              console.log(`   - Fields: ${templateData.extractedFields?.length || 0}`);
              
              if (templateData.originalFileName?.includes('Certificate_of_Trust')) {
                console.log('   ✅ THIS IS THE CERTIFICATE OF TRUST TEMPLATE!');
                
                if (templateData.extractedFields) {
                  console.log('   📋 Extracted Fields:');
                  templateData.extractedFields.forEach((field, index) => {
                    console.log(`      ${index + 1}. ${field.name} (${field.type})`);
                  });
                }
              }
            }
          }
        }
      }
    }
    
    // Check if there are document artifacts for this intake
    console.log('\n📋 DOCUMENT GENERATION STATUS:');
    console.log('═'.repeat(30));
    
    const artifactsQuery = query(
      collection(db, 'documentArtifacts'),
      where('intakeId', '==', INTAKE_ID)
    );
    
    const artifactsSnapshot = await getDocs(artifactsQuery);
    
    if (artifactsSnapshot.empty) {
      console.log('❌ No document artifacts found for this intake');
      
      // Check all artifacts to see if any might be related
      const allArtifactsQuery = query(collection(db, 'documentArtifacts'));
      const allSnapshot = await getDocs(allArtifactsQuery);
      
      console.log('\n🔍 Checking all artifacts for potential matches...');
      allSnapshot.forEach(doc => {
        const data = doc.data();
        const artifactDate = data.generatedAt?.toDate();
        const intakeDate = intakeData.submittedAt?.toDate();
        
        // Check if generated around the same time (within 1 hour)
        if (artifactDate && intakeDate) {
          const timeDiff = Math.abs(artifactDate.getTime() - intakeDate.getTime());
          const hoursDiff = timeDiff / (1000 * 60 * 60);
          
          if (hoursDiff < 1) {
            console.log(`✅ Potential match: ${doc.id} (generated ${hoursDiff.toFixed(2)} hours after intake)`);
            console.log(`   - Status: ${data.status}`);
            console.log(`   - Generated: ${artifactDate.toISOString()}`);
          }
        }
      });
    } else {
      console.log('✅ Found document artifacts:');
      artifactsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`📄 Artifact: ${doc.id}`);
        console.log(`   - Status: ${data.status}`);
        console.log(`   - Generated: ${data.generatedAt?.toDate()?.toISOString()}`);
        console.log(`   - Files: ${data.files?.length || 0}`);
        
        if (data.files) {
          data.files.forEach((file, index) => {
            console.log(`      ${index + 1}. ${file}`);
          });
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error tracing intake:', error);
  }
}

// Also check recent function logs for this specific intake
async function analyzeProcessingLogs() {
  console.log('\n🔍 PROCESSING LOG ANALYSIS:');
  console.log('═'.repeat(30));
  console.log('From Firebase Functions logs, we can see:');
  console.log(`✅ ${INTAKE_ID} status changed from "approved" to "documents-generated"`);
  console.log('✅ generateDocumentsFromIntake function executed successfully (183ms)');
  console.log('✅ onIntakeStatusChange trigger fired correctly (9ms)');
  console.log('✅ Multiple getDocumentDownloadUrl calls (suggesting successful generation)');
  console.log('✅ downloadDocument function calls (suggesting actual downloads occurred)');
  
  console.log('\n📊 PROCESSING TIMELINE:');
  console.log('2025-10-05T06:34:50 - Document generation completed');
  console.log('2025-10-05T06:34:50 - Status change trigger fired');
  console.log('2025-10-05T06:34:58+ - Multiple download URL requests');
  console.log('2025-10-05T06:35:02+ - Actual document downloads');
  
  console.log('\n💡 CONCLUSION:');
  console.log('The filename you provided appears to be a generated document name that includes:');
  console.log('- "001" - Likely a sequence number or service identifier');
  console.log('- "Certificate_of_Trust_Fillable Template" - The base template name');
  console.log('- "46ea3329-bc90-4c51-8644-2228958e7c73" - The intake ID');
  console.log('- ".docx" - The file extension');
  console.log('');
  console.log('This suggests the system successfully:');
  console.log('1. ✅ Processed an intake with ID 46ea3329-bc90-4c51-8644-2228958e7c73');
  console.log('2. ✅ Generated documents from Certificate of Trust template');
  console.log('3. ✅ Created downloadable artifacts');
  console.log('4. ✅ Updated intake status to "documents-generated"');
}

async function main() {
  await traceIntakeProcessing();
  await analyzeProcessingLogs();
}

main().catch(error => {
  console.error('❌ Script error:', error);
});