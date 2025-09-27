import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { templateParser } from "./services/templateParser";
import { serviceManager } from "./services/serviceManager";
import { intakeManager } from "./services/intakeManager";
import { documentGenerator } from "./services/documentGenerator";



// Template Upload and AI Parsing
export const uploadTemplateAndParse = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"]
  })
  .https.onCall(templateParser.uploadAndParse);

// Service Request Management
export const createServiceRequest = functions.https.onCall(serviceManager.createService);
export const updateServiceRequest = functions.https.onCall(serviceManager.updateService);
export const deleteServiceRequest = functions.https.onCall(serviceManager.deleteService);

// Intake Form Management
export const generateIntakeLink = functions.https.onCall(intakeManager.generateIntakeLink);
export const submitIntakeForm = functions.https.onCall(intakeManager.submitIntakeForm);
export const approveIntakeForm = functions.https.onCall(intakeManager.approveIntakeForm);

// Document Generation
export const generateDocumentsFromIntake = functions.https.onCall(documentGenerator.generateDocuments);

// HTTP endpoints for public intake forms
const app = express();
app.use(cors({ origin: true }));
app.use("/api", intakeManager.intakeFormAPI);
export const intakeFormAPI = functions.https.onRequest(app);

// Storage triggers
export const onTemplateUploaded = functions
  .runWith({
    secrets: ["OPENAI_API_KEY"]
  })
  .storage.object().onFinalize(templateParser.onTemplateUploaded);

// Firestore triggers
export const onIntakeStatusChange = functions.firestore
  .document("intakes/{intakeId}")
  .onUpdate(intakeManager.onIntakeStatusChange);