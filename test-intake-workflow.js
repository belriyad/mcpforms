import { getFunctions, httpsCallable } from 'firebase/functions';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyCO5APhs5_YmNEqN8tmdPqkxnnF8HOvKrM",
  authDomain: "mcpforms-dev.firebaseapp.com",
  projectId: "mcpforms-dev",
  storageBucket: "mcpforms-dev.firebasestorage.app",
  messagingSenderId: "115029213949",
  appId: "1:115029213949:web:7b5f02ed90c51b1388abfa"
};

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

async function testIntakeSubmission() {
  try {
    console.log('🚀 Testing intake form submission...');
    
    // Test data
    const testIntakeData = {
      intakeId: 'e5e3d925-a050-4e7f-b061-c77eeef66802',
      formData: {
        clientName: 'John Michael Smith',
        clientEmail: 'john.smith@email.com',
        clientPhone: '+1 (555) 123-4567',
        clientAddress: '123 Main Street, Suite 400, New York, NY 10001',
        caseTitle: 'Smith v. ABC Corporation',
        caseType: 'Contract Dispute',
        caseDescription: 'Contract dispute involving breach of service agreement. Client claims ABC Corporation failed to deliver services as specified in the contract signed on January 15, 2024. Seeking damages for lost revenue and additional costs incurred due to breach.',
        estimatedDamages: '$50,000',
        retainerAmount: '$10,000',
        opposingParty: 'ABC Corporation Inc.',
        previousLegalAction: 'No previous legal action taken. Initial demand letter sent on March 1, 2024, with 30-day response deadline. No response received.',
        desiredOutcome: 'Financial compensation and contract termination',
        additionalNotes: 'Client has all relevant documentation including signed contract, email correspondence, and invoices. Available for immediate consultation and case preparation.'
      },
      clientInfo: {
        name: 'John Michael Smith',
        email: 'john.smith@email.com'
      }
    };
    
    // Submit the intake form
    console.log('📝 Submitting intake form...');
    const submitIntakeForm = httpsCallable(functions, 'submitIntakeForm');
    const result = await submitIntakeForm(testIntakeData);
    
    console.log('📊 Submission result:', result.data);
    
    if (result.data.success) {
      console.log('✅ Intake form submitted successfully!');
      
      // Now test document generation
      console.log('🔄 Testing document generation...');
      
      const generateDocuments = httpsCallable(functions, 'generateDocumentsFromIntake');
      const docResult = await generateDocuments({ intakeId: testIntakeData.intakeId });
      
      console.log('📄 Document generation result:', docResult.data);
      
      if (docResult.data.success) {
        console.log('✅ Documents generated successfully!');
        console.log('🎉 COMPLETE WORKFLOW TEST SUCCESSFUL! 🎉');
      } else {
        console.log('❌ Document generation failed:', docResult.data.error);
      }
    } else {
      console.log('❌ Intake submission failed:', result.data.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIntakeSubmission();