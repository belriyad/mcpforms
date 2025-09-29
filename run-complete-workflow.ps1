# MCPForms Complete Workflow Automation - PowerShell Script
# This script automates the complete workflow including form filling and document generation

param(
    [string]$Environment = "development",
    [int]$Port = 3000,
    [switch]$Headed,
    [switch]$Debug,
    [switch]$SkipBuild
)

# Configuration
$CONFIG = @{
    ServerPort = $Port
    ServerStartTimeout = 60000  # 1 minute
    TestTimeout = 300000       # 5 minutes
    MaxRetries = 3
    LogLevel = if ($Debug) { "debug" } else { "info" }
    TestHeaded = $Headed.IsPresent
}

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green" 
    Yellow = "Yellow"
    Blue = "Blue"
    Cyan = "Cyan"
    Magenta = "Magenta"
    White = "White"
}

function Write-Log {
    param(
        [string]$Level,
        [string]$Message,
        [string]$Color = "White"
    )
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $levelUpper = $Level.ToUpper()
    
    $colorMap = @{
        "ERROR" = $Colors.Red
        "WARN" = $Colors.Yellow
        "INFO" = $Colors.Blue
        "SUCCESS" = $Colors.Green
        "DEBUG" = $Colors.Cyan
    }
    
    $outputColor = $colorMap[$levelUpper]
    if (-not $outputColor) { $outputColor = $Colors.White }
    
    Write-Host "[$timestamp] [$levelUpper] $Message" -ForegroundColor $outputColor
}

function Test-ServerHealth {
    param([int]$Port = $CONFIG.ServerPort)
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 5 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Wait-ForServer {
    param(
        [int]$Port = $CONFIG.ServerPort,
        [int]$TimeoutMs = $CONFIG.ServerStartTimeout
    )
    
    Write-Log "INFO" "Waiting for server on port $Port..."
    
    $startTime = Get-Date
    $timeoutSeconds = $TimeoutMs / 1000
    
    while (((Get-Date) - $startTime).TotalSeconds -lt $timeoutSeconds) {
        if (Test-ServerHealth -Port $Port) {
            Write-Log "SUCCESS" "Server is ready on port $Port"
            return $true
        }
        
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-Log "ERROR" "Server failed to start within $TimeoutMs ms"
    return $false
}

function Start-DevelopmentServer {
    Write-Log "INFO" "Starting development server..."
    
    try {
        # Start the Next.js development server
        $serverJob = Start-Job -ScriptBlock {
            param($WorkingDir)
            Set-Location $WorkingDir
            npm run dev
        } -ArgumentList (Get-Location).Path
        
        Write-Log "SUCCESS" "Development server job started (Job ID: $($serverJob.Id))"
        
        # Wait for server to be ready
        $serverReady = Wait-ForServer
        
        if ($serverReady) {
            return $serverJob
        } else {
            Stop-Job $serverJob
            Remove-Job $serverJob
            throw "Server failed to become ready"
        }
    }
    catch {
        Write-Log "ERROR" "Failed to start server: $($_.Exception.Message)"
        throw
    }
}

function Invoke-PlaywrightTests {
    Write-Log "INFO" "Running Playwright tests..."
    
    $testCommand = "npx playwright test tests/complete-workflow-with-docs.spec.ts tests/form-filling-automation.spec.ts"
    
    if ($CONFIG.TestHeaded) {
        $testCommand += " --headed"
    }
    
    $testCommand += " --project=chromium"
    
    Write-Log "DEBUG" "Test command: $testCommand"
    
    try {
        $output = Invoke-Expression $testCommand 2>&1
        $exitCode = $LASTEXITCODE
        
        # Display test output
        $output | ForEach-Object {
            Write-Host $_
        }
        
        if ($exitCode -eq 0) {
            Write-Log "SUCCESS" "All tests passed successfully"
            return @{ Success = $true; Output = $output -join "`n" }
        } else {
            Write-Log "ERROR" "Tests failed with exit code $exitCode"
            return @{ Success = $false; Output = $output -join "`n"; ExitCode = $exitCode }
        }
    }
    catch {
        Write-Log "ERROR" "Failed to run tests: $($_.Exception.Message)"
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

function Test-DocumentGeneration {
    Write-Log "INFO" "Verifying document generation..."
    
    $documentsDir = Join-Path (Get-Location) "test-results" "generated-documents"
    
    if (Test-Path $documentsDir) {
        $files = Get-ChildItem $documentsDir
        Write-Log "SUCCESS" "Found $($files.Count) generated documents"
        
        foreach ($file in $files) {
            Write-Log "INFO" "- $($file.Name)"
        }
        
        return @{ DocumentsFound = $files.Count; Files = $files.Name }
    } else {
        Write-Log "WARN" "No generated documents directory found"
        return @{ DocumentsFound = 0; Files = @() }
    }
}

function New-TestReport {
    param($TestResults, $DocumentResults)
    
    $reportDir = Join-Path (Get-Location) "test-results"
    $reportPath = Join-Path $reportDir "workflow-report.json"
    
    # Ensure directory exists
    if (-not (Test-Path $reportDir)) {
        New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
    }
    
    $report = @{
        Timestamp = (Get-Date).ToString("o")
        Success = $TestResults.Success
        TestOutput = $TestResults.Output
        TestErrors = $TestResults.Error
        DocumentResults = $DocumentResults
        Environment = @{
            PowerShellVersion = $PSVersionTable.PSVersion.ToString()
            Platform = $env:OS
            ComputerName = $env:COMPUTERNAME
            WorkingDirectory = (Get-Location).Path
        }
        Configuration = $CONFIG
    }
    
    $report | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Log "INFO" "Test report saved to: $reportPath"
    
    return $report
}

function Stop-DevelopmentServer {
    param($ServerJob)
    
    if ($ServerJob) {
        Write-Log "INFO" "Stopping development server..."
        
        # Stop the job
        Stop-Job $ServerJob -ErrorAction SilentlyContinue
        Remove-Job $ServerJob -ErrorAction SilentlyContinue
        
        # Also kill any node processes that might be running on our port
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue
        foreach ($process in $processes) {
            try {
                $netstatOutput = netstat -ano | Select-String ":$($CONFIG.ServerPort)"
                if ($netstatOutput -match $process.Id) {
                    Write-Log "INFO" "Terminating Node.js process (PID: $($process.Id))"
                    Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
                }
            }
            catch {
                # Ignore errors when checking/stopping processes
            }
        }
        
        Write-Log "INFO" "Server cleanup completed"
    }
}

function Invoke-PreflightChecks {
    Write-Log "INFO" "Running preflight checks..."
    
    # Check Node.js
    try {
        $nodeVersion = node --version
        Write-Log "SUCCESS" "Node.js version: $nodeVersion"
    }
    catch {
        Write-Log "ERROR" "Node.js not found. Please install Node.js"
        return $false
    }
    
    # Check npm
    try {
        $npmVersion = npm --version
        Write-Log "SUCCESS" "npm version: $npmVersion"
    }
    catch {
        Write-Log "ERROR" "npm not found"
        return $false
    }
    
    # Check Playwright
    try {
        $playwrightVersion = npx playwright --version
        Write-Log "SUCCESS" "Playwright installed"
    }
    catch {
        Write-Log "WARN" "Playwright may not be installed. Installing..."
        try {
            npm install @playwright/test
            npx playwright install
            Write-Log "SUCCESS" "Playwright installed successfully"
        }
        catch {
            Write-Log "ERROR" "Failed to install Playwright"
            return $false
        }
    }
    
    # Check if package.json exists
    if (-not (Test-Path "package.json")) {
        Write-Log "ERROR" "package.json not found. Are you in the correct directory?"
        return $false
    }
    
    Write-Log "SUCCESS" "All preflight checks passed"
    return $true
}

# Main execution
function Invoke-CompleteWorkflow {
    Write-Host "🚀 MCPForms Complete Workflow Automation" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    
    Write-Log "INFO" "Starting automation with configuration:"
    $CONFIG | ConvertTo-Json | Write-Host
    
    $serverJob = $null
    
    try {
        # Step 1: Preflight checks
        if (-not (Invoke-PreflightChecks)) {
            throw "Preflight checks failed"
        }
        
        # Step 2: Install dependencies if needed
        if (-not $SkipBuild) {
            Write-Log "INFO" "Installing dependencies..."
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install dependencies"
            }
        }
        
        # Step 3: Start development server
        $serverJob = Start-DevelopmentServer
        
        # Step 4: Run Playwright tests
        $testResults = Invoke-PlaywrightTests
        
        # Step 5: Verify document generation
        $documentResults = Test-DocumentGeneration
        
        # Step 6: Generate test report
        $report = New-TestReport -TestResults $testResults -DocumentResults $documentResults
        
        # Step 7: Display final results
        Write-Host ""
        Write-Host "📊 Final Results:" -ForegroundColor Green
        Write-Host "=================" -ForegroundColor Green
        
        if ($testResults.Success) {
            Write-Host "✅ Tests: PASSED" -ForegroundColor Green
        } else {
            Write-Host "❌ Tests: FAILED" -ForegroundColor Red
        }
        
        Write-Host "📄 Documents Generated: $($documentResults.DocumentsFound)" -ForegroundColor Blue
        Write-Host "📋 Report: test-results/workflow-report.json" -ForegroundColor Blue
        
        if ($testResults.Success) {
            Write-Host ""
            Write-Host "🎉 Complete workflow automation successful!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host ""
            Write-Host "❌ Workflow automation failed" -ForegroundColor Red
            exit 1
        }
        
    }
    catch {
        Write-Log "ERROR" "Automation failed: $($_.Exception.Message)"
        exit 1
    }
    finally {
        Stop-DevelopmentServer -ServerJob $serverJob
    }
}

# Handle Ctrl+C gracefully
$null = Register-EngineEvent -SourceIdentifier PowerShell.Exiting -Action {
    Write-Host "Cleaning up..." -ForegroundColor Yellow
}

# Run the automation
Invoke-CompleteWorkflow