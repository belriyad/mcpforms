"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.intakeManager = void 0;
const admin = __importStar(require("firebase-admin"));
const functions = __importStar(require("firebase-functions"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const uuid_1 = require("uuid");
// Initialize Firebase Admin if not already initialized (needed for module loading order)
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true }));
exports.intakeManager = {
    async generateIntakeLink(data) {
        var _a;
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
            const service = serviceDoc.data();
            if (service.status !== "active") {
                return { success: false, error: "Service is not active" };
            }
            const intakeId = (0, uuid_1.v4)();
            const linkToken = (0, uuid_1.v4)();
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + expiresInDays);
            const intake = {
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
            const baseUrl = ((_a = config.app) === null || _a === void 0 ? void 0 : _a.base_url) || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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
        }
        catch (error) {
            console.error("Error generating intake link:", error);
            return { success: false, error: "Failed to generate intake link" };
        }
    },
    async submitIntakeForm(data) {
        try {
            const { intakeId, formData, clientInfo } = data;
            if (!intakeId || !formData) {
                return { success: false, error: "Missing required fields" };
            }
            const intakeDoc = await db.collection("intakes").doc(intakeId).get();
            if (!intakeDoc.exists) {
                return { success: false, error: "Intake not found" };
            }
            const intake = intakeDoc.data();
            // Check if intake is expired
            if (intake.expiresAt && intake.expiresAt.toDate() < new Date()) {
                return { success: false, error: "Intake link has expired" };
            }
            // Check if intake is in valid state for submission
            if (!["opened", "in-progress"].includes(intake.status)) {
                return { success: false, error: "Intake is not available for submission" };
            }
            const updates = {
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
        }
        catch (error) {
            console.error("Error submitting intake form:", error);
            return { success: false, error: "Failed to submit intake form" };
        }
    },
    async approveIntakeForm(data) {
        try {
            const { intakeId, approved, notes } = data;
            if (!intakeId) {
                return { success: false, error: "Intake ID is required" };
            }
            const intakeDoc = await db.collection("intakes").doc(intakeId).get();
            if (!intakeDoc.exists) {
                return { success: false, error: "Intake not found" };
            }
            const intake = intakeDoc.data();
            if (intake.status !== "submitted") {
                return { success: false, error: "Intake is not ready for approval" };
            }
            const updates = {
                status: approved ? "approved" : "rejected",
                approvedAt: new Date(),
                updatedAt: new Date(),
            };
            if (notes) {
                updates.approvalNotes = notes;
            }
            await db.collection("intakes").doc(intakeId).update(updates);
            return {
                success: true,
                message: `Intake ${approved ? "approved" : "rejected"} successfully`
            };
        }
        catch (error) {
            console.error("Error approving intake form:", error);
            return { success: false, error: "Failed to approve intake form" };
        }
    },
    // HTTP API for public intake forms
    intakeFormAPI: express_1.default.Router()
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
            const intake = intakeDoc.data();
            // Check if expired
            if (intake.expiresAt && intake.expiresAt.toDate() < new Date()) {
                return res.status(410).json({ success: false, error: "Intake link has expired" });
            }
            // Get service details
            const serviceDoc = await db.collection("services").doc(intake.serviceId).get();
            if (!serviceDoc.exists) {
                return res.status(404).json({ success: false, error: "Service not found" });
            }
            const service = serviceDoc.data();
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
        }
        catch (error) {
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
            const intake = intakeDoc.data();
            if (intake.expiresAt && intake.expiresAt.toDate() < new Date()) {
                return res.status(410).json({ success: false, error: "Intake link has expired" });
            }
            // Save progress
            await db.collection("intakes").doc(intakeDoc.id).update({
                clientData: formData,
                status: "in-progress",
                updatedAt: new Date(),
            });
            res.json({ success: true, message: "Progress saved successfully" });
        }
        catch (error) {
            console.error("Error saving intake progress:", error);
            res.status(500).json({ success: false, error: "Internal server error" });
        }
        return;
    }),
    async onIntakeStatusChange(change) {
        const before = change.before.data();
        const after = change.after.data();
        // Log status changes for monitoring
        console.log(`Intake ${after.id} status changed from ${before.status} to ${after.status}`);
        // Add any additional business logic for status changes here
        // For example, sending notifications, triggering document generation, etc.
    },
};
//# sourceMappingURL=intakeManager.js.map