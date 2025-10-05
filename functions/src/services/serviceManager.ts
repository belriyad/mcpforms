import * as admin from "firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { Service, Template, FormField, ApiResponse, CreateServiceRequest } from "../types";

// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

export const serviceManager = {
  async createService(data: CreateServiceRequest): Promise<ApiResponse<{ serviceId: string }>> {
    console.log("🚀 ServiceManager: Creating service with data:", JSON.stringify(data, null, 2));
    
    try {
      const { name, description, templateIds, customization } = data;

      if (!name || !description || !templateIds || templateIds.length === 0) {
        console.log("❌ ServiceManager: Missing required fields");
        return { success: false, error: "Missing required fields" };
      }

      console.log("📋 ServiceManager: Verifying templates:", templateIds);
      
      // Verify all templates exist and are parsed
      const templateDocs = await Promise.all(
        templateIds.map(id => db.collection("templates").doc(id).get())
      );

      const templates: Template[] = [];
      for (const doc of templateDocs) {
        const templateData = doc.data();
        console.log(`📄 ServiceManager: Template ${doc.id} exists: ${doc.exists}, data:`, templateData);
        
        if (!doc.exists) {
          console.log(`❌ ServiceManager: Template ${doc.id} not found`);
          return { success: false, error: `Template ${doc.id} not found` };
        }
        const template = templateData as Template;
        if (template.status !== "parsed") {
          console.log(`❌ ServiceManager: Template ${template.name} not ready, status: ${template.status}`);
          return { success: false, error: `Template ${template.name} is not ready (status: ${template.status})` };
        }
        templates.push(template);
      }

      console.log(`✅ ServiceManager: All ${templates.length} templates verified`);

      // Consolidate fields from all templates
      const masterFormJson = serviceManager.consolidateFields(templates);
      console.log(`📝 ServiceManager: Consolidated ${masterFormJson.length} fields`);
      
      // Log customization settings
      if (customization) {
        console.log(`🎨 ServiceManager: Customization enabled with settings:`, customization);
      }

      const serviceId = uuidv4();
      const service: Service = {
        id: serviceId,
        name,
        description,
        templateIds,
        masterFormJson,
        status: "draft",
        createdAt: new Date(),
        updatedAt: new Date(),
        // Add customization settings
        customization_enabled: Boolean(customization),
        customization_rules: customization || null,
      };

      console.log("💾 ServiceManager: Saving service to Firestore:", serviceId);
      await db.collection("services").doc(serviceId).set(service);
      console.log("✅ ServiceManager: Service saved successfully");

      return {
        success: true,
        data: { serviceId },
        message: "Service created successfully",
      };
    } catch (error) {
      console.error("❌ ServiceManager: Error creating service:", error);
      console.error("❌ ServiceManager: Error stack:", (error as Error).stack);
      return { success: false, error: `Failed to create service: ${(error as Error).message}` };
    }
  },

  async updateService(data: { serviceId: string; updates: Partial<Service> }): Promise<ApiResponse> {
    try {
      const { serviceId, updates } = data;

      if (!serviceId) {
        return { success: false, error: "Service ID is required" };
      }

      const serviceDoc = await db.collection("services").doc(serviceId).get();
      if (!serviceDoc.exists) {
        return { success: false, error: "Service not found" };
      }

      // If templateIds are being updated, regenerate masterFormJson
      let updatedData = { ...updates, updatedAt: new Date() };

      if (updates.templateIds) {
        const templateDocs = await Promise.all(
          updates.templateIds.map(id => db.collection("templates").doc(id).get())
        );

        const templates: Template[] = [];
        for (const doc of templateDocs) {
          if (!doc.exists) {
            return { success: false, error: `Template ${doc.id} not found` };
          }
          const template = doc.data() as Template;
          if (template.status !== "parsed") {
            return { success: false, error: `Template ${template.name} is not ready` };
          }
          templates.push(template);
        }

        updatedData.masterFormJson = serviceManager.consolidateFields(templates);
      }

      await db.collection("services").doc(serviceId).update(updatedData);

      return { success: true, message: "Service updated successfully" };
    } catch (error) {
      console.error("Error updating service:", error);
      return { success: false, error: "Failed to update service" };
    }
  },

  async deleteService(data: { serviceId: string }): Promise<ApiResponse> {
    try {
      const { serviceId } = data;

      if (!serviceId) {
        return { success: false, error: "Service ID is required" };
      }

      // Check if service has any active intakes
      const intakesQuery = await db.collection("intakes")
        .where("serviceId", "==", serviceId)
        .where("status", "in", ["opened", "in-progress", "submitted"])
        .limit(1)
        .get();

      if (!intakesQuery.empty) {
        return { success: false, error: "Cannot delete service with active intakes" };
      }

      await db.collection("services").doc(serviceId).delete();

      return { success: true, message: "Service deleted successfully" };
    } catch (error) {
      console.error("Error deleting service:", error);
      return { success: false, error: "Failed to delete service" };
    }
  },

  consolidateFields(templates: Template[]): FormField[] {
    const fieldMap = new Map<string, FormField>();
    
    for (const template of templates) {
      for (const field of template.extractedFields) {
        const key = `${field.name.toLowerCase()}_${field.type}`;
        
        if (!fieldMap.has(key)) {
          fieldMap.set(key, {
            ...field,
            id: uuidv4(), // Generate new ID for consolidated field
          });
        } else {
          // If field already exists, merge options if applicable
          const existingField = fieldMap.get(key)!;
          if (field.options && existingField.options) {
            const mergedOptions = Array.from(new Set([...existingField.options, ...field.options]));
            existingField.options = mergedOptions;
          }
          
          // Keep the more restrictive required setting
          existingField.required = existingField.required || field.required;
          
          // Use the longer description if available
          if (field.description && (!existingField.description || field.description.length > existingField.description.length)) {
            existingField.description = field.description;
          }
        }
      }
    }

    return Array.from(fieldMap.values()).sort((a, b) => {
      // Sort by field importance and type
      const typeOrder = ["text", "email", "number", "date", "select", "textarea", "checkbox", "radio"];
      const aIndex = typeOrder.indexOf(a.type);
      const bIndex = typeOrder.indexOf(b.type);
      
      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
      
      return a.label.localeCompare(b.label);
    });
  },
};