const fs = require('fs');
const mammoth = require('mammoth');

async function verifyEnhancedDocument() {
    try {
        console.log('🎉 VERIFYING ENHANCED DOCUMENT WITH 9 AI-GUIDED REPLACEMENTS\n');
        console.log('═'.repeat(70));
        
        if (!fs.existsSync('enhanced_document.docx')) {
            console.log('❌ Enhanced document file not found!');
            return;
        }
        
        console.log('✅ Enhanced document found, extracting text...\n');
        
        const result = await mammoth.extractRawText({ path: 'enhanced_document.docx' });
        const text = result.value;
        
        console.log('📋 SEARCHING FOR CLIENT DATA (confirmed from logs):');
        console.log('-'.repeat(50));
        
        // Based on Firebase logs, we know at least "2046 277th Ave SE" was inserted
        const knownInsertedData = [
            { value: '2046 277th Ave SE', field: 'legalDescription', source: 'Firebase logs confirmed' },
            { value: 'belal B Tech Global LLC riyad', field: 'fullName', source: 'Expected from client data' },
            { value: 'Belal Riyad', field: 'trusteeName', source: 'Expected from client data' },
            { value: 'briyad@gmail.com', field: 'email', source: 'Expected from client data' },
            { value: '4802025515', field: 'phone', source: 'Expected from client data' },
            { value: '2025-09-29', field: 'documentDate', source: 'Expected from client data' },
            { value: 'B Tech Global LLC', field: 'companyName', source: 'Expected from client data' }
        ];
        
        let successfulInsertions = [];
        let missedInsertions = [];
        
        for (const item of knownInsertedData) {
            if (text.includes(item.value)) {
                successfulInsertions.push(item);
                // Find context
                const index = text.indexOf(item.value);
                const start = Math.max(0, index - 40);
                const end = Math.min(text.length, index + item.value.length + 40);
                const context = text.substring(start, end).replace(/\s+/g, ' ').trim();
                console.log(`✅ FOUND "${item.field}": "${item.value}"`);
                console.log(`   Context: ...${context}...`);
                console.log(`   Source: ${item.source}\n`);
            } else {
                missedInsertions.push(item);
                console.log(`❌ NOT FOUND "${item.field}": "${item.value}"`);
            }
        }
        
        console.log('═'.repeat(70));
        console.log('📊 ENHANCED DOCUMENT VERIFICATION RESULTS:');
        console.log(`   • Successful insertions: ${successfulInsertions.length}/${knownInsertedData.length}`);
        console.log(`   • Success rate: ${Math.round((successfulInsertions.length/knownInsertedData.length)*100)}%`);
        console.log(`   • AI replacements made (from logs): 9`);
        
        if (successfulInsertions.length > 0) {
            console.log('\n🎉 BREAKTHROUGH SUCCESS!');
            console.log('✅ Client data IS NOW being inserted into the document!');
            console.log(`📈 This is a MAJOR improvement over previous blank documents.`);
            
            console.log('\n🔍 SUCCESSFUL INSERTIONS:');
            successfulInsertions.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.field}: "${item.value}"`);
            });
            
            if (missedInsertions.length > 0) {
                console.log('\n⚠️  STILL MISSING (can be improved further):');
                missedInsertions.forEach((item, index) => {
                    console.log(`   ${index + 1}. ${item.field}: "${item.value}"`);
                });
            }
            
        } else {
            console.log('\n❌ Still no client data found despite logs showing 9 replacements.');
            console.log('🔧 The replacements may be using different values or formatting.');
        }
        
        // Check document statistics
        console.log(`\n📏 DOCUMENT STATISTICS:`);
        console.log(`   • Total characters: ${text.length}`);
        console.log(`   • Total words: ${text.split(/\s+/).length}`);
        
        // Look for any remaining unfilled placeholders
        const placeholderPatterns = [
            '" Grantor\'s name"',
            '" Identify Successor trustees"', 
            '" Date of Birth"',
            '" Legal Description of the property/ies"'
        ];
        
        let remainingPlaceholders = 0;
        for (const placeholder of placeholderPatterns) {
            if (text.includes(placeholder)) {
                remainingPlaceholders++;
                console.log(`⚠️  Unfilled placeholder: ${placeholder}`);
            }
        }
        
        if (remainingPlaceholders === 0) {
            console.log('✅ All major placeholders have been processed!');
        }
        
        console.log('\n🎯 CONCLUSION:');
        if (successfulInsertions.length >= 3) {
            console.log('🏆 MAJOR SUCCESS! The AI field mapping system is now working!');
        } else if (successfulInsertions.length >= 1) {
            console.log('⚡ SIGNIFICANT PROGRESS! System is working but needs optimization.');
        } else {
            console.log('🔧 Need further debugging despite logged replacements.');
        }
        
    } catch (error) {
        console.error('❌ Error verifying enhanced document:', error);
    }
}

// Run the verification
verifyEnhancedDocument();