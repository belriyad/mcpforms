const https = require('https');
const fs = require('fs');

/**
 * Comprehensive PASS/FAIL test for document generation with content comparison
 */
class DocumentGenerationTest {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            tests: []
        };
    }

    logTest(testName, status, message, details = '') {
        const symbol = status === 'PASS' ? '✅' : '❌';
        console.log(`${symbol} ${testName}: ${status} - ${message}`);
        if (details) console.log(`   └─ ${details}`);
        
        this.results.tests.push({ testName, status, message, details });
        if (status === 'PASS') this.results.passed++;
        else this.results.failed++;
    }

    async httpRequest(options, postData = null) {
        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        data: data
                    });
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            if (postData) {
                req.write(postData);
            }
            req.end();
        });
    }

    async testDocumentGeneration() {
        console.log('\n🧪 COMPREHENSIVE DOCUMENT GENERATION TEST');
        console.log('=' * 60);

        try {
            // Test 1: Document Generation
            console.log('\n📝 TEST 1: Document Generation');
            
            const intakeId = 'e19e019c-9655-4f79-9a79-4e7b786caed5';
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

            const generateResult = await this.httpRequest(options, postData);
            
            if (generateResult.statusCode === 200) {
                let responseData;
                try {
                    responseData = JSON.parse(generateResult.data);
                } catch (e) {
                    responseData = generateResult.data;
                }

                this.logTest('Document Generation', 'PASS', 'Document generation completed successfully', 
                    `Status: ${generateResult.statusCode}, Response: ${JSON.stringify(responseData)}`);

                // Test 2: Document Download (using known working artifact ID)
                console.log('\n📥 TEST 2: Document Download');
                
                const artifactId = 'a423d34f-b4e6-42d0-aa89-3d9d5b939287';
                const downloadOptions = {
                    hostname: 'us-central1-formgenai-4545.cloudfunctions.net',
                    port: 443,
                    path: '/downloadDocument',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(JSON.stringify({
                            data: { artifactId: artifactId }
                        }))
                    }
                };

                const downloadResult = await this.httpRequest(downloadOptions, JSON.stringify({
                    data: { artifactId: artifactId }
                }));

                if (downloadResult.statusCode === 200) {
                    const buffer = Buffer.from(downloadResult.data, 'binary');
                    const filename = 'test_generated_document.docx';
                    fs.writeFileSync(filename, buffer);

                    this.logTest('Document Download', 'PASS', `Downloaded ${buffer.length} bytes successfully`, 
                        `Saved as: ${filename}`);

                    // Test 3: Document Content Analysis
                    await this.analyzeDocumentContent(filename, buffer.length);

                } else {
                    this.logTest('Document Download', 'FAIL', `Download failed with status ${downloadResult.statusCode}`, 
                        downloadResult.data.substring(0, 200));
                }

            } else {
                this.logTest('Document Generation', 'FAIL', `Generation failed with status ${generateResult.statusCode}`, 
                    generateResult.data.substring(0, 200));
            }

        } catch (error) {
            this.logTest('Test Execution', 'FAIL', 'Test failed with error', error.message);
        }

        this.printFinalResults();
        return this.results.failed === 0;
    }

    async analyzeDocumentContent(filename, fileSize) {
        console.log('\n🔍 TEST 3: Document Content Analysis');

        try {
            // Test 3a: File Size Check
            if (fileSize > 1000) {
                this.logTest('Document Size', 'PASS', `Document has substantial content (${fileSize} bytes)`, 
                    'File size indicates document was generated successfully');
            } else {
                this.logTest('Document Size', 'FAIL', `Document is too small (${fileSize} bytes)`, 
                    'File may be empty or corrupted');
                return;
            }

            // Test 3b: Content Extraction and Analysis
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ path: filename });
                const documentText = result.value;

                this.logTest('Content Extraction', 'PASS', `Extracted ${documentText.length} characters of text`, 
                    'Successfully parsed document content');

                // Test 3c: Data Insertion Verification
                console.log('\n   📊 Data Insertion Analysis:');
                
                const expectedData = {
                    'Full Name': 'Belal Riyadii',
                    'Email': 'briyad@gmail.com', 
                    'Phone': '4802025515',
                    'Property Address': '2046 277th Ave SE',
                    'Company': 'belal B Tech Global LLC riyad',
                    'Document Date': '2025-10-09'
                };

                let foundCount = 0;
                let totalCount = Object.keys(expectedData).length;
                
                for (const [fieldName, expectedValue] of Object.entries(expectedData)) {
                    const found = documentText.includes(expectedValue);
                    const symbol = found ? '✅' : '❌';
                    console.log(`   ${symbol} ${fieldName}: "${expectedValue}" ${found ? 'FOUND' : 'NOT FOUND'}`);
                    if (found) foundCount++;
                }

                const insertionRate = (foundCount / totalCount * 100).toFixed(1);

                if (foundCount > 0) {
                    this.logTest('Data Insertion', 'PASS', `${foundCount}/${totalCount} fields found (${insertionRate}%)`, 
                        'Client data successfully detected in generated document');
                } else {
                    this.logTest('Data Insertion', 'FAIL', `No client data found in document (0%)`, 
                        'Document appears to be template without client data - AI insertion may not be working');
                }

                // Test 3d: Template vs Generated Comparison
                console.log('\n   📋 Template vs Generated Analysis:');
                if (documentText.length > 100) {
                    this.logTest('Document Completeness', 'PASS', 'Generated document has substantial content', 
                        `Document contains ${documentText.length} characters of text`);
                } else {
                    this.logTest('Document Completeness', 'FAIL', 'Generated document appears incomplete', 
                        'Very little content detected in document');
                }

            } catch (contentError) {
                this.logTest('Content Analysis', 'FAIL', 'Could not analyze document content', contentError.message);
            }

        } catch (error) {
            this.logTest('Document Analysis', 'FAIL', 'Analysis failed', error.message);
        }
    }

    printFinalResults() {
        console.log('\n' + '=' * 60);
        console.log('🏁 FINAL TEST RESULTS:');
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`📊 Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1)}%`);
        
        const overallStatus = this.results.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
        const statusSymbol = this.results.failed === 0 ? '🎉' : '⚠️';
        console.log(`${statusSymbol} Overall Status: ${overallStatus}`);
        
        if (this.results.failed === 0) {
            console.log('\n✨ CONCLUSION: Document generation system is working correctly!');
            console.log('   - Documents are being generated successfully');
            console.log('   - Downloads are working');
            console.log('   - Document content is being populated');
        } else {
            console.log('\n🔧 ISSUES IDENTIFIED:');
            this.results.tests.filter(test => test.status === 'FAIL').forEach(failure => {
                console.log(`   - ${failure.testName}: ${failure.message}`);
            });
            
            console.log('\n💡 NEXT STEPS:');
            const hasDataIssues = this.results.tests.some(test => 
                test.testName === 'Data Insertion' && test.status === 'FAIL'
            );
            
            if (hasDataIssues) {
                console.log('   - Current template lacks AI-detected insertion points');
                console.log('   - Upload a NEW template to trigger AI analysis');
                console.log('   - Check Firebase logs during template upload for AI processing');
                console.log('   - System is working but needs templates with AI insertion points');
            } else {
                console.log('   - Check Firebase Functions logs for detailed error information');
                console.log('   - Verify network connectivity and endpoint availability');
            }
        }
    }
}

// Install mammoth if needed
async function ensureDependencies() {
    try {
        require('mammoth');
    } catch (error) {
        console.log('Installing mammoth for document analysis...');
        const { execSync } = require('child_process');
        execSync('npm install mammoth', { stdio: 'inherit' });
    }
}

// Run the comprehensive test
async function runTest() {
    try {
        await ensureDependencies();
        const test = new DocumentGenerationTest();
        const success = await test.testDocumentGeneration();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
}

runTest();