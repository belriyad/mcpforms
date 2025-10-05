const { initializeApp } = require('firebase/app');
const { getFunctions, httpsCallable } = require('firebase/functions');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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
const functions = getFunctions(app);

// The artifact ID from the intake processing
const ARTIFACT_ID = 'b148ff18-86b0-4e2a-aca1-1d49306b9ce2';
const INTAKE_ID = '46ea3329-bc90-4c51-8644-2228958e7c73';

// Expected client data from the intake
const CLIENT_DATA = {
  "grantor_names": "saleh",
  "successor_co_trustees": "mahmoud", 
  "notary_commission_expires": "2025-10-14",
  "signature_authority": "Signatures of all Trustees",
  "notary_public_name": "mohammad",
  "county": "king  county",
  "execution_year": "2030",
  "successor_trustees": "soso", 
  "current_trustees": "belal riyad",
  "trust_name": "riyad trust",
  "execution_day": "22",
  "execution_month": "may"
};

async function analyzeGeneratedDocument() {
  console.log('🔍 ANALYZING GENERATED DOCUMENT FOR FIELD MAPPING ISSUES');
  console.log('═'.repeat(70));
  console.log(`🆔 Intake ID: ${INTAKE_ID}`);
  console.log(`📄 Artifact ID: ${ARTIFACT_ID}`);
  console.log('═'.repeat(70));
  
  try {
    // Download the generated document
    const getDownloadUrl = httpsCallable(functions, 'getDocumentDownloadUrl');
    const result = await getDownloadUrl({ artifactId: ARTIFACT_ID });
    
    if (!result.data.success) {
      console.log('❌ Failed to get download URL:', result.data.error);
      return;
    }
    
    const downloadUrl = result.data.data.downloadUrl;
    console.log('✅ Downloaded generated document for analysis');
    
    // Download and analyze the document
    const response = await fetch(downloadUrl);
    const buffer = await response.arrayBuffer();
    const tempPath = path.join(__dirname, `generated_${ARTIFACT_ID}.docx`);
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    
    // Extract text content
    const textResult = await mammoth.extractRawText({ path: tempPath });
    const text = textResult.value;
    
    console.log('\n📊 DOCUMENT ANALYSIS:');
    console.log('═'.repeat(30));
    console.log(`Total characters: ${text.length}`);
    console.log(`Total words: ${text.split(/\s+/).length}`);
    
    // Analyze field mapping success
    console.log('\n🔍 FIELD MAPPING ANALYSIS:');
    console.log('═'.repeat(30));
    
    const fieldMappingResults = [];
    
    Object.entries(CLIENT_DATA).forEach(([fieldName, expectedValue]) => {
      const escapedValue = expectedValue.toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedValue, 'gi');
      const matches = text.match(regex);
      
      const result = {
        field: fieldName,
        expectedValue: expectedValue,
        found: matches ? matches.length : 0,
        status: matches ? '✅ FOUND' : '❌ MISSING'
      };
      
      fieldMappingResults.push(result);
      console.log(`${result.status} ${fieldName}: "${expectedValue}" (${result.found} occurrences)`);
    });
    
    // Calculate success rate
    const foundFields = fieldMappingResults.filter(r => r.found > 0).length;
    const totalFields = fieldMappingResults.length;
    const successRate = ((foundFields / totalFields) * 100).toFixed(1);
    
    console.log(`\n📈 Field Mapping Success Rate: ${successRate}% (${foundFields}/${totalFields})`);
    
    // Look for common placeholder patterns that might indicate mapping failures
    console.log('\n🚨 UNMAPPED PLACEHOLDER DETECTION:');
    console.log('═'.repeat(30));
    
    const placeholderPatterns = [
      { name: 'Quoted placeholders', regex: /"[^"]*"/g },
      { name: 'Curly braces', regex: /\{\{[^}]+\}\}/g },
      { name: 'Square brackets', regex: /\[[^\]]+\]/g },
      { name: 'Underscore fields', regex: /_[A-Za-z\s]+_/g },
      { name: 'Template variables', regex: /\$\{[^}]+\}/g }
    ];
    
    let foundUnmappedPlaceholders = false;
    placeholderPatterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches && matches.length > 0) {
        console.log(`❌ ${pattern.name} (${matches.length} found):`);
        matches.slice(0, 5).forEach(match => {
          console.log(`   - "${match}"`);
        });
        if (matches.length > 5) {
          console.log(`   ... and ${matches.length - 5} more`);
        }
        foundUnmappedPlaceholders = true;
      }
    });
    
    if (!foundUnmappedPlaceholders) {
      console.log('✅ No obvious unmapped placeholders detected');
    }
    
    // Show document structure around trust name
    console.log('\n📄 DOCUMENT STRUCTURE ANALYSIS:');
    console.log('═'.repeat(30));
    
    const trustNameIndex = text.toLowerCase().indexOf('trust');
    if (trustNameIndex !== -1) {
      const contextStart = Math.max(0, trustNameIndex - 100);
      const contextEnd = Math.min(text.length, trustNameIndex + 200);
      const context = text.substring(contextStart, contextEnd);
      
      console.log('Trust context (±100 chars):');
      console.log('─'.repeat(50));
      console.log(context.replace(/\n/g, '\\n'));
    }
    
    // Look for Certificate of Trust specific content
    console.log('\n🏛️ CERTIFICATE OF TRUST CONTENT VERIFICATION:');
    console.log('═'.repeat(30));
    
    const certElements = [
      'CERTIFICATE OF TRUST',
      'Grantor',
      'Trustee', 
      'Trust',
      'County',
      'Notary'
    ];
    
    certElements.forEach(element => {
      const regex = new RegExp(element, 'gi');
      const matches = text.match(regex);
      console.log(`${matches ? '✅' : '❌'} ${element}: ${matches ? matches.length : 0} occurrences`);
    });
    
    // Clean up
    fs.unlinkSync(tempPath);
    console.log('\n✅ Analysis completed, temporary file cleaned up');
    
    return {
      successRate: parseFloat(successRate),
      foundFields,
      totalFields,
      fieldMappingResults,
      hasUnmappedPlaceholders: foundUnmappedPlaceholders
    };
    
  } catch (error) {
    console.error('❌ Error analyzing document:', error);
    return null;
  }
}

async function identifyMappingIssues(analysisResult) {
  if (!analysisResult) return;
  
  console.log('\n🔍 FIELD MAPPING ISSUE ANALYSIS:');
  console.log('═'.repeat(40));
  
  const missingFields = analysisResult.fieldMappingResults.filter(r => r.found === 0);
  
  if (missingFields.length > 0) {
    console.log('❌ MISSING FIELD MAPPINGS:');
    missingFields.forEach(field => {
      console.log(`   - ${field.field}: "${field.expectedValue}"`);
    });
    
    console.log('\n💡 POTENTIAL CAUSES:');
    console.log('   1. Template placeholders don\'t match extracted field names');
    console.log('   2. AI field mapping rules need adjustment'); 
    console.log('   3. Template uses different placeholder syntax');
    console.log('   4. Field names were modified during extraction');
    
    console.log('\n🔧 RECOMMENDED FIXES:');
    console.log('   1. Check template placeholders vs extracted field names');
    console.log('   2. Update field mapping rules in documentGenerator.ts');
    console.log('   3. Add more flexible placeholder matching');
    console.log('   4. Improve AI template analysis prompts');
  } else {
    console.log('✅ All fields successfully mapped!');
  }
  
  if (analysisResult.hasUnmappedPlaceholders) {
    console.log('\n⚠️ UNMAPPED PLACEHOLDERS DETECTED:');
    console.log('   - Template contains placeholders that weren\'t filled');
    console.log('   - This suggests the AI mapping didn\'t recognize all placeholders');
    console.log('   - Consider expanding the findSmartFieldMapping function');
  }
  
  console.log(`\n📊 OVERALL ASSESSMENT:`);
  if (analysisResult.successRate >= 80) {
    console.log('✅ GOOD: Field mapping is working well');
  } else if (analysisResult.successRate >= 60) {
    console.log('⚠️ MODERATE: Field mapping needs improvement');  
  } else {
    console.log('❌ POOR: Field mapping requires significant fixes');
  }
}

async function main() {
  const result = await analyzeGeneratedDocument();
  await identifyMappingIssues(result);
}

main().catch(error => {
  console.error('❌ Script error:', error);
});