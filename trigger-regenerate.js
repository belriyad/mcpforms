// Simple HTTP call to test regeneration
const https = require('https');

const intakeId = 'e19e019c-9655-4f79-9a79-4e7b786caed5'; // Replace with actual intake ID from logs

const postData = JSON.stringify({
  data: {
    intakeId: intakeId,
    regenerate: true
  }
});

const options = {
  hostname: 'us-central1-formgenai-4545.cloudfunctions.net',
  port: 443,
  path: '/generateDocumentsFromIntake',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🔄 Triggering document regeneration for intake:', intakeId);

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`Response: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('✅ Request completed. Check Firebase logs with: firebase functions:log');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();