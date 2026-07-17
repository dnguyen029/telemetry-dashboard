---
name: zendesk
description: 'Zendesk Ticket Integration: Search tickets by purchase order and perform dual-PUT ticket updates.'
---

# Zendesk CRM Integration Skill

This skill wraps the Zendesk API integrations defined in the project's utility layer.

## 🛠️ Key Capabilities

- **Ticket Retrieval by Purchase Order**: Locates Zendesk tickets that reference a specific customer PO number using the search endpoint.
- **Dual-PUT Update Flow**: Appends a private AI receptionist summary note to the ticket first, then updates the status of the ticket to `open` or `pending`.

## ⌨️ Usage Protocol

Import the client inside your Python workflows:

```python
from tools.zendesk import ZendeskClient

client = ZendeskClient()
# Search tickets
results = client.search_tickets_by_po("PO-12345")

# Update a ticket
success = client.update_ticket_with_summary(
    ticket_id="998877", 
    summary="User requested delivery status updates.", 
    status="open"
)
```

## 🛡️ Env Requirements

- `ZENDESK_SUBDOMAIN`
- `ZENDESK_EMAIL`
- `ZENDESK_TOKEN` (or `ZENDESK_API_KEY`)
