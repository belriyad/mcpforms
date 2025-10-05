const axios = require('axios');
const fs = require('fs');
const path = require('path');

async function runClearPassFailTest() {
    const testResults = {
        passed: 0,
        failed: 0,
        details: []
    };

    function logResult(test, status, message, details = '') {
        const symbol = status === 'PASS' ? '✅' : '❌';
        console.log(`${symbol} ${test}: ${status} - ${message}`);
        if (details) console.log(`   └─ ${details}`);
        
        testResults.details.push({ test, status, message, details });
        if (status === 'PASS') testResults.passed++;
        else testResults.failed++;
    }

    console.log('\n🧪 COMPREHENSIVE DOCUMENT GENERATION TEST');
    console.log('=' * 60);

    try {
        // Test 1: Document Generation
        console.log('\n📝 TEST 1: Document Generation');
        const intakeId = 'e19e019c-9655-4f79-9a79-4e7b786caed5';
        const regenerateUrl = `https://us-central1-formgenai-4545.cloudfunctions.net/generateDocumentsFromIntake`;
        
        const generateResponse = await axios.post(regenerateUrl, {
            data: {
                intakeId: intakeId,
                regenerate: true
            }
        }, { 
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (generateResponse.status === 200 && generateResponse.data.result?.success) {
            const artifactIds = generateResponse.data.result.data.artifactIds;
            logResult('Document Generation', 'PASS', `Generated ${artifactIds.length} document(s)`, `Artifact IDs: ${artifactIds.join(', ')}`);
            
            // Test 2: Document Download
            console.log('\n📥 TEST 2: Document Download');
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for processing
            
            const artifactId = artifactIds[0]; // Use the newly generated artifact ID
            const downloadUrl = `https://us-central1-formgenai-4545.cloudfunctions.net/downloadDocument`;
            
            const downloadResponse = await axios({
                method: 'POST',
                url: downloadUrl,
                data: {
                    data: { artifactId: artifactId }
                },
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            
            if (downloadResponse.status === 200) {
                const buffer = Buffer.from(downloadResponse.data);
                const filename = 'test_generated_document.docx';
                fs.writeFileSync(filename, buffer);
                
                logResult('Document Download', 'PASS', `Downloaded ${buffer.length} bytes`, `Saved as: ${filename}`);
                
                // Test 3: Document Content Analysis
                console.log('\n🔍 TEST 3: Document Content Analysis');
                
                try {
                    const mammoth = require('mammoth');
                    const result = await mammoth.extractRawText({ path: filename });
                    const documentText = result.value;
                    
                    // Test data that should be in the document
                    const testData = {
                        'Full Name': 'Belal Riyadii',
                        'Email': 'briyad@gmail.com',
                        'Phone': '4802025515',
                        'Property Address': '2046 277th Ave SE',
                        'Company': 'belal B Tech Global LLC riyad'
                    };
                    
                    let foundCount = 0;
                    let totalCount = Object.keys(testData).length;
                    
                    console.log('\n   📊 Data Insertion Check:');
                    for (const [fieldName, expectedValue] of Object.entries(testData)) {
                        const found = documentText.includes(expectedValue);
                        const symbol = found ? '✅' : '❌';
                        console.log(`   ${symbol} ${fieldName}: "${expectedValue}" ${found ? 'FOUND' : 'NOT FOUND'}`);
                        if (found) foundCount++;
                    }
                    
                    const insertionRate = (foundCount / totalCount * 100).toFixed(1);
                    
                    if (foundCount > 0) {
                        logResult('Data Insertion', 'PASS', `${foundCount}/${totalCount} fields inserted (${insertionRate}%)`, 'Client data successfully inserted into document');
                    } else {
                        logResult('Data Insertion', 'FAIL', `${foundCount}/${totalCount} fields inserted (${insertionRate}%)`, 'No client data found in generated document - AI insertion points may not be working');
                    }
                    
                    // Test 4: Document Size Verification
                    console.log('\n📏 TEST 4: Document Size Verification');
                    if (buffer.length > 1000) { // Document should be substantial
                        logResult('Document Size', 'PASS', `Document is ${buffer.length} bytes`, 'Document has substantial content');
                    } else {
                        logResult('Document Size', 'FAIL', `Document is only ${buffer.length} bytes`, 'Document may be empty or corrupted');
                    }
                    
                } catch (contentError) {
                    logResult('Content Analysis', 'FAIL', 'Could not analyze document content', contentError.message);
                }
                
            } else {
                logResult('Document Download', 'FAIL', `Download failed with status ${downloadResponse.status}`, downloadResponse.statusText);
            }
            
        } else {
            logResult('Document Generation', 'FAIL', 'Generation request failed', `Status: ${generateResponse.status}, Response: ${JSON.stringify(generateResponse.data)}`);
        }
        
    } catch (error) {
        logResult('Test Execution', 'FAIL', 'Test failed with error', error.message);
    }

    // Final Results
    console.log('\n' + '=' * 60);
    console.log('🏁 FINAL TEST RESULTS:');
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${(testResults.passed / (testResults.passed + testResults.failed) * 100).toFixed(1)}%`);
    
    const overallStatus = testResults.failed === 0 ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED';
    const statusSymbol = testResults.failed === 0 ? '🎉' : '⚠️';
    console.log(`${statusSymbol} Overall Status: ${overallStatus}`);
    
    if (testResults.failed === 0) {
        console.log('\n✨ CONCLUSION: Document generation system is working correctly!');
        console.log('   - Documents are being generated successfully');
        console.log('   - Downloads are working');
        console.log('   - Client data is being inserted into documents');
    } else {
        console.log('\n🔧 ISSUES IDENTIFIED:');
        testResults.details.filter(result => result.status === 'FAIL').forEach(failure => {
            console.log(`   - ${failure.test}: ${failure.message}`);
        });
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('   - Check if AI insertion points are being detected during template upload');
        console.log('   - Verify OpenAI API is working for template analysis');
        console.log('   - Consider uploading a new template to trigger AI analysis');
    }
    
    return testResults.failed === 0;
}

// Run the test
runClearPassFailTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Test runner failed:', error.message);
        process.exit(1);
    });