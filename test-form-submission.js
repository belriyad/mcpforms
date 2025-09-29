// Quick test of the intake form submission with bypassed Cloud Functions
const axios = require('axios');

const token = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
const baseUrl = 'http://localhost:3000';

async function testFormSubmission() {
  console.log('🔍 Testing intake form submission...');
  
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
      annualRevenue: '$1M - $5M',
      numberOfEmployees: '50-100',
      primaryContact: 'John Doe',
      projectScope: 'Digital transformation initiative',
      timeline: '6 months',
      budget: '$50,000 - $100,000',
      additionalRequirements: 'Need cloud migration support'
    }
  };

  try {
    // Test submit endpoint
    console.log('\n📤 Testing submit endpoint...');
    const submitResponse = await axios.post(
      `${baseUrl}/api/intake/${token}/submit`,
      formData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ Submit Response Status:', submitResponse.status);
    console.log('📊 Submit Response Data:', JSON.stringify(submitResponse.data, null, 2));
    
    // Test save endpoint
    console.log('\n💾 Testing save endpoint...');
    const saveResponse = await axios.post(
      `${baseUrl}/api/intake/${token}/save`,
      formData,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );
    
    console.log('✅ Save Response Status:', saveResponse.status);
    console.log('📊 Save Response Data:', JSON.stringify(saveResponse.data, null, 2));
    
    console.log('\n🎉 Both endpoints working successfully!');
    
  } catch (error) {
    console.error('❌ Error testing form submission:', error.message);
    if (error.response) {
      console.error('📊 Error Response:', error.response.data);
      console.error('🔢 Status Code:', error.response.status);
    }
  }
}

testFormSubmission();