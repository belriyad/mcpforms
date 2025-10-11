// Fetch service data via the deployed API
const https = require('https');

async function fetchServiceData() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'formgenai-4545.web.app',
      path: '/api/services/2F3GSb5UJobtRzU9Vjvv/details',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

async function checkServiceViaAPI() {
  try {
    console.log('🔍 Fetching service data via API...\n');
    
    const service = await fetchServiceData();
    
    console.log('📋 Service Info:');
    console.log(`   Name: ${service.name}`);
    console.log(`   Client: ${service.clientName}`);
    console.log(`   Status: ${service.status}`);
    console.log(`   Templates Count: ${service.templates?.length || 0}\n`);
    
    if (service.templates && service.templates.length > 0) {
      console.log('📄 Templates:\n');
      
      service.templates.forEach((template, i) => {
        console.log(`   Template ${i + 1}:`);
        console.log(`   ├─ Template ID: ${template.templateId}`);
        console.log(`   ├─ Name: ${template.name}`);
        console.log(`   ├─ File Name: ${template.fileName || 'N/A'}`);
        console.log(`   └─ Storage Path: ${template.storagePath || '❌ MISSING'}\n`);
      });
    }
    
    if (service.generatedDocuments && service.generatedDocuments.length > 0) {
      console.log('📦 Generated Documents:\n');
      service.generatedDocuments.forEach((doc, i) => {
        console.log(`   Document ${i + 1}:`);
        console.log(`   ├─ File Name: ${doc.fileName}`);
        console.log(`   ├─ Status: ${doc.status}`);
        console.log(`   └─ Download URL: ${doc.downloadUrl ? '✅ HAS URL' : '❌ NULL'}\n`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 The API endpoint might not exist. Let me try the generate-documents endpoint instead...\n');
    
    // Try generating to see the error
    console.log('Running generation to see detailed error...\n');
    const { exec } = require('child_process');
    exec('/opt/homebrew/bin/node test-api-generation.js', (err, stdout, stderr) => {
      console.log(stdout);
      if (err) console.error(stderr);
    });
  }
}

checkServiceViaAPI();
