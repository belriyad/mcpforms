// Check the template configuration for the failing service
const https = require('https');

async function checkTemplateIssue() {
  console.log('🔍 Investigating template issue for service 2F3GSb5UJobtRzU9Vjvv\n');
  
  // The failing template info from API response:
  console.log('📄 Failing Template:');
  console.log('   Template ID: KLzL5Vw5NJij4dY0jlLR');
  console.log('   Template Name: 002 Certificate_of_Trust_Fillable Template_cb0de58b-3935-440c-8b7b-fe16bd6b8859');
  console.log('   File Name: 002 Certificate_of_Trust_Fillable Template_cb0de58b-3935-440c-8b7b-fe16bd6b8859.docx\n');
  
  console.log('🎯 Most Likely Issues:');
  console.log('   1. Template file missing from Cloud Storage');
  console.log('   2. Invalid or missing storagePath in template document');
  console.log('   3. Template file corrupted or invalid DOCX format');
  console.log('   4. Storage permissions issue\n');
  
  console.log('✅ Next Steps:');
  console.log('   1. Check Firebase Console → Storage → Look for templates folder');
  console.log('   2. Check Firestore → services → 2F3GSb5UJobtRzU9Vjvv → templates array');
  console.log('   3. Find template with ID: KLzL5Vw5NJij4dY0jlLR');
  console.log('   4. Verify its storagePath field points to existing file');
  console.log('   5. Check Firebase Functions logs for detailed error\n');
  
  console.log('🌐 Open these URLs to investigate:');
  console.log('   Firestore: https://console.firebase.google.com/project/formgenai-4545/firestore/databases/-default-/data/~2Fservices~2F2F3GSb5UJobtRzU9Vjvv');
  console.log('   Storage: https://console.firebase.google.com/project/formgenai-4545/storage');
  console.log('   Functions Logs: https://console.firebase.google.com/project/formgenai-4545/functions/logs\n');
  
  console.log('💡 Common Fix:');
  console.log('   If template is missing, you need to:');
  console.log('   1. Re-upload the template DOCX file');
  console.log('   2. Update the template document in Firestore with correct storagePath');
  console.log('   3. Or delete and recreate the service with a valid template\n');
}

checkTemplateIssue();
