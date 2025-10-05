const mammoth = require('mammoth');
const path = require('path');

// The actual client data and extracted fields from our trace
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

const EXTRACTED_FIELDS = [
  "trust_name",
  "grantor_names", 
  "successor_co_trustees",
  "current_trustees",
  "successor_trustees",
  "signature_authority",
  "county",
  "execution_day",
  "execution_month", 
  "execution_year",
  "notary_public_name",
  "notary_commission_expires"
];

async function diagnoseTemplatePlaceholderMismatch() {
  console.log('🔍 DIAGNOSING TEMPLATE PLACEHOLDER MISMATCH');
  console.log('═'.repeat(60));
  
  const templatePath = path.join(__dirname, 'src', 'sample', 'Certificate_of_Trust_Fillable Template.docx');
  
  try {
    // Extract raw text to see actual placeholders used in template
    const result = await mammoth.extractRawText({ path: templatePath });
    const text = result.value;
    
    console.log('📄 TEMPLATE CONTENT ANALYSIS:');
    console.log('═'.repeat(30));
    console.log(`Total characters: ${text.length}`);
    
    // Look for various placeholder patterns
    console.log('\n🔍 PLACEHOLDER PATTERNS IN TEMPLATE:');
    console.log('═'.repeat(30));
    
    const patterns = [
      { name: 'Quoted placeholders (e.g., "Trust\'s name")', regex: /"[^"]+"/g },
      { name: 'Curly braces (e.g., {{trustName}})', regex: /\{\{[^}]+\}\}/g },
      { name: 'Square brackets (e.g., [trustName])', regex: /\[[^\]]+\]/g },
      { name: 'Underscore fields (e.g., _trustName_)', regex: /_[A-Za-z\s]+_/g },
      { name: 'Form fields with colons (e.g., Name: ____)', regex: /[A-Za-z\s]+:\s*_+/g }
    ];
    
    const foundPlaceholders = [];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches && matches.length > 0) {
        console.log(`\n✅ ${pattern.name} (${matches.length} found):`);
        matches.forEach(match => {
          console.log(`   - "${match}"`);
          foundPlaceholders.push({ type: pattern.name, placeholder: match });
        });
      }
    });
    
    // Now compare with what our AI extracted as field names
    console.log('\n🤖 AI EXTRACTED FIELD NAMES:');
    console.log('═'.repeat(30));
    EXTRACTED_FIELDS.forEach((field, index) => {
      console.log(`${index + 1}. ${field}`);
    });
    
    console.log('\n📊 CLIENT DATA FIELDS:');
    console.log('═'.repeat(30));
    Object.entries(CLIENT_DATA).forEach(([key, value], index) => {
      console.log(`${index + 1}. ${key} = "${value}"`);
    });
    
    // Analyze the mismatch
    console.log('\n🚨 MISMATCH ANALYSIS:');
    console.log('═'.repeat(30));
    
    // The template likely uses quoted placeholders like "Trust's name" 
    // but the AI extracted field names like "trust_name"
    const likelyMismatches = [
      { template: '"Trust\'s name"', extracted: 'trust_name', client: 'trust_name' },
      { template: '"Grantor\'s name"', extracted: 'grantor_names', client: 'grantor_names' },
      { template: 'Trustee', extracted: 'current_trustees', client: 'current_trustees' },
      { template: 'County', extracted: 'county', client: 'county' }
    ];
    
    console.log('🔧 LIKELY FIELD MAPPING ISSUES:');
    likelyMismatches.forEach(issue => {
      console.log(`❌ Template: ${issue.template}`);
      console.log(`   AI Extracted: ${issue.extracted}`);
      console.log(`   Client Data: ${issue.client}`);
      console.log(`   Status: Template placeholder doesn't match extracted field name`);
      console.log('');
    });
    
    // Show specific content around key sections
    console.log('\n📄 TEMPLATE CONTENT SECTIONS:');
    console.log('═'.repeat(30));
    
    const sections = [
      { name: 'Trust Name Section', search: 'Trust' },
      { name: 'Grantor Section', search: 'Grantor' },
      { name: 'Trustee Section', search: 'Trustee' },
      { name: 'County Section', search: 'County' }
    ];
    
    sections.forEach(section => {
      const index = text.toLowerCase().indexOf(section.search.toLowerCase());
      if (index !== -1) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + 150);
        const context = text.substring(start, end);
        
        console.log(`\n${section.name}:`);
        console.log('─'.repeat(20));
        console.log(context.replace(/\n/g, '\\n'));
      }
    });
    
    // Provide specific fix recommendations
    console.log('\n🔧 SPECIFIC FIX RECOMMENDATIONS:');
    console.log('═'.repeat(40));
    console.log('1. UPDATE FIELD MAPPING RULES:');
    console.log('   Add these mappings to findSmartFieldMapping():');
    console.log('   ');
    console.log('   // Trust specific mappings');
    console.log('   "Trust\'s name": ["trust_name"],');
    console.log('   "Grantor\'s name": ["grantor_names"],');
    console.log('   "current_trustees": ["current_trustees"],');
    console.log('   "successor_co_trustees": ["successor_co_trustees"],');
    console.log('   ');
    console.log('2. IMPROVE AI TEMPLATE PARSING:');
    console.log('   The AI needs to recognize quoted placeholders like "Trust\'s name"');
    console.log('   Update the OpenAI prompt to extract these patterns');
    console.log('   ');
    console.log('3. ADD FLEXIBLE PLACEHOLDER MATCHING:');
    console.log('   The document generator should handle multiple placeholder formats');
    console.log('   Currently it only looks for {{fieldName}} format');
    
  } catch (error) {
    console.error('❌ Error analyzing template:', error);
  }
}

diagnoseTemplatePlaceholderMismatch().then(() => {
  console.log('\n✅ Diagnosis completed');
}).catch(error => {
  console.error('❌ Diagnosis error:', error);
});