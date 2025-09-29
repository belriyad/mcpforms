# PowerShell script to complete the intake form automation
Write-Host "🚀 COMPLETING INTAKE FORM AUTOMATION" -ForegroundColor Green

# Create comprehensive intake data
$intakeData = @{
    intakeId = "e5e3d925-a050-4e7f-b061-c77eeef66802"
    formData = @{
        clientName = "Sarah Elizabeth Thompson"
        clientEmail = "sarah.thompson@lawfirm.com"
        clientPhone = "+1 (555) 987-6543"
        clientAddress = "456 Corporate Blvd, Suite 1200, Chicago, IL 60601"
        caseTitle = "Thompson Holdings LLC v. Meridian Construction Corp"
        caseType = "Contract Dispute"
        caseDescription = "Complex commercial contract dispute involving a `$2.5M construction project. Meridian Construction Corp allegedly breached the construction agreement by using substandard materials, missing critical deadlines, and failing to meet specified quality standards. The breach resulted in significant structural defects, project delays, and additional remediation costs. Client seeks full damages for breach of contract, consequential damages for business interruption, and punitive damages for willful misconduct."
        estimatedDamages = "`$750,000"
        retainerAmount = "`$25,000"
        opposingParty = "Meridian Construction Corp and affiliated entities"
        previousLegalAction = "Initial demand letter sent via certified mail on August 15, 2024, requesting cure within 30 days. Follow-up correspondence sent September 10, 2024. No substantive response received. Pre-litigation mediation attempted through Chicago Commercial Arbitration Center - mediation failed on September 25, 2024, due to opposing party's refusal to engage in good faith negotiations."
        desiredOutcome = "Full compensatory damages, consequential damages, attorney fees, and injunctive relief"
        additionalNotes = "Client has comprehensive documentation including: original construction contract, all amendments and change orders, architectural plans and specifications, inspection reports documenting defects, correspondence with opposing party, photographs of structural issues, expert engineering reports, and financial records showing damages. Key witnesses include project manager, site supervisor, and independent structural engineer. Time-sensitive matter due to statute of limitations and ongoing property deterioration. Client available for immediate case preparation and depositions."
    }
    clientInfo = @{
        name = "Sarah Elizabeth Thompson"
        email = "sarah.thompson@lawfirm.com"
    }
}

Write-Host "📝 Intake Data Prepared:" -ForegroundColor Yellow
Write-Host "   👤 Client: $($intakeData.formData.clientName)" -ForegroundColor White
Write-Host "   ⚖️ Case: $($intakeData.formData.caseTitle)" -ForegroundColor White
Write-Host "   💰 Type: $($intakeData.formData.caseType) ($($intakeData.formData.estimatedDamages))" -ForegroundColor White
Write-Host "   📄 13 comprehensive form fields completed" -ForegroundColor White
Write-Host ""

# Display the comprehensive form data
Write-Host "📋 COMPLETE FORM DATA FOR MANUAL ENTRY:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🏢 CLIENT INFORMATION:" -ForegroundColor Yellow
Write-Host "Client Name: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.clientName)" -ForegroundColor White
Write-Host "Client Email: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.clientEmail)" -ForegroundColor White
Write-Host "Client Phone: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.clientPhone)" -ForegroundColor White
Write-Host "Client Address: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.clientAddress)" -ForegroundColor White
Write-Host ""

Write-Host "⚖️ CASE INFORMATION:" -ForegroundColor Yellow
Write-Host "Case Title: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.caseTitle)" -ForegroundColor White
Write-Host "Case Type: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.caseType)" -ForegroundColor White
Write-Host "Case Description: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.caseDescription)" -ForegroundColor White
Write-Host ""

Write-Host "💰 FINANCIAL INFORMATION:" -ForegroundColor Yellow
Write-Host "Estimated Damages: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.estimatedDamages)" -ForegroundColor White
Write-Host "Retainer Amount: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.retainerAmount)" -ForegroundColor White
Write-Host ""

Write-Host "📋 LEGAL DETAILS:" -ForegroundColor Yellow
Write-Host "Opposing Party: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.opposingParty)" -ForegroundColor White
Write-Host "Previous Legal Action: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.previousLegalAction)" -ForegroundColor White
Write-Host "Desired Outcome: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.desiredOutcome)" -ForegroundColor White
Write-Host "Additional Notes: " -NoNewline -ForegroundColor Gray
Write-Host "$($intakeData.formData.additionalNotes)" -ForegroundColor White
Write-Host ""

# Instructions for completion
Write-Host "🎯 COMPLETION INSTRUCTIONS:" -ForegroundColor Green
Write-Host "============================" -ForegroundColor Green
Write-Host ""
Write-Host "1. ✅ The intake form is available at:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802" -ForegroundColor White
Write-Host ""
Write-Host "2. 📝 Copy and paste the data above into the form fields" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. 📤 Submit the form using the Submit button" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. 🔄 Navigate to admin panel:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000/admin" -ForegroundColor White
Write-Host ""
Write-Host "5. 📄 Look for 'Sarah Elizabeth Thompson' and click Generate Documents" -ForegroundColor Yellow
Write-Host ""

# Try to open the URLs automatically
Write-Host "🌐 Attempting to open intake form in browser..." -ForegroundColor Cyan
try {
    Start-Process "http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802"
    Write-Host "✅ Intake form should now be open in your browser" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Could not auto-open browser. Please manually navigate to the URL above" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 INTAKE FORM AUTOMATION SETUP COMPLETE!" -ForegroundColor Green
Write-Host "✅ All 13 form fields data is prepared and ready" -ForegroundColor Green
Write-Host "✅ Comprehensive legal case data provided" -ForegroundColor Green
Write-Host "✅ Browser should be opening to the intake form" -ForegroundColor Green
Write-Host "✅ Ready for manual completion and document generation" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   Client: Sarah Elizabeth Thompson" -ForegroundColor White  
Write-Host "   Case: Thompson Holdings LLC v. Meridian Construction Corp" -ForegroundColor White
Write-Host "   Type: Contract Dispute" -ForegroundColor White
Write-Host "   Damages: `$750,000" -ForegroundColor White
Write-Host "   Status: Ready for form submission and document generation" -ForegroundColor White