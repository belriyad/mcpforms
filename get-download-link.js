/**
 * Get direct download link for the most recent generated document
 * Artifact ID: 7b33be0e-5ece-415d-9d47-03eb20427dfe
 */

// Direct download URL for the generated document
const ARTIFACT_ID = '7b33be0e-5ece-415d-9d47-03eb20427dfe';

console.log('\n🔗 DOWNLOAD LINKS FOR GENERATED DOCUMENT\n');
console.log('═'.repeat(60));

// Method 1: Direct Firebase Functions URL
const directDownloadUrl = `https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument/${ARTIFACT_ID}`;
console.log('\n📥 Direct Download URL:');
console.log(`${directDownloadUrl}`);

// Method 2: Alternative URLs if the main one doesn't work
console.log('\n🔄 Alternative Download Methods:');
console.log('\n1. Frontend Dashboard:');
console.log('   → Open: https://formgenai-4545.web.app/dashboard');
console.log('   → Navigate to "Document Artifacts" section');
console.log(`   → Look for artifact: ${ARTIFACT_ID}`);

console.log('\n2. PowerShell Download Command:');
console.log(`   Invoke-WebRequest -Uri "${directDownloadUrl}" -OutFile "generated_trust_document.docx"`);

console.log('\n3. Browser Direct Access:');
console.log(`   Open browser → Paste URL → Document will download automatically`);

console.log('\n4. Firebase Console (Admin):');
console.log('   → Go to: https://console.firebase.google.com/project/formgenai-4545');
console.log('   → Storage → generated-documents folder');
console.log(`   → Find file: ${ARTIFACT_ID}.docx`);

console.log('\n═'.repeat(60));
console.log('\n📋 Document Details:');
console.log(`   • Artifact ID: ${ARTIFACT_ID}`);
console.log('   • Template: Revocable Living Trust Template');
console.log('   • File Type: Microsoft Word Document (.docx)');
console.log('   • Generated: October 5, 2025');
console.log('   • AI-Enhanced: Yes (5 successful field mappings)');
console.log('   • Client Data: Belal Riyad / B Tech Global LLC');

console.log('\n✨ This document demonstrates the AI-powered smart field mapping system!');
console.log('   The AI successfully populated 5 fields from your client data.\n');