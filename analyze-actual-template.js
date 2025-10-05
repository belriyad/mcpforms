const admin = require('firebase-admin');
const PizZip = require('pizzip');

// Initialize Firebase
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'formgenai-4545'
  });
} catch (e) {
  // Already initialized
}

const storage = admin.storage();
const db = admin.firestore();

async function analyzeTemplate() {
  try {
    // Get the template document from Firestore
    const intakeDoc = await db.collection('intakes').doc('46ea3329-bc90-4c51-8644-2228958e7c73').get();
    const intake = intakeDoc.data();
    
    const serviceDoc = await db.collection('services').doc(intake.serviceId).get();
    const service = serviceDoc.data();
    
    const templateId = service.templateIds[0];
    const templateDoc = await db.collection('templates').doc(templateId).get();
    const template = templateDoc.data();
    
    console.log('📄 Template:', template.name);
    console.log('📁 Template URL:', template.fileUrl);
    
    // Download the template
    const file = storage.bucket().file(template.fileUrl);
    const [buffer] = await file.download();
    
    console.log('\n📦 Template downloaded, size:', buffer.length, 'bytes');
    
    // Load with PizZip
    const zip = new PizZip(buffer);
    const docXml = zip.files['word/document.xml'];
    
    if (!docXml) {
      console.error('❌ word/document.xml not found!');
      return;
    }
    
    let xmlContent = docXml.asText();
    console.log('\n📝 XML length:', xmlContent.length, 'characters');
    
    // Normalize smart quotes
    xmlContent = xmlContent
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/\u2013/g, '-')
      .replace(/\u2014/g, '--');
    
    // Find all quoted strings
    const quotedStrings = xmlContent.match(/"[^"]{3,60}"/g);
    
    console.log('\n🔍 ALL QUOTED STRINGS IN TEMPLATE:');
    console.log('═══════════════════════════════════════════════════');
    
    if (quotedStrings) {
      const unique = [...new Set(quotedStrings)];
      unique.sort().forEach((str, idx) => {
        console.log(`${idx + 1}. ${str}`);
      });
      
      console.log(`\n📊 Total unique quoted strings: ${unique.length}`);
      
      // Check which ones we're trying to replace
      console.log('\n🎯 CHECKING OUR REPLACEMENT TARGETS:');
      console.log('═══════════════════════════════════════════════════');
      
      const targets = [
        '"Trust\'s name"',
        '"Grantor\'s name"',
        '"Grantor\'s name or names in case of multiple grantors"',
        '"Name of Grantor"',
        '"current trustees"',
        '"successor trustees"',
        '"successor co-trustees"',
        '"notary public name"',
        '"county"',
        '"execution day"',
        '"execution month"',
        '"execution year"',
        '"notary commission expires"',
        '"signature authority"'
      ];
      
      targets.forEach(target => {
        if (xmlContent.includes(target)) {
          console.log(`✅ FOUND: ${target}`);
        } else {
          console.log(`❌ MISSING: ${target}`);
          // Try to find similar
          const words = target.replace(/"/g, '').split(' ');
          const similar = unique.filter(q => 
            words.some(w => w.length > 3 && q.toLowerCase().includes(w.toLowerCase()))
          );
          if (similar.length > 0) {
            console.log(`   💡 Similar found: ${similar.join(', ')}`);
          }
        }
      });
      
    } else {
      console.log('No quoted strings found!');
    }
    
    // Also check for {{}} placeholders
    const standardPlaceholders = xmlContent.match(/\{\{[^}]+\}\}/g);
    if (standardPlaceholders) {
      console.log('\n🔧 STANDARD {{}} PLACEHOLDERS:');
      console.log('═══════════════════════════════════════════════════');
      standardPlaceholders.forEach((ph, idx) => {
        console.log(`${idx + 1}. ${ph}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

analyzeTemplate();
