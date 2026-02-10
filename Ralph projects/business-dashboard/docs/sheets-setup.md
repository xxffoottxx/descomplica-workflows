# Google Sheets Data Structure

This document describes the Google Sheets structure used as a demo backend. In production, these would be replaced by ERP/CRM/Task Management systems.

## Spreadsheet Setup

Create a single Google Spreadsheet with multiple sheets (tabs):

### 1. Vendas (Sales)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Date | Date | Transaction date | 2026-02-10 |
| OrderID | Text | Unique order identifier | ORD-001 |
| Amount | Number | Order total in EUR | 125.50 |
| Items | Number | Number of items | 3 |
| Customer | Text | Customer name | João Silva |
| Status | Text | Order status | Completed |

**Sample Data:**
```
Date,OrderID,Amount,Items,Customer,Status
2026-02-10,ORD-001,125.50,3,João Silva,Completed
2026-02-10,ORD-002,89.00,1,Maria Costa,Completed
2026-02-09,ORD-003,234.00,5,Pedro Santos,Completed
```

### 2. Tarefas (Tasks)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Task | Text | Task description | Follow up with client |
| Assignee | Text | Person responsible | Ana Silva |
| Status | Text | Open/Completed | Open |
| DueDate | Date | Due date | 2026-02-12 |
| Priority | Text | High/Medium/Low | High |

**Sample Data:**
```
Task,Assignee,Status,DueDate,Priority
Follow up with client,Ana Silva,Open,2026-02-12,High
Process invoices,João Santos,Completed,2026-02-10,Medium
Update inventory,Pedro Alves,Open,2026-02-11,Low
```

### 3. Stock (Inventory)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Product | Text | Product name | Produto A |
| SKU | Text | Stock keeping unit | SKU-001 |
| Quantity | Number | Current quantity | 15 |
| MinQuantity | Number | Minimum stock level | 10 |
| UnitPrice | Number | Price per unit | 45.00 |
| Supplier | Text | Supplier name | Fornecedor XYZ |

**Sample Data:**
```
Product,SKU,Quantity,MinQuantity,UnitPrice,Supplier
Produto A,SKU-001,15,10,45.00,Fornecedor XYZ
Produto B,SKU-002,3,15,22.50,Fornecedor ABC
Produto C,SKU-003,45,20,12.00,Fornecedor XYZ
```

### 4. Equipa (Team)

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Name | Text | Employee name | Ana Silva |
| Role | Text | Job role | Gerente |
| Date | Date | Work date | 2026-02-10 |
| CheckIn | Time | Clock in time | 09:00 |
| CheckOut | Time | Clock out time | 18:00 |
| Status | Text | Present/Absent | Present |

**Sample Data:**
```
Name,Role,Date,CheckIn,CheckOut,Status
Ana Silva,Gerente,2026-02-10,09:00,18:00,Present
João Santos,Vendedor,2026-02-10,09:15,17:30,Present
Maria Costa,Atendimento,2026-02-10,10:00,18:00,Present
```

### 5. Email Metrics

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| Date | Date | Metric date | 2026-02-10 |
| Unread | Number | Unread emails | 12 |
| Important | Number | Flagged as important | 3 |
| Sent | Number | Emails sent today | 8 |
| ResponseRate | Number | Response rate % | 85 |

**Sample Data:**
```
Date,Unread,Important,Sent,ResponseRate
2026-02-10,12,3,8,85
2026-02-09,8,2,12,90
2026-02-08,15,5,6,78
```

## Setup Instructions

1. Create a new Google Spreadsheet
2. Name it "Dashboard Data"
3. Create 5 sheets with the names above
4. Add headers (first row) exactly as shown
5. Add sample data for testing
6. Share the spreadsheet with your n8n service account email
7. Copy the Spreadsheet ID from the URL
8. Update `data-collector.json` with your Spreadsheet ID

## Connecting to n8n

1. In n8n, go to Credentials
2. Add Google Sheets OAuth2 credentials
3. Authorize access to your Google account
4. Update each "Google Sheets" node in the workflow with:
   - Your Spreadsheet ID
   - The correct sheet name
   - Range (A:F or A:E depending on columns)

## Migration to Production Systems

Replace Google Sheets nodes with:

- **Vendas**: Artsoft API, Primavera API, Sage connector, or custom ERP webhook
- **Tarefas**: Asana API, Monday.com API, Trello API, or custom task system
- **Stock**: ERP inventory module or WMS (Warehouse Management System)
- **Equipa**: HR system API, time tracking software (e.g., Clockify, Toggl)
- **Email**: Gmail API, Microsoft Graph API (Outlook), or IMAP connector

Look for nodes marked with "PLACEHOLDER" in `data-collector.json` for exact replacement points.
