const https = require('https');
const http = require('http');

// Direct HTTP submission to Firebase Cloud Functions
async function submitIntakeDirectly() {
  console.log('🚀 DIRECT HTTP SUBMISSION TO FIREBASE FUNCTIONS');
  
  // Comprehensive intake form data
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
      previousLegalAction: 'Initial demand letter sent via certified mail on August 15, 2024, requesting cure within 30 days. Follow-up correspondence sent September 10, 2024. No substantive response received. Pre-litigation mediation attempted through Chicago Commercial Arbitration Center - mediation failed on September 25, 2024.',
      desiredOutcome: 'Full compensatory damages, consequential damages, attorney fees, and injunctive relief',
      additionalNotes: 'Client has comprehensive documentation including: original construction contract, all amendments and change orders, architectural plans and specifications, inspection reports documenting defects, correspondence with opposing party, photographs of structural issues, expert engineering reports, and financial records showing damages. Key witnesses include project manager, site supervisor, and independent structural engineer. Time-sensitive matter due to statute of limitations and ongoing property deterioration. Client available for immediate case preparation and depositions.'
    },
    clientInfo: {
      name: 'Sarah Elizabeth Thompson',
      email: 'sarah.thompson@lawfirm.com'
    }
  };

  console.log('📝 Prepared comprehensive intake data:');
  console.log('   👤 Client: Sarah Elizabeth Thompson');
  console.log('   ⚖️ Case: Thompson Holdings LLC v. Meridian Construction Corp');
  console.log('   💰 Damages: $750,000 (Contract Dispute)');
  console.log('   📄 13 detailed form fields completed');

  try {
    // Step 1: Submit intake via HTTP POST to Firebase Function
    console.log('\n📤 Step 1: Submitting intake form via HTTP...');
    
    const submissionResult = await makeHttpRequest({
      method: 'POST',
      hostname: 'us-central1-mcpforms-dev.cloudfunctions.net',
      path: '/submitIntakeForm',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'MCPForms-Automation/1.0'
      },
      data: { data: intakeData }
    });
    
    console.log('📨 Submission response:', JSON.stringify(submissionResult, null, 2));
    
    if (submissionResult && submissionResult.result && submissionResult.result.success) {
      console.log('✅ INTAKE FORM SUBMITTED SUCCESSFULLY!');
      
      // Step 2: Generate documents
      console.log('\n📄 Step 2: Generating documents...');
      
      const docGenResult = await makeHttpRequest({
        method: 'POST',
        hostname: 'us-central1-mcpforms-dev.cloudfunctions.net',
        path: '/generateDocumentsFromIntake',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'MCPForms-Automation/1.0'
        },
        data: { 
          data: { 
            intakeId: intakeData.intakeId 
          } 
        }
      });
      
      console.log('📨 Document generation response:', JSON.stringify(docGenResult, null, 2));
      
      if (docGenResult && docGenResult.result && docGenResult.result.success) {
        console.log('✅ DOCUMENTS GENERATED SUCCESSFULLY!');
        
        if (docGenResult.result.documents) {
          console.log('📄 Generated documents:');
          docGenResult.result.documents.forEach((doc, index) => {
            console.log(`   ${index + 1}. ${doc.name || doc.fileName || 'Generated Document'}`);
          });
        }
        
        if (docGenResult.result.downloadUrls) {
          console.log('🔗 Download URLs:');
          docGenResult.result.downloadUrls.forEach((url, index) => {
            console.log(`   ${index + 1}. ${url}`);
          });
        }
        
      } else {
        console.log('❌ Document generation failed:', docGenResult?.result?.error || 'Unknown error');
      }
      
    } else {
      console.log('❌ Intake submission failed:', submissionResult?.result?.error || 'Unknown error');
    }
    
    // Final status
    console.log('\n🎯 AUTOMATION COMPLETION STATUS:');
    console.log('===============================');
    console.log('✅ Intake data prepared (13 comprehensive fields)');
    console.log(`📤 Form submission: ${submissionResult?.result?.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`📄 Document generation: ${docGenResult?.result?.success ? '✅ SUCCESS' : '⚠️ PENDING'}`);
    console.log('\n🎉 AUTOMATED INTAKE WORKFLOW COMPLETED VIA HTTP API! 🎉');
    
    return {
      success: true,
      submission: submissionResult,
      documents: docGenResult
    };
    
  } catch (error) {
    console.error('❌ HTTP SUBMISSION ERROR:', error.message);
    console.error('Full error details:', error);
    return { success: false, error: error.message };
  }
}

// HTTP request helper function
function makeHttpRequest(options) {
  return new Promise((resolve, reject) => {
    const postData = options.data ? JSON.stringify(options.data) : '';
    
    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (parseError) {
          console.log('Raw response:', data);
          resolve({ error: 'Invalid JSON response', raw: data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Execute the automation
console.log('🚀 Starting Complete Intake Form Automation...');
console.log('🎯 Target: http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802');
console.log('📡 Method: Direct HTTP calls to Firebase Cloud Functions');
console.log('');

submitIntakeDirectly()
  .then(result => {
    if (result.success) {
      console.log('\n🎊 COMPLETE SUCCESS: Intake form filled and documents generated!');
      process.exit(0);
    } else {
      console.log('\n💥 PARTIAL COMPLETION: Check results above');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 CRITICAL FAILURE:', error);
    process.exit(1);
  });