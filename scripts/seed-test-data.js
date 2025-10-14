#!/usr/bin/env node
/**
 * Seed Test Data Script
 * 
 * This script creates sample templates in Firestore so E2E tests can run.
 * Run with: node scripts/seed-test-data.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY)?.replace(/\\n/g, '\n')
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  try {
    // Check if templates already exist
    const templatesSnapshot = await db.collection('templates').limit(1).get();
    
    if (!templatesSnapshot.empty) {
      console.log('✅ Templates already exist in database');
      console.log(`   Found ${templatesSnapshot.size} template(s)`);
      console.log('\n💡 Tip: Delete existing templates first if you want fresh test data\n');
      process.exit(0);
    }

    // Get test user ID (use the E2E test user)
    const testEmail = 'e2etest1760215582016@mcpforms.test';
    const usersSnapshot = await db.collection('users')
      .where('email', '==', testEmail)
      .limit(1)
      .get();

    let testUserId;
    if (usersSnapshot.empty) {
      console.log('⚠️  Test user not found, creating one...');
      const userRef = await db.collection('users').add({
        email: testEmail,
        name: 'E2E Test User',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      testUserId = userRef.id;
      console.log(`✅ Created test user: ${testUserId}`);
    } else {
      testUserId = usersSnapshot.docs[0].id;
      console.log(`✅ Found test user: ${testUserId}`);
    }

    // Create sample templates
    const sampleTemplates = [
      {
        name: 'Sample Employment Contract',
        description: 'Standard employment agreement template',
        fileName: 'employment-contract.docx',
        fileSize: 25600,
        uploadedBy: testUserId,
        status: 'active',
        extractedFields: [
          { name: 'employeeName', label: 'Employee Name', type: 'text', required: true },
          { name: 'jobTitle', label: 'Job Title', type: 'text', required: true },
          { name: 'startDate', label: 'Start Date', type: 'date', required: true },
          { name: 'salary', label: 'Annual Salary', type: 'number', required: true },
          { name: 'department', label: 'Department', type: 'text', required: false }
        ],
        placeholderCount: 5,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Sample NDA Agreement',
        description: 'Non-disclosure agreement for contractors',
        fileName: 'nda-template.docx',
        fileSize: 18400,
        uploadedBy: testUserId,
        status: 'active',
        extractedFields: [
          { name: 'partyName', label: 'Party Name', type: 'text', required: true },
          { name: 'companyName', label: 'Company Name', type: 'text', required: true },
          { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
          { name: 'termMonths', label: 'Term (months)', type: 'number', required: true }
        ],
        placeholderCount: 4,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      {
        name: 'Sample Service Agreement',
        description: 'General service agreement template',
        fileName: 'service-agreement.docx',
        fileSize: 32000,
        uploadedBy: testUserId,
        status: 'active',
        extractedFields: [
          { name: 'clientName', label: 'Client Name', type: 'text', required: true },
          { name: 'serviceName', label: 'Service Name', type: 'text', required: true },
          { name: 'projectScope', label: 'Project Scope', type: 'textarea', required: true },
          { name: 'deliveryDate', label: 'Delivery Date', type: 'date', required: true },
          { name: 'totalCost', label: 'Total Cost', type: 'number', required: true },
          { name: 'paymentTerms', label: 'Payment Terms', type: 'text', required: false }
        ],
        placeholderCount: 6,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    ];

    console.log('\n📄 Creating sample templates...');
    const templateIds = [];
    
    for (const template of sampleTemplates) {
      const templateRef = await db.collection('templates').add(template);
      templateIds.push(templateRef.id);
      console.log(`   ✅ Created: ${template.name} (ID: ${templateRef.id})`);
    }

    console.log('\n✨ Test data seeding complete!');
    console.log(`   📊 Created ${templateIds.length} templates`);
    console.log(`   👤 Test user: ${testUserId}`);
    console.log('\n🎉 You can now run E2E tests successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error seeding test data:', error);
    console.error('   Make sure your Firebase credentials are set in .env.local\n');
    process.exit(1);
  }
}

// Run the seeding
seedTestData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
