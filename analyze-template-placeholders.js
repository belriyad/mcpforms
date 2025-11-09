/**
 * Analyze template to see what placeholders it contains
 */
const admin = require('firebase-admin');
const mammoth = require('mammoth');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID,
  clientEmail: process.env.ADMIN_CLIENT_EMAIL,
  privateKey: process.env.ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.ADMIN_STORAGE_BUCKET
});

const storage = admin.storage();

async function analyzeTemplate() {
  try {
    const templatePath = 'templates/vG3EIO5Xdrsh3fkS8M8v/002_Certificate_of_Trust_Fillable_Template_cb0de58b-3935-440c-8b7b-fe16bd6b8859_E2E_Test_Client_Final-2.docx';
    
    console.log('📥 Downloading template:', templatePath);
    const file = storage.bucket().file(templatePath);
    const [buffer] = await file.download();
    
    console.log('✅ Template downloaded, size:', buffer.length, 'bytes');
    
    // Extract raw text
    console.log('\n📄 Extracting text content...');
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value;
    
    console.log('✅ Extracted', text.length, 'characters');
    console.log('\n' + '='.repeat(80));
    console.log('TEMPLATE CONTENT (first 2000 chars):');
    console.log('='.repeat(80));
    console.log(text.substring(0, 2000));
    console.log('\n' + '='.repeat(80));
    
    // Look for different placeholder patterns
    console.log('\n🔍 Searching for placeholder patterns...\n');
    
    const patterns = [
      { name: 'Docxtemplater {field}', regex: /\{[a-zA-Z_][a-zA-Z0-9_]*\}/g },
      { name: 'Double braces {{field}}', regex: /\{\{[a-zA-Z_][a-zA-Z0-9_]*\}\}/g },
      { name: 'Square brackets [field]', regex: /\[[a-zA-Z_][a-zA-Z0-9_]*\]/g },
      { name: 'Angle brackets <<field>>', regex: /<<[a-zA-Z_][a-zA-Z0-9_]*>>/g },
      { name: 'Dollar signs $field$', regex: /\$[a-zA-Z_][a-zA-Z0-9_]*\$/g },
      { name: 'Underscores ___', regex: /_{3,}/g },
      { name: 'Brackets with spaces [ field ]', regex: /\[\s*[^\]]+\s*\]/g },
    ];
    
    for (const pattern of patterns) {
      const matches = text.match(pattern.regex);
      if (matches && matches.length > 0) {
        console.log(`✅ Found ${matches.length} ${pattern.name} placeholders:`);
        const unique = [...new Set(matches)];
        unique.slice(0, 20).forEach(m => console.log(`   - ${m}`));
        if (unique.length > 20) {
          console.log(`   ... and ${unique.length - 20} more`);
        }
        console.log();
      } else {
        console.log(`❌ No ${pattern.name} placeholders found`);
      }
    }
    
    // Look for our expected field names in the text (case insensitive)
    console.log('\n🔍 Searching for expected field names (any format)...\n');
    const expectedFields = [
      'trust_name',
      'grantor_names',
      'successor_co_trustees',
      'current_co_trustees',
      'successor_trustees',
      'trustee_signatures_requirement',
      'tax_identification_number',
      'property_title_date',
      'execution_date',
      'notary_public_name',
      'notary_expiration_date'
    ];
    
    for (const field of expectedFields) {
      const regex = new RegExp(field.replace(/_/g, '[\\s_]*'), 'i');
      const found = text.match(regex);
      if (found) {
        console.log(`✅ "${field}" found as: "${found[0]}"`);
      } else {
        console.log(`❌ "${field}" NOT found in template`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeTemplate();
