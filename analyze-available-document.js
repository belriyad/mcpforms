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

async function checkAvailableDocument() {
  // Use the most recent successful artifact
  const artifactId = 'eb4291a5-6a87-4800-bfe3-b650c6ec609e';
  
  console.log(`📄 Downloading and analyzing artifact: ${artifactId}`);
  console.log('═'.repeat(60));
  
  try {
    // Get download URL
    const getDownloadUrl = httpsCallable(functions, 'getDocumentDownloadUrl');
    const result = await getDownloadUrl({ artifactId });
    
    console.log('🔍 Function result:', JSON.stringify(result.data, null, 2));
    
    if (!result.data.success) {
      console.log('❌ Failed to get download URL:', result.data.error);
      return;
    }
    
    const downloadUrl = result.data.data.downloadUrl;
    console.log('✅ Download URL obtained:', downloadUrl);
    
    // Download the document
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      console.log('❌ Failed to download document');
      return;
    }
    
    const buffer = await response.arrayBuffer();
    const tempPath = path.join(__dirname, 'temp_analysis_doc.docx');
    fs.writeFileSync(tempPath, Buffer.from(buffer));
    
    console.log('✅ Document downloaded for analysis');
    
    // Analyze the document
    const textResult = await mammoth.extractRawText({ path: tempPath });
    const text = textResult.value;
    
    console.log('\n📊 Generated Document Statistics:');
    console.log(`   - Total characters: ${text.length}`);
    console.log(`   - Total words: ${text.split(/\s+/).length}`);
    console.log(`   - Total lines: ${text.split('\n').length}`);
    
    // Look for filled data
    console.log('\n🔍 Client Data Detection:');
    
    // Look for specific patterns that might indicate filled data
    const clientDataPatterns = [
      /belal/gi,
      /riyad/gi,
      /B Tech Global/gi,
      /277th Ave/gi,
      /4802025515/gi,
      /2025-09-29/gi
    ];
    
    clientDataPatterns.forEach((pattern, index) => {
      const matches = text.match(pattern);
      if (matches) {
        console.log(`   ✅ Pattern ${index + 1}: Found ${matches.length} matches - "${matches[0]}"`);
      } else {
        console.log(`   ❌ Pattern ${index + 1}: Not found`);
      }
    });
    
    // Compare with original template length
    console.log('\n📏 Document Comparison:');
    console.log(`   - Original template: ~4111 characters`);
    console.log(`   - Generated document: ${text.length} characters`);
    console.log(`   - Difference: ${text.length - 4111} characters (${text.length > 4111 ? 'expanded' : 'reduced'})`);
    
    // Show first 600 characters
    console.log('\n📄 Generated Document Preview (first 600 chars):');
    console.log('─'.repeat(60));
    console.log(text.substring(0, 600) + '...');
    
    // Look for trust-specific filled sections
    console.log('\n🏛️ Trust Document Analysis:');
    const trustSections = text.split('\n').filter(line => 
      line.includes('Trust') || 
      line.includes('Grantor') || 
      line.includes('Trustee') ||
      line.toLowerCase().includes('belal') ||
      line.toLowerCase().includes('riyad')
    );
    
    console.log('📋 Relevant sections:');
    trustSections.slice(0, 10).forEach((section, index) => {
      if (section.trim()) {
        console.log(`   ${index + 1}. ${section.trim()}`);
      }
    });
    
    // Clean up
    fs.unlinkSync(tempPath);
    console.log('\n✅ Analysis completed, temporary file cleaned up');
    
  } catch (error) {
    console.error('❌ Error analyzing document:', error);
  }
}

checkAvailableDocument().then(() => {
  console.log('\n🎯 Document analysis completed');
}).catch(error => {
  console.error('❌ Script error:', error);
});