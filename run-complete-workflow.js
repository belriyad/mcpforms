#!/usr/bin/env node

/**
 * Complete MCPForms Workflow Automation Script
 * 
 * This script:
 * 1. Starts the development server
 * 2. Waits for server to be ready
 * 3. Runs Playwright tests for complete workflow
 * 4. Generates documents and verifies results
 * 5. Cleans up and reports results
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  serverPort: 3000,
  serverStartTimeout: 60000, // 1 minute
  testTimeout: 300000, // 5 minutes
  maxRetries: 3,
  logLevel: 'info'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(level, message, ...args) {
  const timestamp = new Date().toISOString();
  const colorMap = {
    error: colors.red,
    warn: colors.yellow,
    info: colors.blue,
    success: colors.green,
    debug: colors.cyan
  };
  
  const color = colorMap[level] || colors.reset;
  console.log(`${color}[${timestamp}] [${level.toUpperCase()}] ${message}${colors.reset}`, ...args);
}

async function checkServerHealth(port = CONFIG.serverPort) {
  return new Promise((resolve) => {
    const http = require('http');
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve(res.statusCode === 200);
    });
    
    req.on('error', () => resolve(false));
    req.setTimeout(5000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(port = CONFIG.serverPort, timeout = CONFIG.serverStartTimeout) {
  log('info', `Waiting for server on port ${port}...`);
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await checkServerHealth(port)) {
      log('success', `Server is ready on port ${port}`);
      return true;
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    process.stdout.write('.');
  }
  
  log('error', `Server failed to start within ${timeout}ms`);
  return false;
}

function startServer() {
  return new Promise((resolve, reject) => {
    log('info', 'Starting development server...');
    
    // Start Next.js development server
    const serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });
    
    let serverReady = false;
    let outputBuffer = '';
    
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      outputBuffer += output;
      
      // Check for server ready indicators
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        if (!serverReady) {
          serverReady = true;
          log('success', 'Development server started');
          resolve(serverProcess);
        }
      }
      
      // Log important server messages
      if (CONFIG.logLevel === 'debug') {
        process.stdout.write(output);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('error')) {
        log('error', 'Server error:', output);
      }
    });
    
    serverProcess.on('error', (error) => {
      log('error', 'Failed to start server:', error.message);
      reject(error);
    });
    
    // Timeout for server start
    setTimeout(() => {
      if (!serverReady) {
        log('error', 'Server start timeout');
        serverProcess.kill();
        reject(new Error('Server start timeout'));
      }
    }, CONFIG.serverStartTimeout);
  });
}

async function runPlaywrightTests() {
  return new Promise((resolve, reject) => {
    log('info', 'Running Playwright tests...');
    
    // Run our comprehensive workflow tests
    const testCommand = 'npx playwright test tests/complete-workflow-with-docs.spec.ts tests/form-filling-automation.spec.ts --headed --project=chromium';
    
    const testProcess = spawn(testCommand, [], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    }); 
    
    let testOutput = '';
    let testErrors = '';
    
    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      testOutput += output;
      process.stdout.write(output);
    });
    
    testProcess.stderr.on('data', (data) => {
      const output = data.toString();
      testErrors += output;
      process.stderr.write(output);
    });
    
    testProcess.on('close', (code) => {
      if (code === 0) {
        log('success', 'All tests passed successfully');
        resolve({ success: true, output: testOutput });
      } else {
        log('error', `Tests failed with exit code ${code}`);
        resolve({ success: false, output: testOutput, errors: testErrors });
      }
    });
    
    testProcess.on('error', (error) => {
      log('error', 'Failed to run tests:', error.message);
      reject(error);
    });
  });
}

async function generateTestReport(testResults) {
  const reportPath = path.join(process.cwd(), 'test-results', 'workflow-report.json');
  const reportDir = path.dirname(reportPath);
  
  // Ensure directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    success: testResults.success,
    testOutput: testResults.output,
    testErrors: testResults.errors || '',
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log('info', `Test report saved to: ${reportPath}`);
  
  return report;
}

async function runDocumentVerification() {
  log('info', 'Running document verification...');
  
  // Check for generated documents in expected locations
  const documentsDir = path.join(process.cwd(), 'test-results', 'generated-documents');
  
  if (fs.existsSync(documentsDir)) {
    const files = fs.readdirSync(documentsDir);
    log('success', `Found ${files.length} generated documents`);
    files.forEach(file => log('info', `- ${file}`));
    return { documentsFound: files.length, files };
  } else {
    log('warn', 'No generated documents directory found');
    return { documentsFound: 0, files: [] };
  }
}

async function cleanup(serverProcess) {
  log('info', 'Cleaning up...');
  
  if (serverProcess && !serverProcess.killed) {
    serverProcess.kill('SIGTERM');
    
    // Give it a moment to terminate gracefully
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!serverProcess.killed) {
      serverProcess.kill('SIGKILL');
    }
    
    log('info', 'Server process terminated');
  }
}

async function main() {
  log('info', `${colors.bright}🚀 MCPForms Complete Workflow Automation${colors.reset}`);
  log('info', `Starting automation with configuration: ${JSON.stringify(CONFIG, null, 2)}`);
  
  let serverProcess = null;
  
  try {
    // Step 1: Start the development server
    serverProcess = await startServer();
    
    // Step 2: Wait for server to be ready
    const serverReady = await waitForServer();
    if (!serverReady) {
      throw new Error('Server failed to start');
    }
    
    // Step 3: Run comprehensive Playwright tests
    const testResults = await runPlaywrightTests();
    
    // Step 4: Verify document generation
    const documentResults = await runDocumentVerification();
    
    // Step 5: Generate test report
    const report = await generateTestReport({
      ...testResults,
      documentResults
    });
    
    // Step 6: Display final results
    log('info', `${colors.bright}📊 Final Results:${colors.reset}`);
    log(testResults.success ? 'success' : 'error', `Tests: ${testResults.success ? 'PASSED' : 'FAILED'}`);
    log('info', `Documents Generated: ${documentResults.documentsFound}`);
    log('info', `Report: ${path.join('test-results', 'workflow-report.json')}`);
    
    if (testResults.success) {
      log('success', `${colors.bright}🎉 Complete workflow automation successful!${colors.reset}`);
      process.exit(0);
    } else {
      log('error', `${colors.bright}❌ Workflow automation failed${colors.reset}`);
      process.exit(1);
    }
    
  } catch (error) {
    log('error', 'Automation failed:', error.message);
    process.exit(1);
  } finally {
    await cleanup(serverProcess);
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  log('warn', 'Received SIGINT, cleaning up...');
  process.exit(1);
});

process.on('SIGTERM', async () => {
  log('warn', 'Received SIGTERM, cleaning up...');
  process.exit(1);
});

// Run the automation
if (require.main === module) {
  main().catch((error) => {
    log('error', 'Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
  waitForServer,
  runPlaywrightTests,
  runDocumentVerification,
  generateTestReport,
  cleanup
};