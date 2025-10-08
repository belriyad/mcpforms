// Simple browser script to check service data
// Run this in the browser console at https://formgenai-4545.web.app

const checkService = async () => {
  const serviceId = 'w9rq4zgEiihA17ZNjhSg';
  
  try {
    console.log('🔍 Checking service:', serviceId);
    console.log('👤 Current user:', auth.currentUser?.uid);
    
    const serviceRef = doc(db, 'services', serviceId);
    const serviceSnap = await getDoc(serviceRef);
    
    if (!serviceSnap.exists()) {
      console.log('❌ Service does not exist');
      return;
    }
    
    const data = serviceSnap.data();
    console.log('📦 Service data:', {
      id: serviceSnap.id,
      name: data.name,
      createdBy: data.createdBy || '❌ MISSING',
      createdAt: data.createdAt,
      hasIntakeForm: !!data.intakeForm,
      hasTemplates: data.templates?.length || 0
    });
    
    if (!data.createdBy) {
      console.log('⚠️ This service needs migration!');
      console.log('🔧 Visit https://formgenai-4545.web.app/migrate.html');
    } else if (data.createdBy === auth.currentUser?.uid) {
      console.log('✅ You own this service!');
    } else {
      console.log('❌ This service belongs to:', data.createdBy);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.code, error.message);
    if (error.code === 'permission-denied') {
      console.log('🔒 Security rules are blocking access');
      console.log('This could mean:');
      console.log('1. Service has createdBy for different user');
      console.log('2. Security rules need to be redeployed');
      console.log('3. Your user role is not set correctly');
    }
  }
};

// Run the check
checkService();
