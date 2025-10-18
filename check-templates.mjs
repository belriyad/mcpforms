import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDNgA0XVlTI8SdnBSy5jm-G9Bl4PJOF0Uw",
  authDomain: "formgenai-4545.firebaseapp.com",
  projectId: "formgenai-4545",
  storageBucket: "formgenai-4545.firebasestorage.app",
  messagingSenderId: "876390535161",
  appId: "1:876390535161:web:f7ed7ef11e3c5f0e2b7d77"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔍 Checking templates in Firestore...\n');

// Check ALL templates
const allTemplates = await getDocs(collection(db, 'templates'));
console.log(`📊 Total templates in database: ${allTemplates.size}\n`);

if (allTemplates.size === 0) {
  console.log('❌ NO TEMPLATES FOUND IN DATABASE');
  console.log('   This means no templates have been uploaded yet.\n');
} else {
  allTemplates.forEach((doc) => {
    const data = doc.data();
    console.log('📄 Template:', doc.id);
    console.log('   Name:', data.name || 'N/A');
    console.log('   Status:', data.status || 'N/A');
    console.log('   Created By:', data.createdBy || 'N/A');
    console.log('   Created At:', data.createdAt?.toDate?.() || 'N/A');
    console.log('');
  });
}

// Check test user's UID
const testEmail = 'belal.riyad@gmail.com';
console.log(`\n🔐 Looking for user: ${testEmail}`);

// We need to check what UID the test user has
console.log('\n💡 To find templates for your user:');
console.log('   1. Login to Firebase Console');
console.log('   2. Go to Authentication');
console.log('   3. Find user: belal.riyad@gmail.com');
console.log('   4. Copy the UID');
console.log('   5. Check if any template has createdBy = that UID\n');

process.exit(0);
