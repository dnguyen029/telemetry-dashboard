---
name: sheets
description: 'Google Sheets Integration: Log call data and upsert session-based CRM state changes.'
---

# Google Sheets Logging Skill

This skill wraps the Google Sheets API integrations defined in the project's utility layer.

## 🛠️ Key Capabilities

- **Append Call Log**: Appends a formatted row containing name, phone, email, and intent information to the spreadsheet.
- **Session Upsert**: Queries the spreadsheet for the matching `session_id` to update existing records, keeping CRM updates clean and eliminating duplicate rows.
- **DLQ Failure Log**: Automatically routes failed operations to the `FAILURES` tab.

## ⌨️ Usage Protocol

Import the client inside your Python workflows:

```python
from tools.sheets import SheetsClient

client = SheetsClient()
# Log/update a lead
success = client.upsert_log({
    "name": "Jane Doe",
    "phone": "+15555550199",
    "email": "jane@example.com",
    "session_id": "session-abc-123",
    "intent": "WISMO",
    "summary": "Checking order delivery date."
})
```

## 🛡️ Env Requirements

- `SPREADSHEET_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (Service Account JSON)
