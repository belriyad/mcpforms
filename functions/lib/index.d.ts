import * as functions from "firebase-functions";
export declare const uploadTemplateAndParse: functions.HttpsFunction & functions.Runnable<any>;
export declare const processUploadedTemplate: functions.HttpsFunction & functions.Runnable<any>;
export declare const createServiceRequest: functions.HttpsFunction & functions.Runnable<any>;
export declare const updateServiceRequest: functions.HttpsFunction & functions.Runnable<any>;
export declare const deleteServiceRequest: functions.HttpsFunction & functions.Runnable<any>;
export declare const generateIntakeLink: functions.HttpsFunction & functions.Runnable<any>;
export declare const submitIntakeForm: functions.HttpsFunction & functions.Runnable<any>;
export declare const approveIntakeForm: functions.HttpsFunction & functions.Runnable<any>;
export declare const generateDocumentsFromIntake: functions.HttpsFunction & functions.Runnable<any>;
export declare const getDocumentDownloadUrl: functions.HttpsFunction & functions.Runnable<any>;
export declare const generateDocumentsWithAI: functions.HttpsFunction & functions.Runnable<any>;
export declare const downloadDocument: functions.HttpsFunction;
export declare const intakeFormAPI: functions.HttpsFunction;
export declare const onTemplateUploaded: functions.CloudFunction<functions.storage.ObjectMetadata>;
export declare const onIntakeStatusChange: functions.CloudFunction<functions.Change<functions.firestore.QueryDocumentSnapshot>>;
//# sourceMappingURL=index.d.ts.map