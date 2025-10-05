import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Intake, Service, ApiResponse, GenerateIntakeLinkRequest, SubmitIntakeRequest } from "../types";
import { IntakeVersionSnapshot, PlaceholderField } from "../types/versioning";
import { freezeIntakeVersion, getEffectiveSchema } from "./customerOverrideManager";

// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const app = express();
app.use(cors({ origin: true }));

export const intakeManager = {
  async generateIntakeLink(data: GenerateIntakeLinkRequest): Promise<ApiResponse<{ intakeId: string; intakeUrl: string }>> {
    try {
      const { serviceId, clientEmail, expiresInDays = 30 } = data;

      if (!serviceId) {
        return { success: false, error: "Service ID is required" };
      }

      // Verify service exists and is active
      const serviceDoc = await db.collection("services").doc(serviceId).get();
      if (!serviceDoc.exists) {
        return { success: false, error: "Service not found" };
      }

      const service = serviceDoc.data() as Service;
      if (service.status !== "active") {
        return { success: false, error: "Service is not active" };
      }

      const intakeId = uuidv4();
      const linkToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const intake: Intake = {
        id: intakeId,
        serviceId,
        serviceName: service.name,
        linkToken,
        clientData: {},
        status: "link-generated",
        createdAt: new Date(),
        updatedAt: new Date(),
        clientEmail,
        expiresAt,
      };

      await db.collection("intakes").doc(intakeId).set(intake);

      // Get base URL from config with fallback
      const config = functions.config();
      console.log('🔗 IntakeManager: Firebase config:', { app: config.app });
      
      const baseUrl = config.app?.base_url || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const intakeUrl = `${baseUrl}/intake/${linkToken}`;
      
      console.log('🔗 IntakeManager: Generated intake link:', {
        intakeId,
        linkToken,
        baseUrl,
        intakeUrl
      });

      return {
        success: true,
        data: { intakeId, intakeUrl },
        message: "Intake link generated successfully",
      };
    } catch (error) {
      console.error("Error generating intake link:", error);
      return { success: false, error: "Failed to generate intake link" };
    }
  },

  /**
   * Generate intake link with customer overrides and frozen template versions
   * @param data - Request data with serviceId, customerId, templateIds, and override options
   * @returns ApiResponse with intakeId and intakeUrl
   */
  async generateIntakeLinkWithOverrides(data: {
    serviceId: string;
    customerId: string;
    templateIds?: string[];
    useApprovedVersions?: boolean;
    clientEmail?: string;
    expiresInDays?: number;
    overrideId?: string;
  }): Promise<ApiResponse<{ intakeId: string; intakeUrl: string }>> {
    try {
      const { 
        serviceId, 
        customerId, 
        templateIds, 
        useApprovedVersions = true,
        clientEmail,
        expiresInDays = 30,
        overrideId
      } = data;

      if (!serviceId || !customerId) {
        return { success: false, error: "Service ID and Customer ID are required" };
      }

      // Verify service exists and is active
      const serviceDoc = await db.collection("services").doc(serviceId).get();
      if (!serviceDoc.exists) {
        return { success: false, error: "Service not found" };
      }

      const service = serviceDoc.data() as Service;
      if (service.status !== "active") {
        return { success: false, error: "Service is not active" };
      }

      // Use provided templateIds or all templates from service
      const templatesToUse = templateIds || service.templateIds;
      if (!templatesToUse || templatesToUse.length === 0) {
        return { success: false, error: "No templates specified" };
      }

      const intakeId = uuidv4();
      const linkToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      console.log(`🔒 [INTAKE-OVERRIDE] Creating intake with frozen versions for customer ${customerId}`);

      // Freeze template versions for this intake
      let versionSnapshot: IntakeVersionSnapshot | undefined;
      try {
        versionSnapshot = await freezeIntakeVersion(
          intakeId,
          templatesToUse,
          useApprovedVersions
        );
        
        // If overrideId is provided, add it to the snapshot
        if (overrideId) {
          versionSnapshot.overrideId = overrideId;
          console.log(`🔧 [INTAKE-OVERRIDE] Attached override ${overrideId} to intake`);
        }
        
        console.log(`✅ [INTAKE-OVERRIDE] Frozen ${Object.keys(versionSnapshot.templateVersions).length} template versions`);
      } catch (freezeError) {
        console.error(`⚠️ [INTAKE-OVERRIDE] Failed to freeze versions:`, freezeError);
        return { 
          success: false, 
          error: "Failed to freeze template versions: " + (freezeError instanceof Error ? freezeError.message : String(freezeError))
        };
      }

      const intake: Intake & { versionSnapshot?: IntakeVersionSnapshot } = {
        id: intakeId,
        serviceId,
        serviceName: service.name,
        linkToken,
        clientData: {},
        status: "link-generated",
        createdAt: new Date(),
        updatedAt: new Date(),
        clientEmail,
        expiresAt,
        versionSnapshot
      };

      await db.collection("intakes").doc(intakeId).set(intake);

      // Get base URL from config with fallback
      const config = functions.config();
      const baseUrl = config.app?.base_url || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const intakeUrl = `${baseUrl}/intake/${linkToken}`;
      
      console.log(`✅ [INTAKE-OVERRIDE] Generated intake link with overrides:`, {
        intakeId,
        customerId,
        frozenVersions: Object.keys(versionSnapshot.templateVersions).length,
        overrideId: overrideId || 'none',
        intakeUrl
      });

      return {
        success: true,
        data: { intakeId, intakeUrl },
        message: "Intake link generated successfully with frozen template versions",
      };
    } catch (error) {
      console.error("Error generating intake link with overrides:", error);
      return { success: false, error: "Failed to generate intake link with overrides" };
    }
  },

  /**
   * Get the form schema for an intake, including customer overrides
   * @param intakeId - Intake ID
   * @returns ApiResponse with form fields (merged schema)
   */
  async getIntakeFormSchema(intakeId: string): Promise<ApiResponse<{ formFields: PlaceholderField[] }>> {
    try {
      if (!intakeId) {
        return { success: false, error: "Intake ID is required" };
      }

      const intakeDoc = await db.collection("intakes").doc(intakeId).get();
      if (!intakeDoc.exists) {
        return { success: false, error: "Intake not found" };
      }

      const intake = intakeDoc.data() as Intake & { versionSnapshot?: IntakeVersionSnapshot };

      // If intake has version snapshot with overrides, get effective schema
      if (intake.versionSnapshot?.overrideId) {
        console.log(`📝 [INTAKE-SCHEMA] Getting effective schema for intake ${intakeId} with overrides`);
        try {
          const effectiveSchema = await getEffectiveSchema(intakeId);
          console.log(`✅ [INTAKE-SCHEMA] Retrieved effective schema with ${effectiveSchema.length} fields`);
          return {
            success: true,
            data: { formFields: effectiveSchema },
            message: "Form schema retrieved with customer overrides"
          };
        } catch (schemaError) {
          console.error(`⚠️ [INTAKE-SCHEMA] Failed to get effective schema:`, schemaError);
          // Fall back to service schema
        }
      }

      // Fall back to service's master form schema
      const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
      if (!serviceDoc.exists) {
        return { success: false, error: "Service not found" };
      }

      const service = serviceDoc.data() as Service;
      
      // Convert service form fields to placeholder fields format
      const formFields: PlaceholderField[] = service.masterFormJson.map(field => ({
        field_key: field.name,
        label: field.label,
        type: field.type as any, // Map form field types to placeholder types
        locations: [], // No specific locations for intake forms
        required: field.required,
        description: field.description,
        options: field.options,
        validation: field.validation
      }));

      console.log(`📝 [INTAKE-SCHEMA] Using service schema with ${formFields.length} fields`);

      return {
        success: true,
        data: { formFields },
        message: "Form schema retrieved from service"
      };
    } catch (error) {
      console.error("Error getting intake form schema:", error);
      return { success: false, error: "Failed to get intake form schema" };
    }
  },

  async submitIntakeForm(data: SubmitIntakeRequest): Promise<ApiResponse> {
    try {
      const { intakeId, formData, clientInfo } = data;

      if (!intakeId || !formData) {
        return { success: false, error: "Missing required fields" };
      }

      const intakeDoc = await db.collection("intakes").doc(intakeId).get();
      if (!intakeDoc.exists) {
        return { success: false, error: "Intake not found" };
      }

      const intake = intakeDoc.data() as Intake;
      
      // Check if intake is expired
      if (intake.expiresAt && (intake.expiresAt as any).toDate() < new Date()) {
        return { success: false, error: "Intake link has expired" };
      }

      // Check if intake is in valid state for submission
      if (!["opened", "in-progress"].includes(intake.status)) {
        return { success: false, error: "Intake is not available for submission" };
      }

      const updates: Partial<Intake> = {
        clientData: formData,
        status: "submitted",
        submittedAt: new Date(),
        updatedAt: new Date(),
      };

      if (clientInfo) {
        updates.clientName = clientInfo.name;
        updates.clientEmail = clientInfo.email;
      }

      await db.collection("intakes").doc(intakeId).update(updates);

      return { success: true, message: "Intake form submitted successfully" };
    } catch (error) {
      console.error("Error submitting intake form:", error);
      return { success: false, error: "Failed to submit intake form" };
    }
  },

  async approveIntakeForm(data: { intakeId: string; approved: boolean; notes?: string }): Promise<ApiResponse> {
    try {
      const { intakeId, approved, notes } = data;

      if (!intakeId) {
        return { success: false, error: "Intake ID is required" };
      }

      const intakeDoc = await db.collection("intakes").doc(intakeId).get();
      if (!intakeDoc.exists) {
        return { success: false, error: "Intake not found" };
      }

      const intake = intakeDoc.data() as Intake;
      if (intake.status !== "submitted") {
        return { success: false, error: "Intake is not ready for approval" };
      }

      const updates: Partial<Intake> = {
        status: approved ? "approved" : "rejected",
        approvedAt: new Date(),
        updatedAt: new Date(),
      };

      if (notes) {
        (updates as any).approvalNotes = notes;
      }

      await db.collection("intakes").doc(intakeId).update(updates);

      return { 
        success: true, 
        message: `Intake ${approved ? "approved" : "rejected"} successfully` 
      };
    } catch (error) {
      console.error("Error approving intake form:", error);
      return { success: false, error: "Failed to approve intake form" };
    }
  },

  // HTTP API for public intake forms
  intakeFormAPI: express.Router()
    .get("/intake/:token", async (req, res) => {
      try {
        const { token } = req.params;

        if (!token) {
          return res.status(400).json({ success: false, error: "Token is required" });
        }

        // Find intake by token
        const intakeQuery = await db.collection("intakes")
          .where("linkToken", "==", token)
          .limit(1)
          .get();

        if (intakeQuery.empty) {
          return res.status(404).json({ success: false, error: "Intake not found" });
        }

        const intakeDoc = intakeQuery.docs[0];
        const intake = intakeDoc.data() as Intake;

        // Check if expired
        if (intake.expiresAt && (intake.expiresAt as any).toDate() < new Date()) {
          return res.status(410).json({ success: false, error: "Intake link has expired" });
        }

        // Get service details
        const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
        if (!serviceDoc.exists) {
          return res.status(404).json({ success: false, error: "Service not found" });
        }

        const service = serviceDoc.data() as Service;

        // Update status to opened if it's the first time
        if (intake.status === "link-generated") {
          await db.collection("intakes").doc(intakeDoc.id).update({
            status: "opened",
            updatedAt: new Date(),
          });
        }

        res.json({
          success: true,
          data: {
            intakeId: intakeDoc.id,
            serviceName: service.name,
            serviceDescription: service.description,
            formFields: service.masterFormJson,
            clientData: intake.clientData,
            status: intake.status,
            customizationEnabled: service.customization_enabled || false,
            customizationRules: service.customization_rules || null,
            existingCustomFields: intake.custom_fields || [],
            existingCustomClauses: intake.custom_clauses || [],
          },
        });
      } catch (error) {
        console.error("Error getting intake form:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
      return;
    })
    .post("/intake/:token/save", async (req, res) => {
      try {
        const { token } = req.params;
        const { formData, customFields, customClauses } = req.body;

        if (!token || !formData) {
          return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const intakeQuery = await db.collection("intakes")
          .where("linkToken", "==", token)
          .limit(1)
          .get();

        if (intakeQuery.empty) {
          return res.status(404).json({ success: false, error: "Intake not found" });
        }

        const intakeDoc = intakeQuery.docs[0];
        const intake = intakeDoc.data() as Intake;

        if (intake.expiresAt && (intake.expiresAt as any).toDate() < new Date()) {
          return res.status(410).json({ success: false, error: "Intake link has expired" });
        }

        // Save progress including customizations
        const updateData: any = {
          clientData: formData,
          status: "in-progress",
          updatedAt: new Date(),
        };

        if (customFields !== undefined) {
          updateData.custom_fields = customFields;
        }

        if (customClauses !== undefined) {
          updateData.custom_clauses = customClauses;
        }

        await db.collection("intakes").doc(intakeDoc.id).update(updateData);

        res.json({ success: true, message: "Progress saved successfully" });
      } catch (error) {
        console.error("Error saving intake progress:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
      return;
    })
    .post("/intake/:token/submit", async (req, res) => {
      try {
        const { token } = req.params;
        const { formData, clientInfo, customFields, customClauses } = req.body;

        console.log('📤 HTTP API: Submitting intake form for token:', token);
        
        if (!token || !formData) {
          return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const intakeQuery = await db.collection("intakes")
          .where("linkToken", "==", token)
          .limit(1)
          .get();

        if (intakeQuery.empty) {
          return res.status(404).json({ success: false, error: "Intake not found" });
        }

        const intakeDoc = intakeQuery.docs[0];
        const intake = intakeDoc.data() as Intake;

        if (intake.expiresAt && (intake.expiresAt as any).toDate() < new Date()) {
          return res.status(410).json({ success: false, error: "Intake link has expired" });
        }

        // Check if intake is in valid state for submission
        if (!["opened", "in-progress"].includes(intake.status)) {
          return res.status(400).json({ success: false, error: "Intake is not available for submission" });
        }

        // Get service to check if customization requires approval
        const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
        const service = serviceDoc.data() as Service;
        
        const hasCustomizations = (customFields && customFields.length > 0) || (customClauses && customClauses.length > 0);
        const requiresApproval = service.customization_enabled && 
                                service.customization_rules?.require_approval && 
                                hasCustomizations;

        const updates: Partial<Intake> = {
          clientData: formData,
          status: requiresApproval ? "pending-approval" : "submitted",
          submittedAt: new Date(),
          updatedAt: new Date(),
        };

        if (clientInfo) {
          updates.clientName = clientInfo.name;
          updates.clientEmail = clientInfo.email;
        }

        if (customFields !== undefined) {
          updates.custom_fields = customFields;
        }

        if (customClauses !== undefined) {
          updates.custom_clauses = customClauses;
        }

        if (hasCustomizations) {
          updates.has_customizations = true;
        }

        await db.collection("intakes").doc(intakeDoc.id).update(updates);

        const message = requiresApproval 
          ? "Intake form submitted successfully. Your customizations will be reviewed by our team."
          : "Intake form submitted successfully";

        console.log('✅ HTTP API: Intake form submitted successfully for:', intakeDoc.id);
        res.json({ success: true, message });
      } catch (error) {
        console.error("Error submitting intake form:", error);
        res.status(500).json({ success: false, error: "Internal server error" });
      }
      return;
    }),

  async onIntakeStatusChange(change: functions.Change<functions.firestore.QueryDocumentSnapshot>): Promise<void> {
    const before = change.before.data() as Intake;
    const after = change.after.data() as Intake;

    // Log status changes for monitoring
    console.log(`Intake ${after.id} status changed from ${before.status} to ${after.status}`);

    // Add any additional business logic for status changes here
    // For example, sending notifications, triggering document generation, etc.
  },
};