#!/bin/bash

# 🔍 Simple Firestore Query Script
# Query the intake document to see actual client data

echo "🔍 =================================================================="
echo "🔍 FIRESTORE DATA INSPECTION"
echo "🔍 =================================================================="
echo ""

INTAKE_ID="WhilgLHSiGPRWKAoFwQ3"

echo "📋 Querying intake: $INTAKE_ID"
echo ""

# Use Firebase CLI to get the document
firebase firestore:get "intakes/$INTAKE_ID" --project formgenai-4545 --format json

echo ""
echo "✅ Query complete!"
echo ""
echo "Look for the 'clientData' field in the output above."
echo "This will show you exactly what data was saved from the form."
