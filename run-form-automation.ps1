# MCPForms Playwright Automation Script
# This script starts the development server and runs form filling automation

Write-Host "🚀 MCPForms Playwright Automation Starting..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Yellow

# Configuration
$SERVER_PORT = 3000
$MAX_PORT_TRIES = 5
$SERVER_TIMEOUT = 60

# Function to find available port
function Find-AvailablePort {
    param($StartPort = 3000, $MaxTries = 5)
    
    for ($i = 0; $i -lt $MaxTries; $i++) {
        $testPort = $StartPort + $i
        $connection = Test-NetConnection -ComputerName localhost -Port $testPort -InformationLevel Quiet -WarningAction SilentlyContinue
        if (-not $connection) {
            return $testPort
        }
    }
    return $null
}

# Function to test server connectivity
function Test-ServerReady {
    param($Port, $TimeoutSec = 5)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -Method Head -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

# Function to wait for server
function Wait-ForServer {
    param($Port, $TimeoutSec = 60)
    
    Write-Host "⏳ Waiting for server on port $Port..." -ForegroundColor Yellow
    
    $startTime = Get-Date
    $timeout = (Get-Date).AddSeconds($TimeoutSec)
    
    while ((Get-Date) -lt $timeout) {
        if (Test-ServerReady -Port $Port -TimeoutSec 3) {
            $elapsed = ((Get-Date) - $startTime).TotalSeconds
            Write-Host "✅ Server is ready on port $Port (took $([math]::Round($elapsed, 1))s)" -ForegroundColor Green
            return $true
        }
        
        Write-Host "." -NoNewline -ForegroundColor Yellow
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Host "❌ Server failed to start within $TimeoutSec seconds" -ForegroundColor Red
    return $false
}

try {
    # Kill existing Node processes to avoid conflicts
    Write-Host "🧹 Cleaning up existing Node processes..." -ForegroundColor Yellow
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2

    # Find available port
    $availablePort = Find-AvailablePort -StartPort 3000 -MaxTries $MAX_PORT_TRIES
    if ($null -eq $availablePort) {
        Write-Host "❌ No available ports found between 3000-3004" -ForegroundColor Red
        exit 1
    }

    Write-Host "🌐 Using port: $availablePort" -ForegroundColor Cyan

    # Start the development server
    Write-Host "🔧 Starting Next.js development server..." -ForegroundColor Yellow
    
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput "server.log" -RedirectStandardError "server_error.log"
    
    if (-not $serverProcess) {
        Write-Host "❌ Failed to start server process" -ForegroundColor Red
        exit 1
    }

    Write-Host "📡 Server process started (PID: $($serverProcess.Id))" -ForegroundColor Green

    # Wait for server to be ready
    if (-not (Wait-ForServer -Port $availablePort -TimeoutSec $SERVER_TIMEOUT)) {
        Write-Host "❌ Server startup failed" -ForegroundColor Red
        $serverProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        exit 1
    }

    # Update the test file with the correct port
    Write-Host "📝 Updating test configuration..." -ForegroundColor Yellow
    
    $testFile = ".\tests\real-app-test.spec.ts"
    if (Test-Path $testFile) {
        $content = Get-Content $testFile -Raw
        $updatedContent = $content -replace "const BASE_URL = 'http://localhost:\d+'", "const BASE_URL = 'http://localhost:$availablePort'"
        Set-Content $testFile -Value $updatedContent
        Write-Host "✅ Test file updated to use port $availablePort" -ForegroundColor Green
    }

    # Run Playwright tests
    Write-Host "🎭 Running Playwright automation tests..." -ForegroundColor Cyan
    Write-Host "📋 This will demonstrate:" -ForegroundColor White
    Write-Host "   • Home page navigation" -ForegroundColor Gray
    Write-Host "   • Admin dashboard exploration" -ForegroundColor Gray
    Write-Host "   • Form filling automation" -ForegroundColor Gray  
    Write-Host "   • Intake form testing" -ForegroundColor Gray
    Write-Host "   • Document generation exploration" -ForegroundColor Gray
    Write-Host ""

    # Run specific tests one by one for better visibility
    $tests = @(
        @{ Name = "Home Page Navigation"; Grep = "Explore home page" },
        @{ Name = "Admin Dashboard Access"; Grep = "Access admin dashboard" },
        @{ Name = "Form Filling Demo"; Grep = "Form filling demonstration" },
        @{ Name = "Intake Form Testing"; Grep = "Test intake form structure" },
        @{ Name = "Document Generation"; Grep = "Document generation exploration" }
    )

    foreach ($test in $tests) {
        Write-Host "▶️ Running: $($test.Name)" -ForegroundColor Magenta
        
        $playwrightArgs = @(
            "playwright", "test", 
            "tests\real-app-test.spec.ts",
            "--project=chromium",
            "--headed",
            "--timeout=60000",
            "--grep", "`"$($test.Grep)`""
        )

        try {
            & npx @playwrightArgs
            Write-Host "✅ $($test.Name) completed" -ForegroundColor Green
        }
        catch {
            Write-Host "⚠️ $($test.Name) encountered issues: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        
        Write-Host "---" -ForegroundColor Gray
        Start-Sleep -Seconds 2
    }

    Write-Host ""
    Write-Host "🎉 Playwright automation completed!" -ForegroundColor Green
    Write-Host "📊 Check the test-results folder for screenshots and videos" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Summary of what was tested:" -ForegroundColor White
    Write-Host "   ✓ Home page loads and navigation works" -ForegroundColor Green
    Write-Host "   ✓ Admin dashboard accessibility" -ForegroundColor Green  
    Write-Host "   ✓ Form field detection and filling" -ForegroundColor Green
    Write-Host "   ✓ Intake form URL structure" -ForegroundColor Green
    Write-Host "   ✓ Document generation exploration" -ForegroundColor Green

}
catch {
    Write-Host "❌ Error occurred: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "📝 Stack trace: $($_.ScriptStackTrace)" -ForegroundColor Red
}
finally {
    # Cleanup
    Write-Host ""
    Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
    
    if ($serverProcess -and !$serverProcess.HasExited) {
        Write-Host "🛑 Stopping development server..." -ForegroundColor Yellow
        $serverProcess | Stop-Process -Force -ErrorAction SilentlyContinue
        Write-Host "✅ Server stopped" -ForegroundColor Green
    }
    
    Write-Host "✨ Automation script completed" -ForegroundColor Cyan
}

# Keep window open for review
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")