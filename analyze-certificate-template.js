const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

async function analyzeOriginalTemplate() {
  const templatePath = path.join(__dirname, 'src', 'sample', 'Certificate_of_Trust_Fillable Template.docx');
  
  if (!fs.existsSync(templatePath)) {
    console.log('❌ Original template not found at:', templatePath);
    return;
  }
  
  console.log('📄 Analyzing Certificate of Trust Template');
  console.log('═'.repeat(50));
  
  try {
    // Extract text content
    const result = await mammoth.extractRawText({ path: templatePath });
    const text = result.value;
    
    console.log('📊 Template Statistics:');
    console.log(`   - Total characters: ${text.length}`);
    console.log(`   - Total words: ${text.split(/\s+/).length}`);
    console.log(`   - Total lines: ${text.split('\n').length}`);
    
    // Look for placeholder patterns
    console.log('\n🔍 Placeholder Analysis:');
    
    // Common placeholder patterns
    const patterns = [
      { name: 'Curly braces', regex: /\{\{[^}]+\}\}/g },
      { name: 'Square brackets', regex: /\[[^\]]+\]/g },
      { name: 'Underscore fields', regex: /_[A-Za-z\s]+_/g },
      { name: 'Quoted placeholders', regex: /"[^"]*"/g },
      { name: 'All caps words', regex: /\b[A-Z]{3,}\b/g },
      { name: 'Form field pattern', regex: /\b\w+\s*:\s*_+/g }
    ];
    
    patterns.forEach(pattern => {
      const matches = text.match(pattern.regex);
      if (matches && matches.length > 0) {
        console.log(`\n   ${pattern.name} (${matches.length} found):`);
        matches.slice(0, 10).forEach(match => {
          console.log(`     - "${match}"`);
        });
        if (matches.length > 10) {
          console.log(`     ... and ${matches.length - 10} more`);
        }
      }
    });
    
    // Look for specific trust-related terms
    console.log('\n🏛️ Trust Document Elements:');
    const trustTerms = [
      'trustee', 'grantor', 'beneficiary', 'trust', 'certificate',
      'successor', 'revocable', 'irrevocable', 'dated', 'county'
    ];
    
    trustTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      const matches = text.match(regex);
      if (matches) {
        console.log(`   - "${term}": ${matches.length} occurrences`);
      }
    });
    
    // Show first 500 characters
    console.log('\n📄 Document Preview (first 500 chars):');
    console.log('─'.repeat(50));
    console.log(text.substring(0, 500) + '...');
    
    // Show last 300 characters
    console.log('\n📄 Document End (last 300 chars):');
    console.log('─'.repeat(50));
    console.log('...' + text.substring(text.length - 300));
    
  } catch (error) {
    console.error('❌ Error analyzing template:', error);
  }
}

analyzeOriginalTemplate().then(() => {
  console.log('\n✅ Template analysis completed');
}).catch(error => {
  console.error('❌ Analysis error:', error);
});