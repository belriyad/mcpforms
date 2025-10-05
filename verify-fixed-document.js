const fs = require('fs');
const mammoth = require('mammoth');

async function verifyFixedDocument() {
    try {
        console.log('🔍 VERIFYING FIXED DOCUMENT CONTENT\n');
        console.log('═'.repeat(60));
        
        // Check if file exists
        if (!fs.existsSync('fixed_document.docx')) {
            console.log('❌ Fixed document file not found!');
            return;
        }
        
        console.log('✅ Fixed document file found, extracting text...\n');
        
        // Extract text from the Word document
        const result = await mammoth.extractRawText({ path: 'fixed_document.docx' });
        const text = result.value;
        
        console.log('📋 SEARCHING FOR CLIENT DATA IN FIXED DOCUMENT:');
        console.log('-'.repeat(50));
        
        // Search for specific client data terms
        const searchTerms = [
            { term: 'belal', expected: true, description: 'Client first name' },
            { term: 'Belal', expected: true, description: 'Client first name (capitalized)' },
            { term: 'riyad', expected: true, description: 'Client last name' },
            { term: 'Riyad', expected: true, description: 'Client last name (capitalized)' },
            { term: 'Tech Global', expected: true, description: 'Company name part' },
            { term: 'LLC', expected: true, description: 'Company type' },
            { term: 'btechglobal.com', expected: true, description: 'Email domain' },
            { term: '2024-10-04', expected: true, description: 'Document date' }
        ];
        
        let foundCount = 0;
        let totalExpected = 0;
        
        for (const searchItem of searchTerms) {
            if (searchItem.expected) totalExpected++;
            
            if (text.includes(searchItem.term)) {
                foundCount++;
                // Find the context around the term
                const index = text.indexOf(searchItem.term);
                const start = Math.max(0, index - 30);
                const end = Math.min(text.length, index + searchItem.term.length + 30);
                const context = text.substring(start, end).replace(/\s+/g, ' ').trim();
                console.log(`✅ FOUND "${searchItem.term}": ...${context}...`);
            } else {
                console.log(`❌ NOT FOUND: "${searchItem.term}" (${searchItem.description})`);
            }
        }
        
        console.log(`\n📊 VERIFICATION RESULTS:`);
        console.log(`   • Client data terms found: ${foundCount}/${totalExpected}`);
        console.log(`   • Success rate: ${Math.round((foundCount/totalExpected)*100)}%`);
        
        // Check for old placeholder patterns that should be replaced
        console.log(`\n🔍 CHECKING FOR UNREPLACED PLACEHOLDERS:`);
        const oldPlaceholders = [
            '" Grantor\'s name"',
            '" Identify Successor trustees"',
            '" Date of Birth"',
            '" Legal Description of the property/ies"'
        ];
        
        let unfilledPlaceholders = 0;
        for (const placeholder of oldPlaceholders) {
            if (text.includes(placeholder)) {
                unfilledPlaceholders++;
                console.log(`⚠️  Still found unfilled: ${placeholder}`);
            }
        }
        
        if (unfilledPlaceholders === 0) {
            console.log('✅ All target placeholders have been replaced!');
        }
        
        console.log(`\n🎯 FINAL ASSESSMENT:`);
        if (foundCount >= 4 && unfilledPlaceholders < 2) {
            console.log('🎉 SUCCESS! The fix worked - client data is now being inserted!');
            console.log('📈 This represents a significant improvement over the previous blank document.');
        } else if (foundCount > 0) {
            console.log('⚡ PARTIAL SUCCESS! Some client data is being inserted.');
            console.log('🔧 May need additional refinement for complete coverage.');
        } else {
            console.log('❌ The fix did not work - still no client data in document.');
        }
        
        // Document statistics
        console.log(`\n📏 DOCUMENT STATISTICS:`);
        console.log(`   • Total characters: ${text.length}`);
        console.log(`   • Total words: ${text.split(/\s+/).length}`);
        
    } catch (error) {
        console.error('❌ Error verifying document:', error);
    }
}

// Run the verification
verifyFixedDocument();