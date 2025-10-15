/**
 * 🔍 Data Flow Diagnostic Script
 * 
 * Purpose: Diagnose why intake form data is not appearing in generated documents
 * 
 * This script checks:
 * 1. Intake document exists and has data
 * 2. clientData field is populated
 * 3. Field naming conventions
 * 4. Data completeness
 * 5. Generated documents
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Try to use default credentials or application default
try {
  admin.initializeApp({
    projectId: 'formgenai-4545'
  });
} catch (error) {
  console.log('⚠️  Note: Using existing Firebase app instance');
}

const db = admin.firestore();

async function diagnoseDataFlow() {
  // Use the service ID from the successful E2E test
  const intakeId = 'WhilgLHSiGPRWKAoFwQ3';
  
  console.log('🔍 ===================================================================');
  console.log('🔍 DATA FLOW DIAGNOSTIC - Principal Engineer Analysis');
  console.log('🔍 ===================================================================\n');
  console.log(`📋 Testing Intake ID: ${intakeId}\n`);
  
  try {
    // ========================================================================
    // Step 1: Check if intake document exists
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 1: Verify Intake Document Exists');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const intakeDoc = await db.collection('intakes').doc(intakeId).get();
    
    if (!intakeDoc.exists) {
      console.log('❌ CRITICAL ERROR: Intake document not found!');
      console.log('   This means the intake was never created or wrong ID provided.\n');
      return;
    }
    
    console.log('✅ Intake document exists in Firestore');
    
    const intake = intakeDoc.data();
    console.log(`   Service ID: ${intake.serviceId || 'N/A'}`);
    console.log(`   Status: ${intake.status || 'N/A'}`);
    console.log(`   Created: ${intake.createdAt?.toDate() || 'N/A'}`);
    console.log(`   Submitted: ${intake.submittedAt?.toDate() || 'N/A'}`);
    console.log(`   Updated: ${intake.updatedAt?.toDate() || 'N/A'}\n`);
    
    // ========================================================================
    // Step 2: Analyze clientData field
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 2: Analyze Client Data Field');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    if (!intake.clientData) {
      console.log('❌ CRITICAL ERROR: clientData field is missing!');
      console.log('   This means form data was never saved to Firestore.');
      console.log('\n💡 Root Cause: Form submission not storing data');
      console.log('   → Check: src/app/api/intake/[token]/submit/route.ts');
      console.log('   → Check: functions/src/services/intakeManager.ts line 294\n');
      return;
    }
    
    console.log('✅ clientData field exists');
    
    const fieldCount = Object.keys(intake.clientData).length;
    console.log(`   Number of fields: ${fieldCount}`);
    
    if (fieldCount === 0) {
      console.log('\n❌ CRITICAL ERROR: clientData is empty object {}');
      console.log('   Form data exists but contains no fields.');
      console.log('\n💡 Root Cause: Form fields not being collected');
      console.log('   → Check: Frontend form field names');
      console.log('   → Check: Form submission handling\n');
      return;
    }
    
    console.log('✅ clientData has fields\n');
    
    // ========================================================================
    // Step 3: Field naming convention analysis
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 3: Field Naming Convention Analysis');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const fields = Object.keys(intake.clientData);
    const snakeCaseFields = fields.filter(f => f.includes('_'));
    const camelCaseFields = fields.filter(f => /[A-Z]/.test(f) && !f.includes('_'));
    const otherFields = fields.filter(f => !f.includes('_') && !/[A-Z]/.test(f));
    
    console.log('📊 Field Naming Breakdown:');
    console.log(`   snake_case fields: ${snakeCaseFields.length}`);
    console.log(`   camelCase fields: ${camelCaseFields.length}`);
    console.log(`   lowercase fields: ${otherFields.length}`);
    console.log(`   Total: ${fields.length}\n`);
    
    if (snakeCaseFields.length > 0) {
      console.log('✅ snake_case fields (expected for templates):');
      snakeCaseFields.forEach(field => {
        const value = intake.clientData[field];
        console.log(`   • ${field}: "${value}"`);
      });
      console.log();
    }
    
    if (camelCaseFields.length > 0) {
      console.log('⚠️  camelCase fields (may cause issues):');
      camelCaseFields.forEach(field => {
        const value = intake.clientData[field];
        console.log(`   • ${field}: "${value}"`);
      });
      console.log('\n💡 LIKELY ISSUE: Templates expect snake_case, but fields are camelCase');
      console.log('   → Solution: Add field normalization in intakeManager.ts\n');
    }
    
    if (otherFields.length > 0) {
      console.log('📝 lowercase fields:');
      otherFields.forEach(field => {
        const value = intake.clientData[field];
        console.log(`   • ${field}: "${value}"`);
      });
      console.log();
    }
    
    // ========================================================================
    // Step 4: Data completeness check
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 4: Data Completeness Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const emptyFields = [];
    const populatedFields = [];
    
    for (const [key, value] of Object.entries(intake.clientData)) {
      if (!value || value === '' || value === null || value === undefined) {
        emptyFields.push(key);
      } else {
        populatedFields.push({ key, value });
      }
    }
    
    if (emptyFields.length > 0) {
      console.log(`⚠️  Warning: ${emptyFields.length} fields have no value:`);
      emptyFields.forEach(field => console.log(`   • ${field}`));
      console.log();
    }
    
    if (populatedFields.length > 0) {
      console.log(`✅ ${populatedFields.length} fields have values:`);
      populatedFields.forEach(({ key, value }) => {
        const displayValue = typeof value === 'string' && value.length > 50 
          ? value.substring(0, 50) + '...' 
          : value;
        console.log(`   • ${key}: "${displayValue}"`);
      });
      console.log();
    }
    
    // ========================================================================
    // Step 5: Full clientData dump
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 5: Full Client Data JSON');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(JSON.stringify(intake.clientData, null, 2));
    console.log();
    
    // ========================================================================
    // Step 6: Check generated documents
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 6: Generated Documents Check');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const artifacts = await db.collection('documentArtifacts')
      .where('intakeId', '==', intakeId)
      .get();
    
    if (artifacts.empty) {
      console.log('⚠️  No documents generated yet for this intake');
      console.log('   Documents may still be processing or generation failed.\n');
    } else {
      console.log(`✅ Found ${artifacts.size} generated document(s):\n`);
      
      for (const doc of artifacts.docs) {
        const artifact = doc.data();
        console.log(`   📄 Document: ${artifact.fileName}`);
        console.log(`      ID: ${doc.id}`);
        console.log(`      Status: ${artifact.status}`);
        console.log(`      Generated: ${artifact.generatedAt?.toDate() || 'N/A'}`);
        console.log(`      File URL: ${artifact.fileUrl || 'N/A'}`);
        console.log(`      Template: ${artifact.templateName || 'N/A'}`);
        console.log();
      }
    }
    
    // ========================================================================
    // Step 7: Diagnosis and recommendations
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('STEP 7: Diagnosis & Recommendations');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Determine most likely issue
    if (fieldCount === 0) {
      console.log('🔴 CRITICAL: No data in clientData');
      console.log('\n💡 Action Plan:');
      console.log('   1. Add logging to form submission API route');
      console.log('   2. Check frontend form field collection');
      console.log('   3. Verify FormData is being properly serialized\n');
      
    } else if (camelCaseFields.length > 0 && snakeCaseFields.length === 0) {
      console.log('🎯 HIGHLY LIKELY ISSUE: Field Name Mismatch');
      console.log('\n🔍 Problem:');
      console.log('   • All fields are in camelCase format');
      console.log('   • Templates expect snake_case format');
      console.log('   • Example: "trustName" vs "trust_name"');
      console.log('   • AI cannot match fields to template placeholders\n');
      
      console.log('✅ Solution: Implement Field Normalization');
      console.log('\n📝 Step 1: Create field normalizer utility');
      console.log('   File: functions/src/utils/fieldNormalizer.ts');
      console.log('   Code:');
      console.log('   ```typescript');
      console.log('   export function normalizeFieldNames(data: Record<string, any>): Record<string, any> {');
      console.log('     const normalized: Record<string, any> = {};');
      console.log('     for (const [key, value] of Object.entries(data)) {');
      console.log('       // Convert camelCase to snake_case');
      console.log('       const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);');
      console.log('       normalized[snakeKey] = value;');
      console.log('     }');
      console.log('     return normalized;');
      console.log('   }');
      console.log('   ```\n');
      
      console.log('📝 Step 2: Use in intakeManager.ts (line 294)');
      console.log('   ```typescript');
      console.log('   import { normalizeFieldNames } from "../utils/fieldNormalizer";');
      console.log('   ');
      console.log('   const updates: Partial<Intake> = {');
      console.log('     clientData: normalizeFieldNames(formData), // ← Add this');
      console.log('     status: "submitted",');
      console.log('     // ...');
      console.log('   };');
      console.log('   ```\n');
      
      console.log('📝 Expected Result:');
      console.log('   Before: { trustName: "Riyad Trust" }');
      console.log('   After:  { trust_name: "Riyad Trust" } ✅\n');
      
    } else if (emptyFields.length > fields.length / 2) {
      console.log('⚠️  WARNING: Most fields are empty');
      console.log('\n💡 Action Plan:');
      console.log('   1. Check form validation is working');
      console.log('   2. Ensure required fields are marked correctly');
      console.log('   3. Add frontend validation before submission\n');
      
    } else {
      console.log('✅ Data structure looks good');
      console.log('\n💡 Next Steps:');
      console.log('   1. Download generated document and inspect manually');
      console.log('   2. Check if AI is following prompt instructions');
      console.log('   3. Review OpenAI generation logs');
      console.log('   4. Consider adding explicit field mapping in prompt\n');
    }
    
    // ========================================================================
    // Summary
    // ========================================================================
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`📊 Intake Status: ${intake.status}`);
    console.log(`📊 Fields in clientData: ${fieldCount}`);
    console.log(`📊 Populated fields: ${populatedFields.length}`);
    console.log(`📊 Empty fields: ${emptyFields.length}`);
    console.log(`📊 Documents generated: ${artifacts.size}`);
    console.log(`📊 Field naming: ${snakeCaseFields.length} snake_case, ${camelCaseFields.length} camelCase\n`);
    
    if (camelCaseFields.length > 0 && snakeCaseFields.length === 0) {
      console.log('🎯 PRIMARY ISSUE: Field Name Mismatch (camelCase vs snake_case)');
      console.log('⏱️  Estimated Fix Time: 30 minutes');
      console.log('📋 Fix Priority: P0 CRITICAL\n');
    }
    
    console.log('✅ Diagnostic complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error during diagnostic:', error);
    console.error('\nStack trace:', error.stack);
  }
}

// Run the diagnostic
console.log('Starting diagnostic...\n');
diagnoseDataFlow()
  .then(() => {
    console.log('Diagnostic finished successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
