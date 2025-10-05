const mammoth = require('mammoth');
const admin = require('firebase-admin');

// Initialize without service account for read-only access
admin.initializeApp({
  storageBucket: 'formgenai-4545.firebasestorage.app'
});

const bucket = admin.storage().bucket();

(async () => {
  try {
    const file = bucket.file('templates/b0cb5e46-1234-5678-9abc-def012345678/Certificate_of_Trust_Revocable_Living_Family_Trust.docx');
    const [buffer] = await file.download();
    const result = await mammoth.extractRawText({buffer});
    const text = result.value;
    
    console.log('🔍 SEARCHING FOR MISSING FIELD PATTERNS:\n');
    
    // Search for notary commission expires
    console.log('1️⃣ NOTARY COMMISSION EXPIRES:');
    const notaryLines = text.split('\n').filter(line => 
      line.toLowerCase().includes('notary') && 
      (line.toLowerCase().includes('commission') || line.toLowerCase().includes('expires'))
    );
    notaryLines.forEach(line => console.log('   ', line));
    
    console.log('\n2️⃣ EXECUTION YEAR (looking for year patterns):');
    const yearLines = text.split('\n').filter(line => 
      /year|20\d{2}|\b\d{4}\b/.test(line.toLowerCase())
    );
    yearLines.slice(0, 10).forEach(line => console.log('   ', line));
    
    console.log('\n3️⃣ CURRENT TRUSTEES:');
    const trusteeLines = text.split('\n').filter(line => 
      line.toLowerCase().includes('current') && line.toLowerCase().includes('trustee')
    );
    trusteeLines.forEach(line => console.log('   ', line));
    
    // Also search for just "trustee" near top of document
    console.log('\n4️⃣ ALL TRUSTEE REFERENCES (first 20):');
    const allTrusteeLines = text.split('\n').filter(line => 
      line.toLowerCase().includes('trustee')
    );
    allTrusteeLines.slice(0, 20).forEach(line => console.log('   ', line));
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
})();
