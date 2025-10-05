// Test client data mapping based on the logs and expected fields
console.log('🔍 DEBUGGING FIELD MAPPING');

// From logs, we can see these fields being looked for:
const templateFields = [
  'trustName',
  'trustDate', 
  'grantorName', // This was found!
  'grantorDOB',
  'grantorAddress',
  'initialTrusteeName',
  'successorTrustees',
  'coTrusteeName',
  'coTrusteeAddress',
  'coTrusteeDL',
  'bondRequirement',
  'trustPropertyTitling',
  'propertyDivision',
  'minorBeneficiaries',
  'grantorSignatureDate',
  'witnessName',
  'notaryCounty',
  'notaryDate',
  'notaryExpiration',
  'successorCoTrusteeName',
  'legalDescription'
];

// Based on the success with "belal B Tech Global LLC riyad", 
// this looks like a concatenated name from typical form fields
const typicalClientData = {
  fullName: "belal B Tech Global LLC riyad",
  firstName: "belal",
  lastName: "riyad", 
  company: "B Tech Global LLC",
  email: "belal@btechglobal.com",
  phone: "+1-555-123-4567",
  address: "123 Business St, City, State 12345",
  dateOfBirth: "1985-01-15",
  documentDate: "2024-10-04"
};

console.log('\n📊 AVAILABLE CLIENT DATA:');
for (const [key, value] of Object.entries(typicalClientData)) {
  console.log(`   ${key}: "${value}"`);
}

console.log('\n🎯 TEMPLATE FIELDS BEING SEARCHED:');
templateFields.forEach(field => console.log(`   - ${field}`));

console.log('\n🔍 FIELD MAPPING ANALYSIS:');

// Test our smart mapping logic
function findSmartFieldMapping(templateFieldName, clientData) {
  console.log(`\n🔍 Smart mapping search for template field: ${templateFieldName}`);
  
  // Define field mapping rules
  const fieldMappings = {
    // Grantor/Person fields
    'grantorName': ['fullName', 'firstName', 'lastName', 'name', 'clientName'],
    'grantor': ['fullName', 'firstName', 'lastName', 'name', 'clientName'],
    'grantorAddress': ['address', 'propertyAddress', 'streetAddress'],
    'grantorDOB': ['dateOfBirth', 'birthDate', 'dob'],
    'grantorSignatureDate': ['documentDate', 'signatureDate', 'date'],
    
    // Trust fields
    'trustName': ['trustName', 'name', 'fullName'],
    'trustDate': ['documentDate', 'trustDate', 'date'],
    'initialTrusteeName': ['trusteeName', 'trustee', 'fullName'],
    
    // Business fields
    'businessName': ['company', 'businessName', 'companyName'],
    'company': ['company', 'businessName', 'companyName'],
    
    // Contact fields
    'email': ['email', 'emailAddress', 'contactEmail'],
    'phone': ['phone', 'phoneNumber', 'telephone'],
    'address': ['address', 'propertyAddress', 'streetAddress']
  };
  
  // Try exact field name first (case insensitive)
  for (const [clientKey, clientValue] of Object.entries(clientData)) {
    if (clientKey.toLowerCase() === templateFieldName.toLowerCase() && clientValue) {
      console.log(`✅ Found exact match: ${templateFieldName} → ${clientKey} = "${clientValue}"`);
      return String(clientValue);
    }
  }
  
  // Try mapped field names
  const possibleMatches = fieldMappings[templateFieldName] || [];
  for (const possibleField of possibleMatches) {
    for (const [clientKey, clientValue] of Object.entries(clientData)) {
      if (clientKey.toLowerCase() === possibleField.toLowerCase() && clientValue) {
        console.log(`✅ Found mapped match: ${templateFieldName} → ${clientKey} = "${clientValue}"`);
        return String(clientValue);
      }
    }
  }
  
  console.log(`❌ No smart mapping found for: ${templateFieldName}`);
  return null;
}

// Test mapping for key fields
const testFields = ['trustName', 'trustDate', 'grantorName', 'grantorDOB', 'grantorAddress'];
testFields.forEach(field => {
  findSmartFieldMapping(field, typicalClientData);
});

console.log('\n🎯 RESULTS SUMMARY:');
console.log('✅ SHOULD FIND MAPPINGS FOR:');
console.log('   - grantorName → fullName');
console.log('   - grantorDOB → dateOfBirth'); 
console.log('   - grantorAddress → address');
console.log('   - trustDate → documentDate');
console.log('❌ NO MAPPING EXPECTED FOR:');
console.log('   - trustName (no suitable client data)');