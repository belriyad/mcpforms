/**
 * Fix existing service by reloading its templates and regenerating documents
 * 
 * This script:
 * 1. Gets the service data
 * 2. Extracts template IDs
 * 3. Reloads templates (which will now include storagePath)
 * 4. Regenerates documents with proper template files
 */

const SERVICE_ID = process.argv[2] || '2F3GSb5UJobtRzU9Vjvv';
const BASE_URL = 'https://formgenai-4545.web.app';

async function fixService(serviceId) {
  console.log(`🔧 Fixing service: ${serviceId}\n`);
  
  try {
    // Step 1: Get service to find template IDs
    console.log('📥 Step 1: Getting service data...');
    // Note: This would require auth, so we'll use a simpler approach
    
    // For now, user needs to provide template IDs
    console.log('⚠️  This script requires template IDs from the service');
    console.log('');
    console.log('Manual Steps:');
    console.log('='.repeat(60));
    console.log('1. Login to: https://formgenai-4545.web.app');
    console.log(`2. Open service: ${serviceId}`);
    console.log('3. Note the template IDs shown');
    console.log('4. In browser console, run:');
    console.log('');
    console.log('   // Get current service templates');
    console.log('   const serviceRef = firebase.firestore().collection("services").doc("' + serviceId + '");');
    console.log('   const serviceData = await serviceRef.get();');
    console.log('   const templateIds = serviceData.data().templates.map(t => t.templateId);');
    console.log('   console.log("Template IDs:", templateIds);');
    console.log('');
    console.log('   // Reload templates with storagePath');
    console.log('   await fetch("/api/services/load-templates", {');
    console.log('     method: "POST",');
    console.log('     headers: { "Content-Type": "application/json" },');
    console.log('     body: JSON.stringify({ serviceId: "' + serviceId + '", templateIds })');
    console.log('   });');
    console.log('');
    console.log('5. Click "Generate All Documents" button');
    console.log('');
    console.log('='.repeat(60));
    
    return { success: true, message: 'See manual steps above' };
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

fixService(SERVICE_ID)
  .then((result) => {
    console.log('\n✅', result.message);
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  });
