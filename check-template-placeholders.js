const admin = require('firebase-admin');
const PizZip = require('pizzip');

// Initialize Firebase
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'formgenai-4545',
    storageBucket: 'formgenai-4545.appspot.com'
  });
} catch (e) {
  // Already initialized
}

async function checkTemplatePlaceholders() {
  try {
    const bucket = admin.storage().bucket();
    const templateFile = bucket.file('templates/001 Certificate_of_Trust_Fillable Template.docx');
    
    console.log('Downloading template...');
    const [templateBuffer] = await templateFile.download();
    
    console.log('Analyzing template content...');
    const zip = new PizZip(templateBuffer);
    const documentXml = zip.files['word/document.xml'];
    
    if (documentXml) {
      const xmlContent = documentXml.asText();
      console.log('Document XML length:', xmlContent.length);
      
      // Look for standard docxtemplater placeholders
      const standardPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
      console.log('Standard placeholders {{field}}:', standardPlaceholders);
      
      // Look for quoted placeholders containing our target words
      const quotedMatches = xmlContent.match(/"[^"]*(?:name|trust|county|day|month|year|expires|authority|grantor|trustee)[^"]*"/gi);
      console.log('Quoted placeholders found:', quotedMatches);
      
      // Look for specific quoted patterns we expect
      const targetQuoted = [
        "Trust's name",
        "Grantor's name", 
        "county",
        "execution day",
        "execution month",
        "execution year",
        "notary commission expires",
        "signature authority"
      ];
      
      console.log('\n=== CHECKING FOR SPECIFIC QUOTED PLACEHOLDERS ===');
      for (const target of targetQuoted) {
        const quotedTarget = '"' + target + '"';
        if (xmlContent.includes(quotedTarget)) {
          console.log('✅ Found:', quotedTarget);
        } else {
          console.log('❌ Missing:', quotedTarget);
        }
      }
      
    } else {
      console.log('Could not find word/document.xml');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTemplatePlaceholders();