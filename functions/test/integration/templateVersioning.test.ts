/**
 * Integration Tests: Template Versioning Workflow
 * 
 * Tests the complete template versioning system including:
 * - Template creation
 * - Version publishing
 * - Version history
 * - Rollback functionality
 * - Optimistic locking
 * - Concurrent edit handling
 */

import { admin, expect, testHelpers } from '../helpers/testHelpers';
import {
  saveTemplateVersion,
  publishTemplateVersion,
  getTemplateVersion,
  listTemplateVersions,
  rollbackToVersion,
  acquireLock,
  releaseLock,
  checkLock,
} from '../../src/services/templateVersionManager';

describe('Template Versioning Workflow', () => {
  let templateId: string;
  let cleanupItems: Array<{ collection: string; id: string }> = [];

  beforeEach(() => {
    templateId = testHelpers.generateTestId('template');
    cleanupItems = [];
  });

  afterEach(async () => {
    await testHelpers.cleanupMultiple(cleanupItems);
  });

  describe('Basic Version Management', () => {
    it('should create a new template version', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const placeholders = testHelpers.createMockPlaceholders(3);
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Act
      const result = await saveTemplateVersion({
        templateId,
        placeholders,
        userId,
        reason: 'Initial version',
      });

      // Assert
      expect(result).to.have.property('version', 1);
      expect(result).to.have.property('etag');
      expect(result).to.have.property('diff');

      // Verify version document was created
      await testHelpers.assertDocumentExists(
        `templates/${templateId}/versions`,
        '1'
      );
      cleanupItems.push({
        collection: `templates/${templateId}/versions`,
        id: '1',
      });

      // Verify template was updated
      const updatedTemplate = await testHelpers.getDocument('templates', templateId);
      expect(updatedTemplate.currentVersion).to.equal(1);
    });

    it('should detect changes between versions (diff)', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const placeholders1 = [
        { field_key: 'field_1', label: 'Field 1', type: 'string', required: true, locations: [] },
        { field_key: 'field_2', label: 'Field 2', type: 'string', required: false, locations: [] },
      ];
      const placeholders2 = [
        { field_key: 'field_1', label: 'Field 1 Updated', type: 'string', required: true, locations: [] },
        { field_key: 'field_3', label: 'Field 3', type: 'string', required: false, locations: [] },
      ];
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Act - Create version 1
      await saveTemplateVersion({
        templateId,
        placeholders: placeholders1,
        userId,
        reason: 'Version 1',
      });

      // Act - Create version 2
      const result = await saveTemplateVersion({
        templateId,
        placeholders: placeholders2,
        userId,
        reason: 'Version 2',
      });

      // Assert
      expect(result.version).to.equal(2);
      expect(result.diff).to.have.property('added');
      expect(result.diff).to.have.property('removed');
      expect(result.diff).to.have.property('renamed');
      
      expect(result.diff.added).to.include('field_3');
      expect(result.diff.removed).to.include('field_2');
      expect(result.diff.renamed).to.deep.include({
        from: 'field_1',
        to: 'field_1',
        labelChanged: true,
      });
    });

    it('should retrieve a specific version', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const placeholders = testHelpers.createMockPlaceholders(3);
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      const { version } = await saveTemplateVersion({
        templateId,
        placeholders,
        userId,
        reason: 'Test version',
      });

      // Act
      const retrievedVersion = await getTemplateVersion(templateId, version);

      // Assert
      expect(retrievedVersion).to.have.property('version', version);
      expect(retrievedVersion).to.have.property('placeholders');
      expect(retrievedVersion.placeholders).to.have.lengthOf(3);
    });

    it('should list all versions for a template', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Create 3 versions
      for (let i = 1; i <= 3; i++) {
        await saveTemplateVersion({
          templateId,
          placeholders: testHelpers.createMockPlaceholders(i),
          userId,
          reason: `Version ${i}`,
        });
      }

      // Act
      const versions = await listTemplateVersions(templateId);

      // Assert
      expect(versions).to.have.lengthOf(3);
      expect(versions[0].version).to.equal(3); // Most recent first
      expect(versions[1].version).to.equal(2);
      expect(versions[2].version).to.equal(1);
    });
  });

  describe('Version Rollback', () => {
    it('should rollback to a previous version', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const placeholders1 = testHelpers.createMockPlaceholders(3);
      const placeholders2 = testHelpers.createMockPlaceholders(5);
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Create version 1
      await saveTemplateVersion({
        templateId,
        placeholders: placeholders1,
        userId,
        reason: 'Version 1',
      });

      // Create version 2
      await saveTemplateVersion({
        templateId,
        placeholders: placeholders2,
        userId,
        reason: 'Version 2',
      });

      // Act - Rollback to version 1
      const result = await rollbackToVersion({
        templateId,
        targetVersion: 1,
        userId,
        reason: 'Testing rollback',
      });

      // Assert
      expect(result.version).to.equal(3); // New version created
      expect(result).to.have.property('rolledBackTo', 1);
      expect(result).to.have.property('rolledBackFrom', 2);

      // Verify the placeholders match version 1
      const version3 = await getTemplateVersion(templateId, 3);
      expect(version3.placeholders).to.have.lengthOf(3);
      expect(version3.isRollback).to.be.true;
    });
  });

  describe('Optimistic Locking', () => {
    it('should acquire a lock successfully', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Act
      const result = await acquireLock(templateId, userId);

      // Assert
      expect(result.acquired).to.be.true;
      expect(result).to.have.property('expiresAt');
      expect(result.expiresAt).to.be.instanceof(Date);
    });

    it('should prevent concurrent edits by different users', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const user1 = 'test_user_1';
      const user2 = 'test_user_2';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // User 1 acquires lock
      await acquireLock(templateId, user1);

      // Act - User 2 tries to acquire lock
      const result = await acquireLock(templateId, user2);

      // Assert
      expect(result.acquired).to.be.false;
      expect(result).to.have.property('currentHolder', user1);
    });

    it('should allow same user to refresh lock', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // User acquires lock
      await acquireLock(templateId, userId);

      // Act - Same user re-acquires lock (refresh)
      const result = await acquireLock(templateId, userId);

      // Assert
      expect(result.acquired).to.be.true;
    });

    it('should release a lock successfully', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      await acquireLock(templateId, userId);

      // Act
      const result = await releaseLock(templateId, userId);

      // Assert
      expect(result.released).to.be.true;

      // Verify another user can now acquire lock
      const user2Result = await acquireLock(templateId, 'test_user_2');
      expect(user2Result.acquired).to.be.true;
    });

    it('should check lock status correctly', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Act - Check when no lock
      const noLock = await checkLock(templateId, userId);
      expect(noLock).to.be.false;

      // Acquire lock
      await acquireLock(templateId, userId);

      // Act - Check when locked by same user
      const hasLock = await checkLock(templateId, userId);
      expect(hasLock).to.be.true;

      // Act - Check when locked by different user
      const differentUser = await checkLock(templateId, 'test_user_2');
      expect(differentUser).to.be.false;
    });
  });

  describe('Version Publishing', () => {
    it('should publish a draft version', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      const placeholders = testHelpers.createMockPlaceholders(3);
      const userId = 'test_user_1';

      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      const { version } = await saveTemplateVersion({
        templateId,
        placeholders,
        userId,
        reason: 'Draft version',
      });

      // Act
      const result = await publishTemplateVersion({
        templateId,
        version,
        userId,
      });

      // Assert
      expect(result.success).to.be.true;

      // Verify version status changed
      const publishedVersion = await getTemplateVersion(templateId, version);
      expect(publishedVersion.status).to.equal('published');
      expect(publishedVersion).to.have.property('publishedAt');
      expect(publishedVersion).to.have.property('publishedBy', userId);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent template', async () => {
      // Act & Assert
      try {
        await saveTemplateVersion({
          templateId: 'non_existent_template',
          placeholders: testHelpers.createMockPlaceholders(3),
          userId: 'test_user',
          reason: 'Test',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Template not found');
      }
    });

    it('should handle invalid version number for rollback', async () => {
      // Arrange
      const template = testHelpers.createMockTemplate({ id: templateId });
      await testHelpers.createDocument('templates', templateId, template);
      cleanupItems.push({ collection: 'templates', id: templateId });

      // Act & Assert
      try {
        await rollbackToVersion({
          templateId,
          targetVersion: 999,
          userId: 'test_user',
          reason: 'Test',
        });
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).to.include('Version not found');
      }
    });
  });
});
