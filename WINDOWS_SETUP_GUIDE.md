# 🪟 Windows Development Setup Guide

## Important Windows PowerShell Considerations

When working with MCPForms on Windows, please note these important differences from Unix-style systems:

### Command Chaining
❌ **Unix/Linux/Mac (bash):**
```bash
npm install && npm run dev
firebase deploy --only functions && firebase deploy --only firestore:rules
```

✅ **Windows PowerShell:**
```powershell
npm install; npm run dev
firebase deploy --only functions; firebase deploy --only firestore:rules
```

### Key Differences
| Feature | Unix/Linux/Mac | Windows PowerShell |
|---------|-----------------|-------------------|
| Command chaining | `&&` (AND operator) | `;` (sequential execution) |
| Command success check | `&&` only runs if previous succeeds | `;` always runs next command |
| Error handling | Built-in with `&&` | Use `try/catch` or check `$?` |

### Recommended PowerShell Commands

#### 1. **Project Setup**
```powershell
# Clone and setup
git clone https://github.com/your-repo/mcpforms.git
cd mcpforms
npm install

# Start development
npm run dev
```

#### 2. **Firebase Setup**
```powershell
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project (if needed)
firebase init

# Start emulators for development
firebase emulators:start
```

#### 3. **Functions Development**
```powershell
# Navigate to functions directory
cd functions

# Install dependencies
npm install

# Build functions
npm run build

# Deploy functions
firebase deploy --only functions
```

#### 4. **Testing Commands**
```powershell
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode
npm run test:headed
```

#### 5. **Deployment Commands**
```powershell
# Build and deploy frontend
npm run build; firebase deploy --only hosting

# Deploy everything
npm run build; firebase deploy

# Deploy functions only
cd functions; npm run build; firebase deploy --only functions
```

### PowerShell Error Handling

Unlike bash `&&`, PowerShell `;` doesn't check for success. For better error handling:

#### Option 1: Use `try/catch`
```powershell
try {
    npm run build
    firebase deploy --only functions
    Write-Host "Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "Deployment failed: $_" -ForegroundColor Red
    exit 1
}
```

#### Option 2: Check `$LASTEXITCODE`
```powershell
npm run build
if ($LASTEXITCODE -eq 0) {
    firebase deploy --only functions
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Deployment successful!" -ForegroundColor Green
    } else {
        Write-Host "Firebase deployment failed!" -ForegroundColor Red
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
}
```

#### Option 3: Use PowerShell `&&` Equivalent
```powershell
# PowerShell 7+ supports && operator
npm run build && firebase deploy --only functions
```

### Environment Variables on Windows

#### Setting Environment Variables
```powershell
# Temporary (current session only)
$env:OPENAI_API_KEY="your-api-key"
$env:NODE_ENV="development"

# Permanent (user level)
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-api-key", "User")

# Permanent (system level - requires admin)
[Environment]::SetEnvironmentVariable("OPENAI_API_KEY", "your-api-key", "Machine")
```

#### Reading Environment Variables
```powershell
# Get specific variable
$env:OPENAI_API_KEY

# List all environment variables
Get-ChildItem Env:

# Check if variable exists
if ($env:OPENAI_API_KEY) {
    Write-Host "API Key is set"
} else {
    Write-Host "API Key is missing"
}
```

### File Path Considerations

#### Correct Path Format
```powershell
# Use forward slashes or escaped backslashes
cd "C:/Users/username/MCPForms/mcpforms"
cd "C:\\Users\\username\\MCPForms\\mcpforms"

# PowerShell also accepts backslashes in quotes
cd "C:\Users\username\MCPForms\mcpforms"
```

### Common Windows Issues and Solutions

#### 1. **Execution Policy Error**
```powershell
# Error: cannot be loaded because running scripts is disabled
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. **Node.js Path Issues**
```powershell
# Verify Node.js installation
node --version
npm --version

# Add to PATH if needed (restart PowerShell after)
$env:PATH += ";C:\Program Files\nodejs"
```

#### 3. **Firebase CLI Issues**
```powershell
# Reinstall Firebase CLI if commands fail
npm uninstall -g firebase-tools
npm install -g firebase-tools

# Clear npm cache if needed
npm cache clean --force
```

#### 4. **Port Conflicts**
```powershell
# Check if port is in use
netstat -ano | findstr :3000
netstat -ano | findstr :5001

# Kill process using port (replace PID)
taskkill /PID 1234 /F
```

### Windows-Specific NPM Scripts

Update your `package.json` with Windows-friendly scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build; next export",
    "deploy": "npm run build; firebase deploy --only hosting",
    "deploy:all": "npm run build; firebase deploy",
    "deploy:functions": "cd functions; npm run build; firebase deploy --only functions",
    "emulators": "firebase emulators:start",
    "test": "playwright test",
    "test:ui": "playwright test --ui",
    "test:headed": "playwright test --headed",
    "functions:logs": "firebase functions:log",
    "functions:deploy": "cd functions; npm run build; firebase deploy --only functions",
    "setup": "npm install; cd functions; npm install"
  }
}
```

### IDE Configuration

#### VS Code Settings for Windows
```json
{
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.profiles.windows": {
    "PowerShell": {
      "source": "PowerShell",
      "icon": "terminal-powershell"
    }
  },
  "files.eol": "\r\n",
  "git.autoCrlf": true
}
```

### Troubleshooting Commands

```powershell
# Check Node.js and npm versions
node --version; npm --version

# Check Firebase CLI version
firebase --version

# Check Git configuration
git config --list

# Verify project structure
Get-ChildItem -Recurse -Directory -Depth 2

# Check running processes
Get-Process | Where-Object {$_.ProcessName -like "*node*"}

# Clear all caches
npm cache clean --force
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .next
npm install
```

## Quick Start Checklist

✅ **Prerequisites:**
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed  
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Git installed
- [ ] PowerShell execution policy set appropriately

✅ **Project Setup:**
- [ ] Clone repository
- [ ] Run `npm install` in root directory
- [ ] Run `cd functions; npm install` for Firebase Functions
- [ ] Set up environment variables
- [ ] Configure Firebase project
- [ ] Start development with `npm run dev`

✅ **Deployment:**
- [ ] Build project: `npm run build`
- [ ] Deploy functions: `cd functions; npm run build; firebase deploy --only functions`
- [ ] Deploy hosting: `firebase deploy --only hosting`
- [ ] Verify deployment works

Remember: When in doubt, use semicolons (`;`) instead of `&&` for command chaining in Windows PowerShell! 🚀