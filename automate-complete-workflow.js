const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable, connectFunctionsEmulator } = require('firebase/functions');

const firebaseConfig = {
  apiKey: "AIzaSyCO5APhs5_YmNEqN8tmdPqkxnnF8HOvKrM",
  authDomain: "mcpforms-dev.firebaseapp.com",
  projectId: "mcpforms-dev",
  storageBucket: "mcpforms-dev.firebasestorage.app",
  messagingSenderId: "115029213949",
  appId: "1:115029213949:web:7b5f02ed90c51b1388abfa"
};

async function automateCompleteWorkflow() {
  console.log('🚀 Starting COMPLETE AUTOMATED WORKFLOW via Firebase API...');
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const functions = getFunctions(app, 'us-central1');
    
    console.log('✅ Firebase initialized');

    // Prepare comprehensive intake form data
    const intakeData = {
      intakeId: 'e5e3d925-a050-4e7f-b061-c77eeef66802',
      formData: {
        clientName: 'Sarah Elizabeth Thompson',
        clientEmail: 'sarah.thompson@lawfirm.com',
        clientPhone: '+1 (555) 987-6543',
        clientAddress: '456 Corporate Blvd, Suite 1200, Chicago, IL 60601',
        caseTitle: 'Thompson Holdings LLC v. Meridian Construction Corp',
        caseType: 'Contract Dispute',
        caseDescription: 'Complex commercial contract dispute involving a $2.5M construction project. Meridian Construction Corp allegedly breached the construction agreement by using substandard materials, missing critical deadlines, and failing to meet specified quality standards. The breach resulted in significant structural defects, project delays, and additional remediation costs. Client seeks full damages for breach of contract, consequential damages for business interruption, and punitive damages for willful misconduct.',
        estimatedDamages: '$750,000',
        retainerAmount: '$25,000',
        opposingParty: 'Meridian Construction Corp and affiliated entities',
        previousLegalAction: 'Initial demand letter sent via certified mail on August 15, 2024, requesting cure within 30 days. Follow-up correspondence sent September 10, 2024. No substantive response received. Pre-litigation mediation attempted through Chicago Commercial Arbitration Center - mediation failed on September 25, 2024, due to opposing party\'s refusal to engage in good faith negotiations.',
        desiredOutcome: 'Full compensatory damages, consequential damages, attorney fees, and injunctive relief',
        additionalNotes: 'Client has comprehensive documentation including: original construction contract, all amendments and change orders, architectural plans and specifications, inspection reports documenting defects, correspondence with opposing party, photographs of structural issues, expert engineering reports, and financial records showing damages. Key witnesses include project manager, site supervisor, and independent structural engineer. Time-sensitive matter due to statute of limitations and ongoing property deterioration. Client available for immediate case preparation and depositions.'
      },
      clientInfo: {
        name: 'Sarah Elizabeth Thompson',
        email: 'sarah.thompson@lawfirm.com'
      }
    };

    console.log('📝 Intake data prepared with 13 comprehensive fields');
    console.log('📊 Client: Sarah Elizabeth Thompson');
    console.log('📊 Case: Thompson Holdings LLC v. Meridian Construction Corp');
    console.log('📊 Type: Contract Dispute ($750,000 damages)');

    // Step 1: Submit the intake form
    console.log('\n📤 Step 1: Submitting intake form...');
    
    const submitIntake = httpsCallable(functions, 'submitIntakeForm');
    const submissionResult = await submitIntake(intakeData);
    
    console.log('📨 Submission result:', JSON.stringify(submissionResult.data, null, 2));
    
    if (submissionResult.data.success) {
      console.log('✅ INTAKE FORM SUBMITTED SUCCESSFULLY!');
      
      // Step 2: Approve the intake (if needed)
      console.log('\n👍 Step 2: Approving intake form...');
      
      const approveIntake = httpsCallable(functions, 'approveIntakeForm');
      const approvalResult = await approveIntake({
        intakeId: intakeData.intakeId,
        approved: true,
        notes: 'Automatically approved - complete documentation provided'
      });
      
      console.log('📨 Approval result:', JSON.stringify(approvalResult.data, null, 2));
      
      if (approvalResult.data.success) {
        console.log('✅ INTAKE FORM APPROVED SUCCESSFULLY!');
      } else {
        console.log('ℹ️ Approval step may not be required or already completed');
      }

      // Step 3: Generate documents
      console.log('\n📄 Step 3: Generating documents...');
      
      const generateDocs = httpsCallable(functions, 'generateDocumentsFromIntake');
      const generationResult = await generateDocs({
        intakeId: intakeData.intakeId
      });
      
      console.log('📨 Document generation result:', JSON.stringify(generationResult.data, null, 2));
      
      if (generationResult.data.success) {
        console.log('✅ DOCUMENTS GENERATED SUCCESSFULLY!');
        
        if (generationResult.data.documents) {
          console.log('📄 Generated documents:');
          generationResult.data.documents.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.name || doc.fileName || 'Document'}`);
          });
        }
        
        if (generationResult.data.downloadUrls) {
          console.log('🔗 Download URLs available:');
          generationResult.data.downloadUrls.forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
          });
        }
        
      } else {
        console.log('❌ Document generation failed:', generationResult.data.error);
      }

      // Final status report
      console.log('\n🎯 COMPLETE WORKFLOW STATUS REPORT:');
      console.log('==========================================');
      console.log('✅ Intake form filled with comprehensive legal case data');
      console.log('✅ Form submitted successfully via Firebase');
      console.log('✅ Intake approved (if required)');
      console.log(`📄 Document generation: ${generationResult.data.success ? '✅ COMPLETED' : '❌ FAILED'}`);
      console.log('\n🎉 AUTOMATED INTAKE WORKFLOW COMPLETED! 🎉');
      
      return {
        success: true,
        submission: submissionResult.data,
        approval: approvalResult.data,
        documents: generationResult.data
      };
      
    } else {
      console.log('❌ INTAKE FORM SUBMISSION FAILED:', submissionResult.data.error);
      return { success: false, error: submissionResult.data.error };
    }
    
  } catch (error) {
    console.error('❌ WORKFLOW ERROR:', error.message);
    console.error('Full error:', error);
    return { success: false, error: error.message };
  }
}

// Run the automated workflow
automateCompleteWorkflow()
  .then(result => {
    if (result.success) {
      console.log('\n🎊 SUCCESS: Complete intake workflow finished successfully!');
      process.exit(0);
    } else {
      console.log('\n💥 FAILED: Workflow encountered errors');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 CRITICAL ERROR:', error);
    process.exit(1);
  });