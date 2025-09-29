// Simple server test and form exploration
const { spawn } = require('child_process');
const http = require('http');
const { execSync } = require('child_process');

const SERVER_PORT = 3000;
const SERVER_START_TIMEOUT = 60000;

console.log('🚀 Starting MCPForms exploration...');

async function startServer() {
  console.log('📡 Starting development server...');
  
  const server = spawn('npm', ['run', 'dev'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    cwd: __dirname
  });

  server.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Ready')) {
      console.log('✅ Server is ready!');
    }
    if (output.includes('Local:')) {
      console.log('🌐 Server URL:', output.match(/http:\/\/localhost:\d+/)?.[0] || 'http://localhost:3000');
    }
  });

  server.stderr.on('data', (data) => {
    const error = data.toString();
    if (error.includes('EADDRINUSE')) {
      console.log('⚠️ Port already in use, server might already be running');
    } else if (!error.includes('Attention:') && !error.includes('compiled')) {
      console.log('⚠️ Server warning:', error);
    }
  });

  return server;
}

async function waitForServer(port = SERVER_PORT, timeout = SERVER_START_TIMEOUT) {
  console.log(`⏳ Waiting for server on port ${port}...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.request({
          hostname: 'localhost',
          port: port,
          path: '/',
          method: 'HEAD',
          timeout: 5000
        }, (res) => {
          resolve(res);
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Timeout')));
        req.end();
      });
      
      console.log('✅ Server is responding');
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      process.stdout.write('.');
    }
  }
  
  throw new Error(`Server did not start within ${timeout}ms`);
}

async function runSimpleTest() {
  console.log('🧪 Running simple Playwright test...');
  
  try {
    const result = execSync('npx playwright test tests/working-form-test.spec.ts --project=chromium --grep "Admin login" --headed', {
      stdio: 'inherit',
      cwd: __dirname,
      timeout: 120000
    });
    
    console.log('✅ Test completed successfully');
    return true;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  let server;
  
  try {
    // Start server
    server = await startServer();
    
    // Wait for server to be ready
    await waitForServer();
    
    // Run simple test
    await runSimpleTest();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (server) {
      console.log('🛑 Stopping server...');
      server.kill('SIGTERM');
      
      // Give it time to cleanup
      setTimeout(() => {
        if (!server.killed) {
          server.kill('SIGKILL');
        }
      }, 5000);
    }
  }
}

main().catch(console.error);