const fs = require('fs');
const mammoth = require('mammoth');

async function examineDownloadedDocument() {
    try {
        console.log('📄 EXAMINING DOWNLOADED DOCUMENT CONTENT\n');
        console.log('═'.repeat(60));
        
        // Check if file exists
        if (!fs.existsSync('downloaded_document.docx')) {
            console.log('❌ Document file not found!');
            return;
        }
        
        console.log('✅ Document file found, extracting text...\n');
        
        // Extract text from the Word document
        const result = await mammoth.extractRawText({ path: 'downloaded_document.docx' });
        const text = result.value;
        
        console.log('📋 FULL DOCUMENT TEXT:');
        console.log('-'.repeat(40));
        console.log(text);
        console.log('-'.repeat(40));
        
        // Search for specific terms
        console.log('\n🔍 SEARCHING FOR KEY TERMS:');
        console.log('═'.repeat(40));
        
        const searchTerms = [
            'belal', 'Belal', 'BELAL',
            'riyad', 'Riyad', 'RIYAD', 
            'tech', 'Tech', 'TECH',
            'global', 'Global', 'GLOBAL',
            'LLC', 'llc',
            'trustee', 'Trustee', 'TRUSTEE',
            'grantor', 'Grantor', 'GRANTOR'
        ];
        
        const foundTerms = [];
        const notFoundTerms = [];
        
        for (const term of searchTerms) {
            if (text.includes(term)) {
                foundTerms.push(term);
                // Find the context around the term
                const index = text.indexOf(term);
                const start = Math.max(0, index - 50);
                const end = Math.min(text.length, index + term.length + 50);
                const context = text.substring(start, end);
                console.log(`✅ Found "${term}": ...${context}...`);
            } else {
                notFoundTerms.push(term);
            }
        }
        
        console.log(`\n📊 SEARCH RESULTS:`);
        console.log(`   • Terms found: ${foundTerms.length}/${searchTerms.length}`);
        console.log(`   • Found: ${foundTerms.join(', ')}`);
        console.log(`   • Not found: ${notFoundTerms.join(', ')}`);
        
        // Check document length and placeholder patterns
        console.log(`\n📏 DOCUMENT STATISTICS:`);
        console.log(`   • Total characters: ${text.length}`);
        console.log(`   • Total words: ${text.split(/\s+/).length}`);
        
        // Look for common placeholder patterns
        const placeholderPatterns = [
            /\[.*?\]/g,  // [placeholder]
            /{.*?}/g,    // {placeholder}
            /_+/g,       // _____ (underscores)
            /\$\{.*?\}/g // ${placeholder}
        ];
        
        let totalPlaceholders = 0;
        placeholderPatterns.forEach((pattern, index) => {
            const matches = text.match(pattern) || [];
            if (matches.length > 0) {
                console.log(`   • Pattern ${index + 1} matches: ${matches.length} (${matches.slice(0, 3).join(', ')}${matches.length > 3 ? '...' : ''})`);
                totalPlaceholders += matches.length;
            }
        });
        
        console.log(`   • Total placeholder patterns: ${totalPlaceholders}`);
        
        if (foundTerms.length === 0) {
            console.log('\n⚠️  WARNING: No client data terms found in document!');
            console.log('   This suggests the AI field mapping may not have worked as expected.');
        } else {
            console.log('\n✅ SUCCESS: Client data found in document!');
            console.log('   AI field mapping appears to be working.');
        }
        
    } catch (error) {
        console.error('❌ Error examining document:', error);
    }
}

// Run the examination
examineDownloadedDocument();