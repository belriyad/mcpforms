const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'mcpforms-dev'
  });
}

const db = admin.firestore();

async function checkAndCreateIntake() {
  const intakeId = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
  
  try {
    console.log('🔍 Checking if intake exists...');
    
    // Check if intake exists
    const intakeDoc = await db.collection('intakes').doc(intakeId).get();
    
    if (intakeDoc.exists) {
      const data = intakeDoc.data();
      console.log('✅ Intake exists!');
      console.log('📊 Status:', data.status);
      console.log('📊 Service ID:', data.serviceId);
      console.log('📊 Link Token:', data.linkToken);
      return { exists: true, data };
    } else {
      console.log('❌ Intake does not exist. Creating it...');
      
      // Create a test intake
      const intakeData = {
        id: intakeId,
        serviceId: 'test-service-123',
        serviceName: 'Test Legal Service',
        linkToken: intakeId, // Using the same ID as token for simplicity
        status: 'opened',
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        clientData: {},
        formFields: [
          {
            id: 'clientName',
            name: 'clientName',
            type: 'text',
            label: 'Client Name',
            required: true,
            placeholder: 'Enter your full name'
          },
          {
            id: 'clientEmail',
            name: 'clientEmail',
            type: 'email',
            label: 'Client Email',
            required: true,
            placeholder: 'Enter your email address'
          },
          {
            id: 'clientPhone',
            name: 'clientPhone',
            type: 'text',
            label: 'Client Phone',
            required: false,
            placeholder: 'Enter your phone number'
          },
          {
            id: 'clientAddress',
            name: 'clientAddress',
            type: 'text',
            label: 'Client Address',
            required: false,
            placeholder: 'Enter your address'
          },
          {
            id: 'caseTitle',
            name: 'caseTitle',
            type: 'text',
            label: 'Case Title',
            required: true,
            placeholder: 'Enter the case title'
          },
          {
            id: 'caseType',
            name: 'caseType',
            type: 'select',
            label: 'Case Type',
            required: true,
            options: ['Contract Dispute', 'Personal Injury', 'Criminal Defense', 'Family Law', 'Corporate Law', 'Real Estate', 'Other']
          },
          {
            id: 'caseDescription',
            name: 'caseDescription',
            type: 'textarea',
            label: 'Case Description',
            required: true,
            placeholder: 'Provide detailed description of your case'
          },
          {
            id: 'estimatedDamages',
            name: 'estimatedDamages',
            type: 'text',
            label: 'Estimated Damages',
            required: false,
            placeholder: 'Enter estimated damages amount'
          },
          {
            id: 'retainerAmount',
            name: 'retainerAmount',
            type: 'text',
            label: 'Retainer Amount',
            required: false,
            placeholder: 'Enter retainer amount'
          },
          {
            id: 'opposingParty',
            name: 'opposingParty',
            type: 'text',
            label: 'Opposing Party',
            required: false,
            placeholder: 'Name of opposing party'
          },
          {
            id: 'previousLegalAction',
            name: 'previousLegalAction',
            type: 'textarea',
            label: 'Previous Legal Action',
            required: false,
            placeholder: 'Describe any previous legal actions taken'
          },
          {
            id: 'desiredOutcome',
            name: 'desiredOutcome',
            type: 'text',
            label: 'Desired Outcome',
            required: false,
            placeholder: 'What outcome are you seeking?'
          },
          {
            id: 'additionalNotes',
            name: 'additionalNotes',
            type: 'textarea',
            label: 'Additional Notes',
            required: false,
            placeholder: 'Any additional information you would like to provide'
          }
        ]
      };
      
      await db.collection('intakes').doc(intakeId).set(intakeData);
      console.log('✅ Intake created successfully!');
      
      return { exists: false, created: true, data: intakeData };
    }
    
  } catch (error) {
    console.error('❌ Error checking/creating intake:', error);
    return { error: error.message };
  }
}

async function testFormSubmission() {
  console.log('🧪 Testing form submission...');
  
  const testData = {
    intakeId: 'e5e3d925-a050-4e7f-b061-c77eeef66802',
    formData: {
      clientName: 'Sarah Elizabeth Thompson',
      clientEmail: 'sarah.thompson@lawfirm.com',
      clientPhone: '+1 (555) 987-6543',
      clientAddress: '456 Corporate Blvd, Suite 1200, Chicago, IL 60601',
      caseTitle: 'Thompson Holdings LLC v. Meridian Construction Corp',
      caseType: 'Contract Dispute',
      caseDescription: 'Complex commercial contract dispute involving a $2.5M construction project.',
      estimatedDamages: '$750,000',
      retainerAmount: '$25,000',
      opposingParty: 'Meridian Construction Corp and affiliated entities',
      previousLegalAction: 'Initial demand letter sent via certified mail on August 15, 2024.',
      desiredOutcome: 'Full compensatory damages, consequential damages, attorney fees, and injunctive relief',
      additionalNotes: 'Client has comprehensive documentation including construction contract, inspection reports, and expert engineering reports.'
    },
    clientInfo: {
      name: 'Sarah Elizabeth Thompson',
      email: 'sarah.thompson@lawfirm.com'
    }
  };
  
  try {
    // Update intake with form data
    await db.collection('intakes').doc(testData.intakeId).update({
      clientData: testData.formData,
      clientName: testData.clientInfo.name,
      clientEmail: testData.clientInfo.email,
      status: 'submitted',
      submittedAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Test form submission completed!');
    console.log('📊 Status updated to: submitted');
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Test submission error:', error);
    return { success: false, error: error.message };
  }
}

// Run the checks
console.log('🚀 Starting intake form diagnosis...');

checkAndCreateIntake()
  .then(result => {
    console.log('✅ Intake check completed:', result.exists ? 'Exists' : 'Created');
    
    // Test submission
    return testFormSubmission();
  })
  .then(submitResult => {
    if (submitResult.success) {
      console.log('🎉 DIAGNOSIS COMPLETE: Intake form is ready for submission!');
    } else {
      console.log('❌ DIAGNOSIS FAILED:', submitResult.error);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 CRITICAL ERROR:', error);
    process.exit(1);
  });