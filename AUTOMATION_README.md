# 🤖 MCPForms Complete Workflow Automation

This automation suite provides comprehensive testing of the MCPForms application, including template upload, service creation, intake form filling, submission, and document generation.

## 🚀 Quick Start

### Windows PowerShell (Recommended)
```powershell
# Run complete automation with visual browser
npm run automation:headed

# Run complete automation in background
npm run automation:powershell

# Run with debug output and visual browser
npm run automation:debug
```

### Node.js Cross-Platform
```bash
# Run complete automation
npm run automation:full

# Run just the workflow tests
npm run test:workflow

# Run workflow tests with browser visible
npm run test:workflow:headed
```

## 📋 What the Automation Does

### 1. **Template Upload Phase**
- ✅ Uploads 3 sample document templates:
  - Certificate of Trust Fillable Template.docx
  - Revocable Living Trust Template.docx
  - Warranty Deed Template.docx
- ✅ Waits for AI parsing to complete
- ✅ Verifies extracted form fields

### 2. **Service Creation Phase** 
- ✅ Creates a new service combining all uploaded templates
- ✅ Configures service settings and descriptions
- ✅ Activates the service for client use

### 3. **Intake Link Generation**
- ✅ Generates a unique intake form URL
- ✅ Captures the intake link for testing
- ✅ Verifies link accessibility

### 4. **Form Filling and Submission**
- ✅ Navigates to the generated intake form
- ✅ Automatically fills comprehensive form data:
  - **Personal Information**: Name, email, phone, DOB, SSN
  - **Address Information**: Street, city, state, zip, country
  - **Business Information**: Company, title, work contact info
  - **Financial Information**: Income, banking details
  - **Legal Information**: Attorney details, case numbers
  - **Emergency Contacts**: Contact info and relationships
  - **Medical Information**: Healthcare providers, conditions
  - **Additional Fields**: Comments, notes, special instructions
- ✅ Handles all form field types:
  - Text inputs
  - Email inputs
  - Phone inputs 
  - Date inputs
  - Dropdown/select fields
  - Textarea fields
  - Checkboxes
  - Radio buttons
- ✅ Submits the completed form
- ✅ Verifies successful submission

### 5. **Admin Approval and Document Generation**
- ✅ Returns to admin dashboard
- ✅ Locates the submitted intake
- ✅ Approves the intake for processing
- ✅ Triggers document generation
- ✅ Monitors generation progress

### 6. **Document Verification**
- ✅ Verifies generated documents are available
- ✅ Attempts to download generated files
- ✅ Reports document generation success
- ✅ Captures screenshots for verification

## 🛠️ Configuration

### Environment Variables
Create a `.env` file with your test credentials:
```env
ADMIN_EMAIL=your-admin@email.com
ADMIN_PASSWORD=your-password
TEST_ENV=development
```

### PowerShell Configuration Options
```powershell
# Run with custom port
.\run-complete-workflow.ps1 -Port 3001

# Run in production environment  
.\run-complete-workflow.ps1 -Environment production

# Run with debug logging
.\run-complete-workflow.ps1 -Debug

# Run with visible browser
.\run-complete-workflow.ps1 -Headed

# Skip dependency installation
.\run-complete-workflow.ps1 -SkipBuild
```

### Node.js Configuration
Edit `CONFIG` object in `run-complete-workflow.js`:
```javascript
const CONFIG = {
  serverPort: 3000,
  serverStartTimeout: 60000, // 1 minute
  testTimeout: 300000,       // 5 minutes
  maxRetries: 3,
  logLevel: 'info'           // 'debug' for verbose output
};
```

## 📊 Test Data

### Sample Client Information
The automation uses realistic test data:
- **Name**: John Michael Smith
- **Email**: john.smith@example.com
- **Phone**: 555-123-4567
- **Address**: 123 Main Street, Anytown, CA 90210
- **Company**: Acme Corporation
- **Title**: Chief Executive Officer

### Document Templates
Requires sample documents in `src/sample/`:
- Certificate_of_Trust_Fillable Template.docx
- Revocable Living Trust Template.docx
- Warranty Deed Template.docx

## 📁 Output and Reporting

### Test Results Directory
```
test-results/
├── workflow-report.json          # Detailed test results
├── generated-documents/          # Downloaded documents
├── screenshots/                  # Debug screenshots
└── playwright-report/           # Playwright HTML report
```

### Report Contents
The JSON report includes:
- Test execution timestamp
- Success/failure status
- Detailed test output
- Document generation results  
- Environment information
- Configuration used

## 🐛 Troubleshooting

### Common Issues

#### Server Won't Start
```powershell
# Check if port is in use
netstat -ano | findstr :3000

# Kill process using port (replace PID)
taskkill /PID 1234 /F

# Try different port
.\run-complete-workflow.ps1 -Port 3001
```

#### Tests Failing
```powershell
# Run with debug output
npm run automation:debug

# Check test results
Get-Content test-results\workflow-report.json | ConvertFrom-Json
```

#### Authentication Issues
1. Verify admin credentials in `.env` file
2. Check Firebase authentication configuration
3. Manually log in first, then run automation

#### Form Fields Not Found
1. Check if intake form loaded properly
2. Verify form field selectors in test files
3. Run with `--headed` to see form visually

### Debug Mode
Enable debug logging for detailed output:
```powershell
# PowerShell
.\run-complete-workflow.ps1 -Debug -Headed

# Node.js  
# Edit CONFIG.logLevel = 'debug' in run-complete-workflow.js
```

## 🔧 Customization

### Adding New Form Fields
Edit `CLIENT_TEST_DATA` in `tests/form-filling-automation.spec.ts`:
```javascript
const CLIENT_TEST_DATA = {
  // Add new categories or fields
  custom: {
    customField: 'Custom Value',
    specialData: 'Special Information'
  }
};
```

### Adding New Field Selectors
Add to `fieldMappings` array:
```javascript
{ 
  selectors: ['input[name*="customField"]', 'input[id*="custom"]'], 
  value: CLIENT_TEST_DATA.custom.customField 
}
```

### Customizing Document Verification
Edit `verifyDocumentGeneration()` function to add custom checks:
```javascript
async function verifyDocumentGeneration(page, intakeId) {
  // Add custom document verification logic
  const customCheck = await page.locator('your-custom-selector').isVisible();
  // ...
}
```

## 📈 Performance Tips

### Faster Execution
- Use `--project=chromium` instead of all browsers
- Set shorter timeouts for known-fast operations  
- Use `networkidle` wait conditions sparingly
- Enable auto-save testing to reduce form re-filling

### Better Reliability
- Add explicit waits for async operations
- Use retry logic for flaky operations
- Implement custom wait conditions for complex state
- Take screenshots at key points for debugging

## 🔄 Continuous Integration

### GitHub Actions Example
```yaml
name: MCPForms Automation
on: [push, pull_request]
jobs:
  automation:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run automation:full
        env:
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

### Local Scheduled Runs
```powershell
# Windows Task Scheduler
schtasks /create /tn "MCPForms Automation" /tr "powershell -File C:\path\to\run-complete-workflow.ps1" /sc daily /st 09:00
```

## 📞 Support

### Getting Help
1. Check the `test-results/workflow-report.json` for detailed error information
2. Run with debug mode to see verbose output
3. Check screenshots in `test-results/` directory
4. Review Playwright report at `test-results/playwright-report/index.html`

### Reporting Issues
When reporting issues, include:
- Operating system and version
- Node.js and npm versions
- Complete error output
- Contents of workflow report JSON
- Screenshots from test-results directory

---

🎉 **Happy Testing!** This automation suite ensures your MCPForms workflow is working end-to-end with comprehensive form filling and document generation verification.