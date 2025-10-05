/**
 * Integration Tests: Customer Override System
 * 
 * Tests the complete customer override workflow including:
 * - Override creation
 * - Version freezing
 * - Effective schema calculation
 * - Override approval
 * - AI custom clause generation (mocked)
 */

import { admin, expect, testHelpers, mockOpenAI } from '../helpers/testHelpers';
import {
  createCustomerOverride,
  updateCustomerOverride,
  getCustomerOverride,
  approveCustomerOverride,
  freezeIntakeVersion,
  getEffectiveSchema,
  getOverrideSections,
} from '../../src/services/customerOverrideManager';

describe('Customer Override System', () => {
  let templateId1: string;
  let templateId2: string;
  let serviceId: string;
  let customerId: string;
  let cleanupItems: Array<{ collection: string; id: string }> = [];

  beforeEach(async () => {
    templateId1 = testHelpers.generateTestId('template');
    templateId2 = testHelpers.generateTestId('template');
    serviceId = testHelpers.generateTestId('service');
    customerId = testHelpers.generateTestId('customer');
    cleanupItems = [];

    // Create test templates
    const template1 = testHelpers.createMockTemplate({ id: templateId1 });
    const template2 = testHelpers.createMockTemplate({ id: templateId2 });

    await testHelpers.createDocument('templates', templateId1, template1);
    await testHelpers.createDocument('templates', templateId2, template2);
    
    cleanupItems.push({ collection: 'templates', id: templateId1 });
    cleanupItems.push({ collection: 'templates', id: templateId2 });

    // Create template versions
    await testHelpers.createDocument(
      `templates/${templateId1}/versions`,
      '1',
      {
        version: 1,
        templateId: templateId1,
        placeholders: testHelpers.createMockPlaceholders(3),
        status: 'published',
        createdBy: 'test_user',
        createdAt: new Date(),
      }
    );

    await testHelpers.createDocument(
      `templates/${templateId2}/versions`,
      '1',
      {
        version: 1,
        templateId: templateId2,
        placeholders: testHelpers.createMockPlaceholders(4),
        status: 'published',
        createdBy: 'test_user',
        createdAt: new Date(),
      }
    );

    // Create test service
    const service = testHelpers.createMockService([templateId1, templateId2], {
      id: serviceId,
    });
    await testHelpers.createDocument('services', serviceId, service);
    cleanupItems.push({ collection: 'services', id: serviceId });
  });

  afterEach(async () => {
    await testHelpers.cleanupMultiple(cleanupItems);
  });

  describe('Override Creation', () => {
    it('should create a customer override', async () => {
      // Arrange
      const modifications = [
        {
          field_key: 'custom_field_1',
          label: 'Custom Field 1',
          type: 'string',
          required: true,
          description: 'Custom field',
          locations: [{ section: 'custom_section' }],
          confidence: 1.0,
        },
      ];

      const customSections = [
        {
          content: 'Custom clause content',
          insertAfter: 'field_1',
          placeholders: ['custom_field_1'],
        },
      ];

      // Act
      const result = await createCustomerOverride({
        customerId,
        templateIds: [templateId1],
        modifications,
        customSections,
        createdBy: 'test_user',
      });

      // Assert
      expect(result).to.have.property('overrideId');
      expect(result.success).to.be.true;

      cleanupItems.push({ collection: 'customerOverrides', id: result.overrideId! });

      // Verify override document was created
      const override = await testHelpers.getDocument('customerOverrides', result.overrideId!);
      expect(override.customerId).to.equal(customerId);
      expect(override.status).to.equal('draft');
      expect(override.modifications).to.have.lengthOf(1);
      expect(override.customSections).to.have.lengthOf(1);
    });

    it('should update an existing override', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      const updatedModifications = [
        {
          field_key: 'updated_field',
          label: 'Updated Field',
          type: 'string',
          required: false,
          description: 'Updated',
          locations: [],
          confidence: 1.0,
        },
      ];

      // Act
      const result = await updateCustomerOverride({
        overrideId,
        modifications: updatedModifications,
        updatedBy: 'test_user',
      });

      // Assert
      expect(result.success).to.be.true;

      // Verify modifications were updated
      const updatedOverride = await testHelpers.getDocument('customerOverrides', overrideId);
      expect(updatedOverride.modifications).to.have.lengthOf(1);
      expect(updatedOverride.modifications[0].field_key).to.equal('updated_field');
    });

    it('should retrieve a customer override', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act
      const retrieved = await getCustomerOverride(overrideId);

      // Assert
      expect(retrieved).to.have.property('id', overrideId);
      expect(retrieved.customerId).to.equal(customerId);
    });
  });

  describe('Override Approval & Version Freezing', () => {
    it('should approve an override and freeze versions', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1, templateId2], {
        id: overrideId,
        customerId,
        status: 'draft',
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act
      const result = await approveCustomerOverride({
        overrideId,
        approvedBy: 'test_approver',
        useApprovedVersions: true,
      });

      // Assert
      expect(result.success).to.be.true;

      // Verify override status changed
      const approvedOverride = await testHelpers.getDocument('customerOverrides', overrideId);
      expect(approvedOverride.status).to.equal('approved');
      expect(approvedOverride).to.have.property('approvedAt');
      expect(approvedOverride).to.have.property('approvedBy', 'test_approver');
      expect(approvedOverride).to.have.property('frozenVersions');
    });

    it('should freeze intake version with all template versions', async () => {
      // Act
      const snapshot = await freezeIntakeVersion({
        templateIds: [templateId1, templateId2],
        useApprovedVersions: true,
        userId: 'test_user',
      });

      // Assert
      expect(snapshot).to.have.property('templateVersions');
      expect(snapshot).to.have.property('frozenAt');
      expect(snapshot).to.have.property('frozenBy', 'test_user');
      expect(snapshot.templateVersions[templateId1]).to.equal(1);
      expect(snapshot.templateVersions[templateId2]).to.equal(1);
    });

    it('should freeze intake version with override', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
        status: 'approved',
        frozenVersions: {
          [templateId1]: 1,
        },
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act
      const snapshot = await freezeIntakeVersion({
        templateIds: [templateId1],
        useApprovedVersions: true,
        userId: 'test_user',
        overrideId,
      });

      // Assert
      expect(snapshot).to.have.property('overrideId', overrideId);
      expect(snapshot.templateVersions[templateId1]).to.equal(1);
    });
  });

  describe('Effective Schema Calculation', () => {
    it('should calculate effective schema (base + overrides)', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const basePlaceholders = [
        { field_key: 'base_field_1', label: 'Base 1', type: 'string', required: true, locations: [] },
        { field_key: 'base_field_2', label: 'Base 2', type: 'string', required: false, locations: [] },
      ];
      const overrideModifications = [
        { field_key: 'custom_field_1', label: 'Custom 1', type: 'string', required: true, locations: [] },
        { field_key: 'base_field_2', label: 'Overridden Base 2', type: 'string', required: true, locations: [] }, // Override existing
      ];

      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
        status: 'approved',
        modifications: overrideModifications,
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Update template version with base placeholders
      await admin.firestore()
        .collection(`templates/${templateId1}/versions`)
        .doc('1')
        .update({ placeholders: basePlaceholders });

      // Act
      const effectiveSchema = await getEffectiveSchema(overrideId, [templateId1]);

      // Assert
      expect(effectiveSchema).to.be.an('array');
      expect(effectiveSchema).to.have.lengthOf(3); // 2 base + 1 custom (base_field_2 overridden)
      
      // Check that custom field is included
      const customField = effectiveSchema.find((f: any) => f.field_key === 'custom_field_1');
      expect(customField).to.exist;

      // Check that base_field_2 was overridden
      const overriddenField = effectiveSchema.find((f: any) => f.field_key === 'base_field_2');
      expect(overriddenField.label).to.equal('Overridden Base 2');
      expect(overriddenField.required).to.be.true;
    });

    it('should return only base schema when no overrides', async () => {
      // Arrange
      const basePlaceholders = testHelpers.createMockPlaceholders(3);

      await admin.firestore()
        .collection(`templates/${templateId1}/versions`)
        .doc('1')
        .update({ placeholders: basePlaceholders });

      // Act - No override ID provided
      const effectiveSchema = await getEffectiveSchema(undefined, [templateId1]);

      // Assert
      expect(effectiveSchema).to.have.lengthOf(3);
    });
  });

  describe('Override Sections Retrieval', () => {
    it('should retrieve override sections for document insertion', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const customSections = [
        {
          content: 'First custom section',
          insertAfter: 'field_1',
          placeholders: ['custom_1'],
        },
        {
          content: 'Second custom section',
          insertAfter: 'field_2',
          placeholders: ['custom_2'],
        },
      ];

      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
        status: 'approved',
        customSections,
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act
      const sections = await getOverrideSections(overrideId);

      // Assert
      expect(sections).to.be.an('array');
      expect(sections).to.have.lengthOf(2);
      expect(sections[0]).to.have.property('content', 'First custom section');
      expect(sections[0]).to.have.property('insertAfter', 'field_1');
      expect(sections[0]).to.have.property('placeholders');
      expect(sections[0].placeholders).to.include('custom_1');
    });

    it('should return empty array when no custom sections', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
        customSections: [],
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act
      const sections = await getOverrideSections(overrideId);

      // Assert
      expect(sections).to.be.an('array');
      expect(sections).to.have.lengthOf(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent override', async () => {
      // Act & Assert
      try {
        await getCustomerOverride('non_existent_override');
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('not found');
      }
    });

    it('should prevent approving already approved override', async () => {
      // Arrange
      const overrideId = testHelpers.generateTestId('override');
      const override = testHelpers.createMockCustomerOverride([templateId1], {
        id: overrideId,
        customerId,
        status: 'approved',
      });

      await testHelpers.createDocument('customerOverrides', overrideId, override);
      cleanupItems.push({ collection: 'customerOverrides', id: overrideId });

      // Act & Assert
      try {
        await approveCustomerOverride({
          overrideId,
          approvedBy: 'test_approver',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('already approved');
      }
    });
  });
});
