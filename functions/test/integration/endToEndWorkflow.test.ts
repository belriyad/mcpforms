/**
 * Integration Tests: Complete End-to-End Workflow
 * 
 * Tests the complete workflow from template creation to document generation:
 * 1. Upload and version templates
 * 2. Create customer override
 * 3. Approve override (freeze versions)
 * 4. Create intake with frozen versions
 * 5. Generate documents with overrides
 * 
 * This is the most comprehensive integration test covering all major systems.
 */

import { admin, expect, testHelpers } from '../helpers/testHelpers';
import { saveTemplateVersion } from '../../src/services/templateVersionManager';
import {
  createCustomerOverride,
  approveCustomerOverride,
  freezeIntakeVersion,
} from '../../src/services/customerOverrideManager';
import { generateIntakeLinkWithOverrides } from '../../src/services/intakeManager';
import { generateDocuments } from '../../src/services/documentGenerator';

describe('Complete End-to-End Workflow', () => {
  let templateId: string;
  let serviceId: string;
  let customerId: string;
  let cleanupItems: Array<{ collection: string; id: string }> = [];

  beforeEach(async () => {
    templateId = testHelpers.generateTestId('template');
    serviceId = testHelpers.generateTestId('service');
    customerId = testHelpers.generateTestId('customer');
    cleanupItems = [];
  });

  afterEach(async () => {
    await testHelpers.cleanupMultiple(cleanupItems);
  });

  it('should complete full workflow: template → override → intake → document', async () => {
    console.log('\\n=== Starting End-to-End Workflow Test ===\\n');

    // ============================================================
    // STEP 1: Create and version template
    // ============================================================
    console.log('STEP 1: Creating template and version...');

    const template = testHelpers.createMockTemplate({ id: templateId });
    await testHelpers.createDocument('templates', templateId, template);
    cleanupItems.push({ collection: 'templates', id: templateId });

    const basePlaceholders = [
      {
        field_key: 'company_name',
        label: 'Company Name',
        type: 'string',
        required: true,
        description: 'Legal company name',
        locations: [{ page: 1, section: 'header' }],
        confidence: 0.95,
      },
      {
        field_key: 'contract_date',
        label: 'Contract Date',
        type: 'date',
        required: true,
        description: 'Date of contract signing',
        locations: [{ page: 1, section: 'header' }],
        confidence: 0.95,
      },
      {
        field_key: 'service_description',
        label: 'Service Description',
        type: 'string',
        required: true,
        description: 'Description of services provided',
        locations: [{ page: 2, section: 'body' }],
        confidence: 0.90,
      },
    ];

    const versionResult = await saveTemplateVersion({
      templateId,
      placeholders: basePlaceholders,
      userId: 'admin_user',
      reason: 'Initial template version',
    });

    expect(versionResult.version).to.equal(1);
    console.log('✓ Template version 1 created');

    // ============================================================
    // STEP 2: Create service
    // ============================================================
    console.log('\\nSTEP 2: Creating service...');

    const service = testHelpers.createMockService([templateId], {
      id: serviceId,
      name: 'Premium Service Package',
      masterFormJson: basePlaceholders,
    });

    await testHelpers.createDocument('services', serviceId, service);
    cleanupItems.push({ collection: 'services', id: serviceId });
    console.log('✓ Service created');

    // ============================================================
    // STEP 3: Create customer override
    // ============================================================
    console.log('\\nSTEP 3: Creating customer override...');

    const customModifications = [
      {
        field_key: 'custom_sla',
        label: 'Custom SLA Terms',
        type: 'string',
        required: true,
        description: 'Customer-specific SLA requirements',
        locations: [{ section: 'custom_terms' }],
        confidence: 1.0,
      },
      {
        field_key: 'service_description',
        label: 'Enhanced Service Description',
        type: 'string',
        required: true,
        description: 'Customized service description for this customer',
        locations: [{ page: 2, section: 'body' }],
        confidence: 1.0,
      },
    ];

    const customSections = [
      {
        content: `CUSTOM SERVICE LEVEL AGREEMENT
        
This agreement includes the following custom SLA terms:
- Response time: {custom_sla}
- Dedicated support representative
- Monthly performance reports
- Quarterly business reviews`,
        insertAfter: 'service_description',
        placeholders: ['custom_sla'],
      },
    ];

    const overrideResult = await createCustomerOverride({
      customerId,
      templateIds: [templateId],
      modifications: customModifications,
      customSections,
      createdBy: 'sales_rep',
    });

    expect(overrideResult.success).to.be.true;
    const overrideId = overrideResult.overrideId!;
    cleanupItems.push({ collection: 'customerOverrides', id: overrideId });
    console.log('✓ Customer override created:', overrideId);

    // ============================================================
    // STEP 4: Approve override (freeze versions)
    // ============================================================
    console.log('\\nSTEP 4: Approving override...');

    const approvalResult = await approveCustomerOverride({
      overrideId,
      approvedBy: 'legal_team',
      useApprovedVersions: true,
    });

    expect(approvalResult.success).to.be.true;
    console.log('✓ Override approved and versions frozen');

    // Verify versions were frozen
    const approvedOverride = await testHelpers.getDocument('customerOverrides', overrideId);
    expect(approvedOverride.status).to.equal('approved');
    expect(approvedOverride.frozenVersions).to.exist;
    expect(approvedOverride.frozenVersions[templateId]).to.equal(1);

    // ============================================================
    // STEP 5: Create intake with frozen versions
    // ============================================================
    console.log('\\nSTEP 5: Creating intake with frozen versions...');

    const intakeResult = await generateIntakeLinkWithOverrides({
      serviceId,
      customerId,
      templateIds: [templateId],
      useApprovedVersions: true,
      clientEmail: 'client@example.com',
      expiresInDays: 7,
      overrideId,
    });

    expect(intakeResult.success).to.be.true;
    expect(intakeResult.data).to.have.property('intakeId');
    expect(intakeResult.data).to.have.property('intakeUrl');

    const intakeId = intakeResult.data!.intakeId;
    cleanupItems.push({ collection: 'intakes', id: intakeId });
    console.log('✓ Intake created:', intakeId);
    console.log('  Intake URL:', intakeResult.data!.intakeUrl);

    // Verify intake has version snapshot
    const intake = await testHelpers.getDocument('intakes', intakeId);
    expect(intake.versionSnapshot).to.exist;
    expect(intake.versionSnapshot.templateVersions[templateId]).to.equal(1);
    expect(intake.versionSnapshot.overrideId).to.equal(overrideId);
    expect(intake.versionSnapshot.effectiveSchema).to.exist;

    // ============================================================
    // STEP 6: Submit intake form (simulate client filling form)
    // ============================================================
    console.log('\\nSTEP 6: Simulating client form submission...');

    const clientData = {
      company_name: 'Acme Corporation',
      contract_date: '2025-10-15',
      service_description: 'Premium cloud hosting with 99.99% uptime guarantee',
      custom_sla: '2 hours for critical issues, 8 hours for standard support',
    };

    await admin.firestore().collection('intakes').doc(intakeId).update({
      clientData,
      status: 'submitted',
      submittedAt: new Date(),
    });

    console.log('✓ Client data submitted');

    // ============================================================
    // STEP 7: Approve intake
    // ============================================================
    console.log('\\nSTEP 7: Approving intake...');

    await admin.firestore().collection('intakes').doc(intakeId).update({
      status: 'approved',
      approvedAt: new Date(),
      approvedBy: 'admin_user',
    });

    console.log('✓ Intake approved');

    // ============================================================
    // STEP 8: Generate documents with overrides
    // ============================================================
    console.log('\\nSTEP 8: Generating documents...');

    // Note: This test mocks the document generation
    // In a real test, you'd need actual template files
    const generateResult = await generateDocuments({
      intakeId,
      userId: 'admin_user',
    });

    expect(generateResult.success).to.be.true;
    expect(generateResult.documentIds).to.be.an('array');
    console.log('✓ Documents generated:', generateResult.documentIds.length);

    // ============================================================
    // VERIFICATION: Check that everything is consistent
    // ============================================================
    console.log('\\nVERIFICATION: Checking data consistency...');

    // 1. Verify intake used correct version
    const finalIntake = await testHelpers.getDocument('intakes', intakeId);
    expect(finalIntake.versionSnapshot.templateVersions[templateId]).to.equal(1);
    console.log('✓ Intake used template version 1 (as frozen)');

    // 2. Verify effective schema includes both base and custom fields
    const effectiveSchema = finalIntake.versionSnapshot.effectiveSchema;
    const baseField = effectiveSchema.find((f: any) => f.field_key === 'company_name');
    const customField = effectiveSchema.find((f: any) => f.field_key === 'custom_sla');
    const overriddenField = effectiveSchema.find((f: any) => f.field_key === 'service_description');

    expect(baseField).to.exist;
    expect(baseField.label).to.equal('Company Name');
    console.log('✓ Base field present in effective schema');

    expect(customField).to.exist;
    expect(customField.label).to.equal('Custom SLA Terms');
    console.log('✓ Custom field present in effective schema');

    expect(overriddenField).to.exist;
    expect(overriddenField.label).to.equal('Enhanced Service Description');
    console.log('✓ Overridden field has updated label');

    // 3. Verify client data includes all required fields
    expect(finalIntake.clientData).to.have.property('company_name');
    expect(finalIntake.clientData).to.have.property('custom_sla');
    console.log('✓ Client data includes base and custom fields');

    // 4. Verify documents were generated
    expect(generateResult.documentIds.length).to.be.greaterThan(0);
    console.log('✓ Documents generated successfully');

    console.log('\\n=== End-to-End Workflow Test PASSED ===\\n');
  });

  it('should handle version changes after override approval', async () => {
    console.log('\\n=== Testing Version Immutability ===\\n');

    // Setup: Create template version 1
    const template = testHelpers.createMockTemplate({ id: templateId });
    await testHelpers.createDocument('templates', templateId, template);
    cleanupItems.push({ collection: 'templates', id: templateId });

    const placeholders1 = testHelpers.createMockPlaceholders(3);
    await saveTemplateVersion({
      templateId,
      placeholders: placeholders1,
      userId: 'admin_user',
      reason: 'Version 1',
    });

    // Create service
    const service = testHelpers.createMockService([templateId], { id: serviceId });
    await testHelpers.createDocument('services', serviceId, service);
    cleanupItems.push({ collection: 'services', id: serviceId });

    // Create and approve override (freezes at version 1)
    const overrideResult = await createCustomerOverride({
      customerId,
      templateIds: [templateId],
      modifications: testHelpers.createMockPlaceholders(1),
      customSections: [],
      createdBy: 'sales_rep',
    });

    const overrideId = overrideResult.overrideId!;
    cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

    await approveCustomerOverride({
      overrideId,
      approvedBy: 'legal_team',
      useApprovedVersions: true,
    });

    console.log('✓ Override approved, version frozen at 1');

    // Create intake with frozen version
    const intakeResult = await generateIntakeLinkWithOverrides({
      serviceId,
      customerId,
      templateIds: [templateId],
      useApprovedVersions: true,
      clientEmail: 'client@example.com',
      overrideId,
    });

    const intakeId = intakeResult.data!.intakeId;
    cleanupItems.push({ collection: 'intakes', id: intakeId });

    // NOW: Create version 2 (should not affect intake)
    const placeholders2 = testHelpers.createMockPlaceholders(5);
    await saveTemplateVersion({
      templateId,
      placeholders: placeholders2,
      userId: 'admin_user',
      reason: 'Version 2 - Updated placeholders',
    });

    console.log('✓ Version 2 created (with different placeholders)');

    // Verify intake still uses version 1
    const intake = await testHelpers.getDocument('intakes', intakeId);
    expect(intake.versionSnapshot.templateVersions[templateId]).to.equal(1);
    expect(intake.versionSnapshot.effectiveSchema).to.have.lengthOf(4); // 3 base + 1 custom

    console.log('✓ Intake still uses version 1 (immutable)');
    console.log('\\n=== Version Immutability Test PASSED ===\\n');
  });

  it('should prevent document generation with mismatched data', async () => {
    console.log('\\n=== Testing Data Validation ===\\n');

    // Setup
    const template = testHelpers.createMockTemplate({ id: templateId });
    await testHelpers.createDocument('templates', templateId, template);
    cleanupItems.push({ collection: 'templates', id: templateId });

    const placeholders = [
      {
        field_key: 'required_field',
        label: 'Required Field',
        type: 'string',
        required: true,
        locations: [],
        confidence: 0.95,
      },
    ];

    await saveTemplateVersion({
      templateId,
      placeholders,
      userId: 'admin_user',
      reason: 'Test version',
    });

    const service = testHelpers.createMockService([templateId], { id: serviceId });
    await testHelpers.createDocument('services', serviceId, service);
    cleanupItems.push({ collection: 'services', id: serviceId });

    // Create intake
    const intakeResult = await generateIntakeLinkWithOverrides({
      serviceId,
      customerId,
      templateIds: [templateId],
      useApprovedVersions: true,
      clientEmail: 'client@example.com',
    });

    const intakeId = intakeResult.data!.intakeId;
    cleanupItems.push({ collection: 'intakes', id: intakeId });

    // Submit with missing required field
    await admin.firestore().collection('intakes').doc(intakeId).update({
      clientData: {}, // Missing required_field
      status: 'submitted',
    });

    // Try to generate documents (should fail validation)
    try {
      await generateDocuments({
        intakeId,
        userId: 'admin_user',
      });
      expect.fail('Should have thrown validation error');
    } catch (error: any) {
      expect(error.message).to.include('required');
      console.log('✓ Validation correctly rejected missing required field');
    }

    console.log('\\n=== Data Validation Test PASSED ===\\n');
  });
});
