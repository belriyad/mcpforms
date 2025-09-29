import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import { Intake, Service, ApiResponse, GenerateIntakeLinkRequest, SubmitIntakeRequest } from "../types";

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
        const { formData } = req.body;

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

        // Save progress
        await db.collection("intakes").doc(intakeDoc.id).update({
          clientData: formData,
          status: "in-progress",
          updatedAt: new Date(),
        });

        res.json({ success: true, message: "Progress saved successfully" });
      } catch (error) {
        console.error("Error saving intake progress:", error);
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