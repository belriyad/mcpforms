# PowerShell script to test form submission
$token = "e5e3d925-a050-4e7f-b061-c77eeef66802"
$baseUrl = "http://localhost:3000"

$formData = @{
    intakeId = $token
    clientInfo = @{
        firstName = "John"
        lastName = "Doe"
        email = "john.doe@example.com"
        phone = "555-123-4567"
    }
    formData = @{
        companyName = "Acme Corporation"
        businessType = "Technology"  
        fullName = "John Doe"
        email = "john.doe@example.com"
        phone = "555-123-4567"
        incorporationState = "CA"
        additionalNotes = "Test submission with simulated responses"
    }
} | ConvertTo-Json -Depth 3

Write-Host "🚀 Testing intake form endpoints..." -ForegroundColor Green
Write-Host ""

# Test submit endpoint
Write-Host "🧪 Testing submit endpoint..." -ForegroundColor Yellow
try {
    $submitResponse = Invoke-RestMethod -Uri "$baseUrl/api/intake/$token/submit" -Method POST -Body $formData -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Submit Response:" -ForegroundColor Green
    $submitResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Submit Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""

# Test save endpoint  
Write-Host "💾 Testing save endpoint..." -ForegroundColor Yellow
try {
    $saveResponse = Invoke-RestMethod -Uri "$baseUrl/api/intake/$token/save" -Method POST -Body $formData -ContentType "application/json" -TimeoutSec 30
    Write-Host "✅ Save Response:" -ForegroundColor Green
    $saveResponse | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Save Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🏁 Tests completed!" -ForegroundColor Green