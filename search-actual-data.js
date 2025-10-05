const fs = require('fs');
const mammoth = require('mammoth');

async function findActualClientData() {
    try {
        console.log('🔍 SEARCHING FOR ACTUAL CLIENT DATA VALUES\n');
        console.log('═'.repeat(60));
        
        if (!fs.existsSync('fixed_document.docx')) {
            console.log('❌ Fixed document file not found!');
            return;
        }
        
        const result = await mammoth.extractRawText({ path: 'fixed_document.docx' });
        const text = result.value;
        
        console.log('📋 SEARCHING FOR ACTUAL CLIENT DATA FROM FIRESTORE:');
        console.log('-'.repeat(50));
        
        // The actual client data values from Firestore
        const actualClientData = {
            fullName: "belal B Tech Global LLC riyad",
            trusteeName: "Belal Riyad",
            email: "briyad@gmail.com",
            phone: "4802025515",
            documentDate: "2025-09-29",
            propertyAddress: "2046 277th Ave SE",
            companyName: "B Tech Global LLC",
            grantorName: "belal B Tech Global LLC riyad"
        };
        
        let foundValues = [];
        let notFoundValues = [];
        
        for (const [field, value] of Object.entries(actualClientData)) {
            if (text.includes(value)) {
                foundValues.push({ field, value });
                // Find context
                const index = text.indexOf(value);
                const start = Math.max(0, index - 40);
                const end = Math.min(text.length, index + value.length + 40);
                const context = text.substring(start, end).replace(/\s+/g, ' ').trim();
                console.log(`✅ FOUND "${field}": "${value}"`);
                console.log(`   Context: ...${context}...`);
            } else {
                notFoundValues.push({ field, value });
                console.log(`❌ NOT FOUND "${field}": "${value}"`);
            }
        }
        
        console.log(`\n📊 ACTUAL CLIENT DATA SEARCH RESULTS:`);
        console.log(`   • Values found: ${foundValues.length}/${Object.keys(actualClientData).length}`);
        console.log(`   • Success rate: ${Math.round((foundValues.length/Object.keys(actualClientData).length)*100)}%`);
        
        // Check for fallback values that might have been used instead
        console.log(`\n🔍 CHECKING FOR FALLBACK VALUES:`);
        const fallbackValues = [
            'Name Not Provided',
            'Trustee Not Provided', 
            'Co-Trustee Not Provided',
            'Property Address Not Provided'
        ];
        
        let fallbacksFound = [];
        for (const fallback of fallbackValues) {
            if (text.includes(fallback)) {
                fallbacksFound.push(fallback);
                console.log(`⚠️  Found fallback: "${fallback}"`);
            }
        }
        
        // Also check for partial matches (like just "belal" or "Belal")
        console.log(`\n🔍 CHECKING FOR PARTIAL MATCHES:`);
        const partialSearches = [
            'belal', 'Belal', 'BELAL',
            'riyad', 'Riyad', 'RIYAD',
            'Tech Global', 'LLC',
            '2046 277th', '4802025515',
            'briyad@gmail'
        ];
        
        let partialMatches = [];
        for (const partial of partialSearches) {
            if (text.includes(partial)) {
                partialMatches.push(partial);
                const index = text.indexOf(partial);
                const start = Math.max(0, index - 30);
                const end = Math.min(text.length, index + partial.length + 30);
                const context = text.substring(start, end).replace(/\s+/g, ' ').trim();
                console.log(`✅ PARTIAL MATCH: "${partial}" - ...${context}...`);
            }
        }
        
        console.log(`\n🎯 ANALYSIS SUMMARY:`);
        if (foundValues.length > 0) {
            console.log('🎉 SUCCESS! Client data IS being inserted into the document!');
            console.log(`📈 Found ${foundValues.length} complete matches out of ${Object.keys(actualClientData).length} possible`);
        } else if (partialMatches.length > 0) {
            console.log('⚡ PARTIAL SUCCESS! Some client data components found.');
            console.log('🔧 The replacement logic may be working but with modified formatting.');
        } else if (fallbacksFound.length > 0) {
            console.log('⚠️  The replacement logic is working but using fallback values.');
            console.log('🐛 Need to debug why client data isn\'t being passed correctly.');
        } else {
            console.log('❌ No client data or fallbacks found. Replacement logic not working.');
        }
        
    } catch (error) {
        console.error('❌ Error searching for client data:', error);
    }
}

// Run the search
findActualClientData();