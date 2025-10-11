#!/bin/bash

echo "🚀 AUTOMATED FIX - Creating Working Service"
echo "============================================"
echo ""

# Check if we should proceed
echo "This will:"
echo "  1. Run E2E tests to create a fresh service with valid templates"
echo "  2. Test document generation on the new service"
echo "  3. Verify download buttons work"
echo ""
echo "This may take 3-5 minutes..."
echo ""
read -p "Proceed? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Cancelled"
    exit 1
fi

echo ""
echo "📝 Step 1: Running E2E tests to create service..."
echo "─────────────────────────────────────────────────"

export PATH="/opt/homebrew/bin:$PATH"

# Run the test that creates a service
npx playwright test tests/core-scenarios.spec.ts --project=chromium --grep="Service Creation" 2>&1 | tee e2e-setup.log

if [ $? -eq 0 ]; then
    echo "✅ Service created successfully"
else
    echo "⚠️  Test had issues, but service may still be created"
fi

echo ""
echo "📝 Step 2: Finding the new service ID..."
echo "─────────────────────────────────────────────────"

# Extract service ID from test output or screenshots
SERVICE_ID=$(grep -o "services/[a-zA-Z0-9]*" e2e-setup.log | head -1 | cut -d'/' -f2)

if [ -z "$SERVICE_ID" ]; then
    echo "❌ Could not find service ID"
    echo "Check e2e-setup.log for details"
    exit 1
fi

echo "Found Service ID: $SERVICE_ID"

echo ""
echo "📝 Step 3: Testing document generation..."
echo "─────────────────────────────────────────────────"

# Create a test script for this specific service
cat > test-new-service.js << EOF
const https = require('https');

async function testGeneration() {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ serviceId: '${SERVICE_ID}' });
    
    const options = {
      hostname: 'formgenai-4545.web.app',
      path: '/api/services/generate-documents',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        const result = JSON.parse(responseData);
        console.log(JSON.stringify(result, null, 2));
        
        if (result.summary && result.summary.successful > 0) {
          console.log('\\n✅ SUCCESS! Documents generated with download URLs');
          console.log(\`   Successful: \${result.summary.successful}/\${result.summary.total}\`);
          resolve(true);
        } else {
          console.log('\\n❌ FAILED: No documents generated');
          reject(new Error('Generation failed'));
        }
      });
    });
    
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

testGeneration().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
EOF

/opt/homebrew/bin/node test-new-service.js

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 SUCCESS!"
    echo "─────────────────────────────────────────────────"
    echo "Service created and documents generated successfully!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Open: https://formgenai-4545.web.app/admin/services/${SERVICE_ID}"
    echo "   2. Click 'Regenerate Documents'"
    echo "   3. Watch download buttons enable within 3-10 seconds"
    echo ""
    echo "To test with automation:"
    echo "   npx playwright test tests/regenerate-auto-fix.spec.ts"
else
    echo ""
    echo "❌ Generation failed on new service too"
    echo "This suggests a deeper backend issue."
    echo ""
    echo "Please check Firebase Console:"
    echo "   Firestore: https://console.firebase.google.com/project/formgenai-4545/firestore"
    echo "   Storage: https://console.firebase.google.com/project/formgenai-4545/storage"
    echo "   Functions Logs: https://console.firebase.google.com/project/formgenai-4545/functions/logs"
fi

# Cleanup
rm -f test-new-service.js

echo ""
echo "Log saved to: e2e-setup.log"
