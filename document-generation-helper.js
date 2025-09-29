// Document Generation Helper Script
// Run this in browser console after form submission to trigger document generation

console.log('🚀 Document Generation Helper Script');

// Function to trigger document generation via Firebase
async function triggerDocumentGeneration(intakeId) {
  try {
    console.log('📄 Triggering document generation for intake:', intakeId);
    
    // Use Firebase callable function
    const functions = firebase.functions();
    const generateDocuments = functions.httpsCallable('generateDocumentsFromIntake');
    
    const result = await generateDocuments({ intakeId: intakeId });
    
    if (result.data.success) {
      console.log('✅ Document generation successful!');
      console.log('📊 Result:', result.data);
      return result.data;
    } else {
      console.log('❌ Document generation failed:', result.data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error triggering document generation:', error);
    return null;
  }
}

// Function to check intake status
async function checkIntakeStatus(intakeId) {
  try {
    console.log('🔍 Checking intake status for:', intakeId);
    
    // Make API call to check status
    const response = await fetch(`/api/intake/${intakeId}`);
    const data = await response.json();
    
    console.log('📊 Intake status:', data);
    return data;
  } catch (error) {
    console.error('❌ Error checking intake status:', error);
    return null;
  }
}

// Auto-run for the current intake
const INTAKE_ID = 'e5e3d925-a050-4e7f-b061-c77eeef66802';

console.log('🔄 Auto-running document generation...');
setTimeout(() => {
  triggerDocumentGeneration(INTAKE_ID).then(result => {
    if (result) {
      console.log('🎉 Document generation completed successfully!');
    } else {
      console.log('ℹ️ Manual document generation may be required');
    }
  });
}, 2000);

// Export functions for manual use
window.triggerDocumentGeneration = triggerDocumentGeneration;
window.checkIntakeStatus = checkIntakeStatus;