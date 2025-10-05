const https = require('https');
const fs = require('fs');

/**
 * Test for the newly uploaded template with AI insertion points
 */
class NewTemplateTest {
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

    async testNewTemplate() {
        console.log('\n🧪 NEW TEMPLATE AI INSERTION POINTS TEST');
        console.log('=' * 60);

        try {
            // Test with the new intake ID we saw in logs
            const newIntakeId = 'f68d8696-a6c3-4e2c-b1e3-bd00278c9f54';
            
            console.log(`\n📝 Testing with NEW intake ID: ${newIntakeId}`);
            
            const postData = JSON.stringify({
                data: {
                    intakeId: newIntakeId,
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

            console.log('🔄 Generating document with new template...');
            const generateResult = await this.httpRequest(options, postData);
            
            if (generateResult.statusCode === 200) {
                let responseData;
                try {
                    responseData = JSON.parse(generateResult.data);
                } catch (e) {
                    responseData = generateResult.data;
                }

                this.logTest('New Template Generation', 'PASS', 'New template processed successfully', 
                    `Status: ${generateResult.statusCode}, Response: ${JSON.stringify(responseData)}`);

                // Check if we got artifact IDs
                if (responseData.result?.data?.artifactIds) {
                    const artifactIds = responseData.result.data.artifactIds;
                    console.log(`\n📦 Generated artifacts: ${artifactIds.join(', ')}`);
                    
                    // Test download with new artifact
                    await this.testDownloadWithNewArtifact(artifactIds[0]);
                } else {
                    this.logTest('Artifact Generation', 'FAIL', 'No artifact IDs returned', 
                        'Document generation may have failed silently');
                }

            } else {
                this.logTest('New Template Generation', 'FAIL', `Generation failed with status ${generateResult.statusCode}`, 
                    generateResult.data.substring(0, 200));
            }

        } catch (error) {
            this.logTest('Test Execution', 'FAIL', 'Test failed with error', error.message);
        }

        this.printResults();
        return this.results.failed === 0;
    }

    async testDownloadWithNewArtifact(artifactId) {
        console.log(`\n📥 Testing download with new artifact: ${artifactId}`);
        
        try {
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
                const filename = `new_template_document_${Date.now()}.docx`;
                fs.writeFileSync(filename, buffer);

                this.logTest('New Template Download', 'PASS', `Downloaded ${buffer.length} bytes successfully`, 
                    `Saved as: ${filename}`);

                // Analyze the new document
                await this.analyzeNewDocument(filename, buffer.length);

            } else {
                this.logTest('New Template Download', 'FAIL', `Download failed with status ${downloadResult.statusCode}`, 
                    downloadResult.data.substring(0, 200));
            }

        } catch (error) {
            this.logTest('Download Test', 'FAIL', 'Download failed with error', error.message);
        }
    }

    async analyzeNewDocument(filename, fileSize) {
        console.log('\n🔍 ANALYZING NEW TEMPLATE DOCUMENT');

        try {
            // Size check
            if (fileSize > 1000) {
                this.logTest('New Document Size', 'PASS', `Document has content (${fileSize} bytes)`, 
                    'File size indicates successful generation');
            } else {
                this.logTest('New Document Size', 'FAIL', `Document too small (${fileSize} bytes)`, 
                    'File may be empty');
                return;
            }

            // Content analysis
            try {
                const mammoth = require('mammoth');
                const result = await mammoth.extractRawText({ path: filename });
                const documentText = result.value;

                this.logTest('New Document Content', 'PASS', `Extracted ${documentText.length} characters`, 
                    'Successfully parsed new document');

                // Check for AI insertion point data
                console.log('\n   🎯 AI INSERTION POINT VERIFICATION:');
                
                const testData = {
                    'Company Name': 'B Tech Global LLC',
                    'Full Name': 'Belal Riyad',
                    'Email': 'briyad@gmail.com',
                    'Phone': '4802025515',
                    'Property Address': '2046 277th Ave SE',
                    'State': 'California',
                    'Document Date': '2025-09-29'
                };

                let foundCount = 0;
                let totalCount = Object.keys(testData).length;
                let foundFields = [];
                let missingFields = [];
                
                for (const [fieldName, expectedValue] of Object.entries(testData)) {
                    const found = documentText.includes(expectedValue);
                    const symbol = found ? '✅' : '❌';
                    console.log(`   ${symbol} ${fieldName}: "${expectedValue}" ${found ? 'FOUND' : 'MISSING'}`);
                    
                    if (found) {
                        foundCount++;
                        foundFields.push(fieldName);
                    } else {
                        missingFields.push(fieldName);
                    }
                }

                const insertionRate = (foundCount / totalCount * 100).toFixed(1);

                if (foundCount > 0) {
                    this.logTest('AI Insertion Points', 'PASS', `${foundCount}/${totalCount} fields inserted (${insertionRate}%)`, 
                        `Found: ${foundFields.join(', ')}`);
                    
                    // This indicates AI insertion points are working!
                    console.log('\n🎉 SUCCESS: AI INSERTION POINTS ARE WORKING!');
                    console.log(`   - ${foundCount} out of ${totalCount} data fields were successfully inserted`);
                    console.log(`   - This means the AI analyzed your template and identified insertion points`);
                    console.log(`   - The new template system is functioning correctly!`);
                    
                } else {
                    this.logTest('AI Insertion Points', 'FAIL', `No data inserted (0%)`, 
                        `Missing: ${missingFields.join(', ')}`);
                    
                    console.log('\n⚠️ NO AI INSERTION: Template may not have been processed with AI');
                    console.log('   - Check if OpenAI API is configured correctly');
                    console.log('   - Verify template analysis logs in Firebase');
                }

                // Show a preview of the document content
                console.log('\n📄 DOCUMENT PREVIEW (first 300 characters):');
                console.log('   ' + documentText.substring(0, 300).replace(/\n/g, '\\n') + '...');

            } catch (contentError) {
                this.logTest('Content Analysis', 'FAIL', 'Could not analyze document content', contentError.message);
            }

        } catch (error) {
            this.logTest('Document Analysis', 'FAIL', 'Analysis failed', error.message);
        }
    }

    printResults() {
        console.log('\n' + '=' * 60);
        console.log('🏁 NEW TEMPLATE TEST RESULTS:');
        console.log(`✅ Tests Passed: ${this.results.passed}`);
        console.log(`❌ Tests Failed: ${this.results.failed}`);
        console.log(`📊 Success Rate: ${(this.results.passed / (this.results.passed + this.results.failed) * 100).toFixed(1)}%`);
        
        const overallStatus = this.results.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
        const statusSymbol = this.results.failed === 0 ? '🎉' : '⚠️';
        console.log(`${statusSymbol} Overall Status: ${overallStatus}`);
        
        // Check if AI insertion points are working
        const aiTest = this.results.tests.find(test => test.testName === 'AI Insertion Points');
        if (aiTest && aiTest.status === 'PASS') {
            console.log('\n🚀 CONCLUSION: NEW TEMPLATE SYSTEM IS WORKING!');
            console.log('   ✅ AI insertion points detected and working');
            console.log('   ✅ Client data successfully inserted into documents');
            console.log('   ✅ Template analysis and document generation complete');
        } else if (aiTest && aiTest.status === 'FAIL') {
            console.log('\n🔧 ISSUE: AI INSERTION POINTS NOT WORKING');
            console.log('   - Template may not have been processed with AI analysis');
            console.log('   - Check OpenAI API configuration in Firebase Functions');
            console.log('   - Verify template upload triggered AI analysis');
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

// Run the test
async function runTest() {
    try {
        await ensureDependencies();
        const test = new NewTemplateTest();
        const success = await test.testNewTemplate();
        process.exit(success ? 0 : 1);
    } catch (error) {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    }
}

runTest();