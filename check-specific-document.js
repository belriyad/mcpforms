const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');
const { getFunctions, httpsCallable } = require('firebase/functions');
const fs = require('fs');
const path = require('path');

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
const db = getFirestore(app);
const functions = getFunctions(app);

async function checkSpecificDocument() {
  const artifactId = '46ea3329-bc90-4c51-8644-2228958e7c73';
  
  console.log(`🔍 Looking for document artifact: ${artifactId}`);
  
  try {
    // Search in documentArtifacts collection
    const artifactsQuery = query(
      collection(db, 'documentArtifacts'),
      where('__name__', '==', artifactId)
    );
    
    const artifactsSnapshot = await getDocs(artifactsQuery);
    
    if (!artifactsSnapshot.empty) {
      console.log('✅ Found document artifact!');
      artifactsSnapshot.forEach(doc => {
        console.log('📄 Document Data:', doc.data());
      });
    } else {
      console.log('❌ Document artifact not found in Firestore');
      
      // Try to search by partial ID in all artifacts
      const allArtifactsQuery = query(collection(db, 'documentArtifacts'));
      const allSnapshot = await getDocs(allArtifactsQuery);
      
      console.log(`\n🔍 Searching through ${allSnapshot.size} total artifacts...`);
      
      let found = false;
      allSnapshot.forEach(doc => {
        const data = doc.data();
        if (doc.id.includes('46ea3329') || 
            (data.files && data.files.some(f => f.includes('46ea3329')))) {
          console.log('✅ Found matching artifact:', doc.id);
          console.log('📄 Data:', data);
          found = true;
        }
      });
      
      if (!found) {
        console.log('❌ No artifacts found containing that ID');
        console.log('\n📋 Available artifact IDs:');
        allSnapshot.forEach(doc => {
          console.log(`  - ${doc.id}`);
        });
      }
    }
    
    // Try to download the document if it exists
    if (artifactId) {
      console.log('\n🔄 Attempting to get download URL...');
      try {
        const getDownloadUrl = httpsCallable(functions, 'getDocumentDownloadUrl');
        const result = await getDownloadUrl({ artifactId });
        
        if (result.data.success) {
          console.log('✅ Download URL obtained:', result.data.downloadUrl);
          
          // Try to download the file
          const response = await fetch(result.data.downloadUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const outputPath = path.join(__dirname, `downloaded_${artifactId}.docx`);
            fs.writeFileSync(outputPath, Buffer.from(buffer));
            console.log(`✅ Document downloaded to: ${outputPath}`);
          }
        } else {
          console.log('❌ Failed to get download URL:', result.data.error);
        }
      } catch (error) {
        console.log('❌ Error getting download URL:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking document:', error);
  }
}

checkSpecificDocument().then(() => {
  console.log('🔍 Document check completed');
}).catch(error => {
  console.error('❌ Script error:', error);
});