const axios = require('axios');
const fs = require('fs');
const path = require('path');

class ComprehensiveDocumentTest {
    constructor() {
        this.baseUrl = 'https://formgenai-4545.web.app/api';
        this.testData = {
            fullName: 'Belal Riyadii',
            firstName: 'Belal Riyad',
            lastName: 'Belal Riyad',
            phone: '4802025515',
            company: 'belal B Tech Global LLC riyad',
            businessName: 'belal B Tech Global LLC riyad',
            email: 'briyad@gmail.com',
            documentDate: '2025-10-09',
            additionalNotes: 'dlfkdl',
            beneficiaries: 'felfkelkfle',
            propertyAddress: '2046 277th Ave SE'
        };
        this.results = {
            testsPassed: 0,
            testsFailed: 0,
            details: []
        };
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const symbols = {
            info: 'ℹ️',
            success: '✅',
            error: '❌',
            warning: '⚠️',
            test: '🧪'
        };
        console.log(`${symbols[type]} [${timestamp}] ${message}`);
    }

    async downloadAndAnalyzeDocument(url, filename) {
        try {
            this.log(`Downloading document from: ${url}`, 'info');
            
            const response = await axios({
                method: 'GET',
                url: url,
                responseType: 'arraybuffer',
                timeout: 30000
            });

            if (response.status !== 200) {
                throw new Error(`Download failed with status: ${response.status}`);
            }

            const buffer = Buffer.from(response.data);
            const filePath = path.join(__dirname, filename);
            fs.writeFileSync(filePath, buffer);

            this.log(`✅ Document downloaded successfully: ${filename} (${buffer.length} bytes)`, 'success');
            
            return {
                success: true,
                filePath: filePath,
                size: buffer.length,
                contentType: response.headers['content-type']
            };
        } catch (error) {
            this.log(`❌ Failed to download document: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async analyzeDocumentContent(filePath) {
        try {
            // For Word documents, we'll use a simple approach to extract readable text
            const mammoth = require('mammoth');
            
            this.log('Analyzing document content...', 'info');
            
            const result = await mammoth.extractRawText({ path: filePath });
            const text = result.value;
            
            this.log(`Extracted text length: ${text.length} characters`, 'info');
            
            // Check for test data in the document
            const dataChecks = [];
            for (const [fieldName, expectedValue] of Object.entries(this.testData)) {
                const found = text.includes(expectedValue);
                dataChecks.push({
                    field: fieldName,
                    expected: expectedValue,
                    found: found
                });
                
                if (found) {
                    this.log(`✅ Found "${fieldName}": "${expectedValue}"`, 'success');
                } else {
                    this.log(`❌ Missing "${fieldName}": "${expectedValue}"`, 'error');
                }
            }
            
            return {
                success: true,
                text: text,
                dataChecks: dataChecks,
                foundDataCount: dataChecks.filter(check => check.found).length,
                totalDataCount: dataChecks.length
            };
            
        } catch (error) {
            this.log(`❌ Failed to analyze document: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }

    async testDocumentGeneration() {
        try {
            this.log('🧪 STARTING COMPREHENSIVE DOCUMENT GENERATION TEST', 'test');
            this.log('=' * 60, 'info');

            // Step 1: Trigger document generation
            this.log('Step 1: Triggering document generation...', 'info');
            const generateUrl = `${this.baseUrl}/intake/e19e019c-9655-4f79-9a79-4e7b786caed5/regenerate-documents`;
            
            const generateResponse = await axios.post(generateUrl, {}, {
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (generateResponse.status !== 200) {
                throw new Error(`Generation failed with status: ${generateResponse.status}`);
            }

            this.log(`✅ Document generation triggered successfully`, 'success');
            this.log(`Response: ${JSON.stringify(generateResponse.data, null, 2)}`, 'info');

            // Step 2: Wait for processing
            this.log('Step 2: Waiting 3 seconds for document processing...', 'info');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Step 3: Download and analyze the generated document
            this.log('Step 3: Downloading and analyzing generated document...', 'info');
            const downloadUrl = `${this.baseUrl}/document/a423d34f-b4e6-42d0-aa89-3d9d5b939287/download`;
            
            const downloadResult = await this.downloadAndAnalyzeDocument(
                downloadUrl, 
                'generated_document_test.docx'
            );

            if (!downloadResult.success) {
                throw new Error(`Download failed: ${downloadResult.error}`);
            }

            // Step 4: Analyze document content
            this.log('Step 4: Analyzing document content for data insertion...', 'info');
            const analysisResult = await this.analyzeDocumentContent(downloadResult.filePath);

            if (!analysisResult.success) {
                throw new Error(`Analysis failed: ${analysisResult.error}`);
            }

            // Step 5: Generate test results
            this.log('Step 5: Generating test results...', 'info');
            this.generateTestResults(analysisResult, downloadResult);

            return this.results;

        } catch (error) {
            this.log(`❌ Test failed with error: ${error.message}`, 'error');
            this.results.testsFailed++;
            this.results.details.push({
                test: 'Document Generation',
                status: 'FAILED',
                error: error.message
            });
            return this.results;
        }
    }

    generateTestResults(analysisResult, downloadResult) {
        this.log('📊 GENERATING TEST RESULTS', 'test');
        this.log('=' * 60, 'info');

        // Test 1: Document Generation
        const generationTest = {
            test: 'Document Generation',
            status: downloadResult.success ? 'PASSED' : 'FAILED',
            details: `Generated ${downloadResult.size} bytes`
        };
        
        if (generationTest.status === 'PASSED') {
            this.results.testsPassed++;
        } else {
            this.results.testsFailed++;
        }
        this.results.details.push(generationTest);

        // Test 2: Data Insertion
        const dataInsertionRate = (analysisResult.foundDataCount / analysisResult.totalDataCount) * 100;
        const dataInsertionTest = {
            test: 'Data Insertion',
            status: analysisResult.foundDataCount > 0 ? 'PASSED' : 'FAILED',
            details: `${analysisResult.foundDataCount}/${analysisResult.totalDataCount} fields found (${dataInsertionRate.toFixed(1)}%)`
        };

        if (dataInsertionTest.status === 'PASSED') {
            this.results.testsPassed++;
        } else {
            this.results.testsFailed++;
        }
        this.results.details.push(dataInsertionTest);

        // Detailed breakdown
        this.log('📋 DETAILED BREAKDOWN:', 'info');
        for (const check of analysisResult.dataChecks) {
            const status = check.found ? '✅ FOUND' : '❌ MISSING';
            this.log(`  ${status}: ${check.field} = "${check.expected}"`, check.found ? 'success' : 'error');
        }

        // Overall result
        this.log('🏁 FINAL TEST RESULTS:', 'test');
        this.log(`Tests Passed: ${this.results.testsPassed}`, 'success');
        this.log(`Tests Failed: ${this.results.testsFailed}`, 'error');
        
        const overallStatus = this.results.testsFailed === 0 ? 'PASSED' : 'FAILED';
        this.log(`Overall Status: ${overallStatus}`, overallStatus === 'PASSED' ? 'success' : 'error');
    }
}

// Install required dependencies if not present
async function ensureDependencies() {
    try {
        require('mammoth');
    } catch (error) {
        console.log('Installing mammoth for document analysis...');
        const { execSync } = require('child_process');
        execSync('npm install mammoth', { stdio: 'inherit' });
    }
}

// Run the test
async function runTest() {
    try {
        await ensureDependencies();
        const test = new ComprehensiveDocumentTest();
        const results = await test.testDocumentGeneration();
        
        console.log('\n🎯 SUMMARY:');
        console.log(`✅ Passed: ${results.testsPassed}`);
        console.log(`❌ Failed: ${results.testsFailed}`);
        console.log(`📊 Success Rate: ${((results.testsPassed / (results.testsPassed + results.testsFailed)) * 100).toFixed(1)}%`);
        
        process.exit(results.testsFailed === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
}

runTest();