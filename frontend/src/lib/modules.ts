import type { ModuleConfig } from "./types";

export const modules: ModuleConfig[] = [
  {
    key: "hr", title: "HR management", singular: "department",
    description: "Organize departments and reporting ownership.", endpoint: "/departments", permission: "hr.manage",
    fields: [
      { key: "name", label: "Department name", type: "text", required: true },
      { key: "description", label: "Description", type: "textarea" },
    ],
    columns: [{ key: "name", label: "Department" }, { key: "description", label: "Description" }, { key: "createdAtUtc", label: "Created", format: "date" }],
  },
  {
    key: "employees", title: "Employees", singular: "employee",
    description: "Maintain your employee directory and employment details.", endpoint: "/employees", permission: "employees.manage",
    fields: [
      { key: "employeeNumber", label: "Employee number", type: "text", required: true },
      { key: "fullName", label: "Full name", type: "text", required: true },
      { key: "workEmail", label: "Work email", type: "email", required: true },
      { key: "phone", label: "Phone", type: "text" },
      { key: "jobTitle", label: "Job title", type: "text", required: true },
      { key: "departmentId", label: "Department", type: "relation", relationEndpoint: "/lookups/departments", relationLabel: "label" },
      { key: "hireDate", label: "Hire date", type: "date", required: true },
      { key: "baseSalary", label: "Base salary", type: "number", step: "0.01", required: true },
      { key: "employmentStatus", label: "Status", type: "select", options: ["Active", "On leave", "Inactive"], required: true },
    ],
    columns: [
      { key: "employeeNumber", label: "ID" }, { key: "fullName", label: "Employee" },
      { key: "jobTitle", label: "Job title" }, { key: "department", nested: "name", label: "Department" },
      { key: "employmentStatus", label: "Status", format: "status" },
    ],
  },
  {
    key: "payroll", title: "Payroll", singular: "payroll record",
    description: "Prepare and track employee pay periods.", endpoint: "/payroll", permission: "payroll.manage",
    fields: [
      { key: "employeeId", label: "Employee", type: "relation", relationEndpoint: "/lookups/employees", relationLabel: "label", required: true },
      { key: "periodStart", label: "Period start", type: "date", required: true },
      { key: "periodEnd", label: "Period end", type: "date", required: true },
      { key: "basePay", label: "Base pay", type: "number", step: "0.01", required: true },
      { key: "allowances", label: "Allowances", type: "number", step: "0.01", required: true },
      { key: "deductions", label: "Deductions", type: "number", step: "0.01", required: true },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Approved", "Paid"], required: true },
    ],
    columns: [
      { key: "employee", nested: "fullName", label: "Employee" }, { key: "periodStart", label: "From", format: "date" },
      { key: "periodEnd", label: "To", format: "date" }, { key: "netPay", label: "Net pay", format: "currency" },
      { key: "status", label: "Status", format: "status" },
    ],
  },
  {
    key: "attendance", title: "Attendance", singular: "attendance record",
    description: "Record daily presence and working times.", endpoint: "/attendance", permission: "attendance.manage",
    fields: [
      { key: "employeeId", label: "Employee", type: "relation", relationEndpoint: "/lookups/employees", relationLabel: "label", required: true },
      { key: "workDate", label: "Work date", type: "date", required: true },
      { key: "checkIn", label: "Check in", type: "time" }, { key: "checkOut", label: "Check out", type: "time" },
      { key: "status", label: "Status", type: "select", options: ["Present", "Late", "Absent", "Remote"], required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "employee", nested: "fullName", label: "Employee" }, { key: "workDate", label: "Date", format: "date" },
      { key: "checkIn", label: "Check in" }, { key: "checkOut", label: "Check out" }, { key: "status", label: "Status", format: "status" },
    ],
  },
  {
    key: "leave", title: "Leave management", singular: "leave request",
    description: "Review employee leave requests and decisions.", endpoint: "/leave", permission: "leave.manage",
    fields: [
      { key: "employeeId", label: "Employee", type: "relation", relationEndpoint: "/lookups/employees", relationLabel: "label", required: true },
      { key: "leaveType", label: "Leave type", type: "select", options: ["Annual", "Sick", "Personal", "Unpaid"], required: true },
      { key: "startDate", label: "Start date", type: "date", required: true }, { key: "endDate", label: "End date", type: "date", required: true },
      { key: "reason", label: "Reason", type: "textarea", required: true },
      { key: "status", label: "Status", type: "select", options: ["Pending", "Approved", "Rejected"], required: true },
      { key: "decisionNote", label: "Decision note", type: "textarea" },
    ],
    columns: [
      { key: "employee", nested: "fullName", label: "Employee" }, { key: "leaveType", label: "Type" },
      { key: "startDate", label: "From", format: "date" }, { key: "endDate", label: "To", format: "date" },
      { key: "status", label: "Status", format: "status" },
    ],
  },
  {
    key: "inventory", title: "Inventory", singular: "inventory item",
    description: "Control stock, cost, locations, and reorder levels.", endpoint: "/inventory", permission: "inventory.manage",
    fields: [
      { key: "sku", label: "SKU", type: "text", required: true }, { key: "name", label: "Item name", type: "text", required: true },
      { key: "category", label: "Category", type: "text" }, { key: "quantityOnHand", label: "Quantity on hand", type: "number", required: true },
      { key: "reorderLevel", label: "Reorder level", type: "number", required: true },
      { key: "unitCost", label: "Unit cost", type: "number", step: "0.01", required: true },
      { key: "location", label: "Location", type: "text" },
    ],
    columns: [
      { key: "sku", label: "SKU" }, { key: "name", label: "Item" }, { key: "category", label: "Category" },
      { key: "quantityOnHand", label: "On hand" }, { key: "reorderLevel", label: "Reorder at" }, { key: "unitCost", label: "Unit cost", format: "currency" },
    ],
  },
  {
    key: "suppliers", title: "Suppliers", singular: "supplier",
    description: "Maintain the supplier directory used for purchasing.", endpoint: "/suppliers", permission: "purchasing.manage",
    fields: [
      { key: "name", label: "Supplier name", type: "text", required: true }, { key: "contactName", label: "Contact", type: "text" },
      { key: "email", label: "Email", type: "email" }, { key: "phone", label: "Phone", type: "text" },
      { key: "address", label: "Address", type: "textarea" },
    ],
    columns: [{ key: "name", label: "Supplier" }, { key: "contactName", label: "Contact" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }],
  },
  {
    key: "purchasing", title: "Purchasing", singular: "purchase order",
    description: "Create and monitor supplier purchase orders.", endpoint: "/purchase-orders", permission: "purchasing.manage",
    fields: [
      { key: "orderNumber", label: "Order number", type: "text", required: true },
      { key: "supplierId", label: "Supplier", type: "relation", relationEndpoint: "/lookups/suppliers", relationLabel: "label", required: true },
      { key: "orderDate", label: "Order date", type: "date", required: true }, { key: "expectedDate", label: "Expected date", type: "date" },
      { key: "totalAmount", label: "Total amount", type: "number", step: "0.01", required: true },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Submitted", "Approved", "Received", "Cancelled"], required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "orderNumber", label: "PO number" }, { key: "supplier", nested: "name", label: "Supplier" },
      { key: "orderDate", label: "Order date", format: "date" }, { key: "totalAmount", label: "Total", format: "currency" },
      { key: "status", label: "Status", format: "status" },
    ],
  },
  {
    key: "customers", title: "Customers", singular: "customer",
    description: "Maintain the customer directory used by sales.", endpoint: "/customers", permission: "sales.manage",
    fields: [
      { key: "name", label: "Customer name", type: "text", required: true }, { key: "email", label: "Email", type: "email" },
      { key: "phone", label: "Phone", type: "text" }, { key: "billingAddress", label: "Billing address", type: "textarea" },
    ],
    columns: [{ key: "name", label: "Customer" }, { key: "email", label: "Email" }, { key: "phone", label: "Phone" }, { key: "billingAddress", label: "Billing address" }],
  },
  {
    key: "sales", title: "Sales", singular: "sales order",
    description: "Create and track customer sales orders.", endpoint: "/sales-orders", permission: "sales.manage",
    fields: [
      { key: "orderNumber", label: "Order number", type: "text", required: true },
      { key: "customerId", label: "Customer", type: "relation", relationEndpoint: "/lookups/customers", relationLabel: "label", required: true },
      { key: "orderDate", label: "Order date", type: "date", required: true }, { key: "dueDate", label: "Due date", type: "date" },
      { key: "totalAmount", label: "Total amount", type: "number", step: "0.01", required: true },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Confirmed", "Invoiced", "Completed", "Cancelled"], required: true },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "orderNumber", label: "SO number" }, { key: "customer", nested: "name", label: "Customer" },
      { key: "orderDate", label: "Order date", format: "date" }, { key: "totalAmount", label: "Total", format: "currency" },
      { key: "status", label: "Status", format: "status" },
    ],
  },
  {
    key: "finance", title: "Finance", singular: "journal entry",
    description: "Maintain a controlled general journal.", endpoint: "/finance", permission: "finance.manage",
    fields: [
      { key: "reference", label: "Reference", type: "text", required: true }, { key: "entryDate", label: "Entry date", type: "date", required: true },
      { key: "account", label: "Account", type: "text", required: true }, { key: "description", label: "Description", type: "textarea", required: true },
      { key: "debit", label: "Debit", type: "number", step: "0.01", required: true },
      { key: "credit", label: "Credit", type: "number", step: "0.01", required: true },
      { key: "status", label: "Status", type: "select", options: ["Draft", "Posted", "Reversed"], required: true },
    ],
    columns: [
      { key: "reference", label: "Reference" }, { key: "entryDate", label: "Date", format: "date" },
      { key: "account", label: "Account" }, { key: "debit", label: "Debit", format: "currency" },
      { key: "credit", label: "Credit", format: "currency" }, { key: "status", label: "Status", format: "status" },
    ],
  },
];
