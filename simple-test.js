// Simple test using Node.js built-in fetch (Node 18+)
const token = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
const baseUrl = 'http://localhost:3000';

const formData = {
  intakeId: token,
  clientInfo: {
    firstName: 'John',
    lastName: 'Doe', 
    email: 'john.doe@example.com',
    phone: '555-123-4567'
  },
  formData: {
    companyName: 'Acme Corporation',
    businessType: 'Technology',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '555-123-4567',
    incorporationState: 'CA',
    additionalNotes: 'Test submission with simulated responses'
  }
};

async function testSubmit() {
  try {
    console.log('🧪 Testing submit endpoint...');
    const response = await fetch(`${baseUrl}/api/intake/${token}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    console.log('📊 Submit Status:', response.status);
    const data = await response.json();
    console.log('📄 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Form submission test PASSED!');
    } else {
      console.log('❌ Form submission test FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testSave() {
  try {
    console.log('\n💾 Testing save endpoint...');
    const response = await fetch(`${baseUrl}/api/intake/${token}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    console.log('📊 Save Status:', response.status);
    const data = await response.json();
    console.log('📄 Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.success) {
      console.log('✅ Form save test PASSED!');
    } else {
      console.log('❌ Form save test FAILED');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run tests
(async () => {
  console.log('🚀 Testing intake form endpoints...\n');
  await testSubmit();
  await testSave();
  console.log('\n🏁 Tests completed!');
})();