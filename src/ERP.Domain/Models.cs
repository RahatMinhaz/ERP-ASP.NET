namespace ERP.Domain;

public abstract class Entity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public sealed class User : Entity
{
    public required string FullName { get; set; }
    public required string Email { get; set; }
    public required string PasswordHash { get; set; }
    public string Role { get; set; } = Roles.Employee;
    public string Permissions { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class Department : Entity
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public Guid? ManagerEmployeeId { get; set; }
}

public sealed class Employee : Entity
{
    public required string EmployeeNumber { get; set; }
    public required string FullName { get; set; }
    public required string WorkEmail { get; set; }
    public string? Phone { get; set; }
    public required string JobTitle { get; set; }
    public Guid? DepartmentId { get; set; }
    public Department? Department { get; set; }
    public DateOnly HireDate { get; set; }
    public decimal BaseSalary { get; set; }
    public string EmploymentStatus { get; set; } = "Active";
}

public sealed class AttendanceRecord : Entity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateOnly WorkDate { get; set; }
    public TimeOnly? CheckIn { get; set; }
    public TimeOnly? CheckOut { get; set; }
    public string Status { get; set; } = "Present";
    public string? Notes { get; set; }
}

public sealed class LeaveRequest : Entity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public required string LeaveType { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public required string Reason { get; set; }
    public string Status { get; set; } = "Pending";
    public string? DecisionNote { get; set; }
}

public sealed class PayrollRecord : Entity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateOnly PeriodStart { get; set; }
    public DateOnly PeriodEnd { get; set; }
    public decimal BasePay { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
    public string Status { get; set; } = "Draft";
    public decimal NetPay => BasePay + Allowances - Deductions;
}

public sealed class InventoryItem : Entity
{
    public required string Sku { get; set; }
    public required string Name { get; set; }
    public string? Category { get; set; }
    public int QuantityOnHand { get; set; }
    public int ReorderLevel { get; set; }
    public decimal UnitCost { get; set; }
    public string? Location { get; set; }
}

public sealed class Supplier : Entity
{
    public required string Name { get; set; }
    public string? ContactName { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public sealed class PurchaseOrder : Entity
{
    public required string OrderNumber { get; set; }
    public Guid SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public DateOnly OrderDate { get; set; }
    public DateOnly? ExpectedDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
}

public sealed class Customer : Entity
{
    public required string Name { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? BillingAddress { get; set; }
}

public sealed class SalesOrder : Entity
{
    public required string OrderNumber { get; set; }
    public Guid CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public DateOnly OrderDate { get; set; }
    public DateOnly? DueDate { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Draft";
    public string? Notes { get; set; }
}

public sealed class JournalEntry : Entity
{
    public required string Reference { get; set; }
    public DateOnly EntryDate { get; set; }
    public required string Account { get; set; }
    public required string Description { get; set; }
    public decimal Debit { get; set; }
    public decimal Credit { get; set; }
    public string Status { get; set; } = "Draft";
}

public sealed class AuditLog : Entity
{
    public Guid? UserId { get; set; }
    public string? UserEmail { get; set; }
    public required string Action { get; set; }
    public required string EntityName { get; set; }
    public string? EntityId { get; set; }
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
}

public static class Roles
{
    public const string Administrator = "Administrator";
    public const string Manager = "Manager";
    public const string Employee = "Employee";
    public static readonly string[] All = [Administrator, Manager, Employee];
}

public static class Permissions
{
    public const string DashboardView = "dashboard.view";
    public const string HrManage = "hr.manage";
    public const string EmployeesManage = "employees.manage";
    public const string PayrollManage = "payroll.manage";
    public const string AttendanceManage = "attendance.manage";
    public const string LeaveManage = "leave.manage";
    public const string InventoryManage = "inventory.manage";
    public const string SalesManage = "sales.manage";
    public const string PurchasingManage = "purchasing.manage";
    public const string FinanceManage = "finance.manage";
    public const string ReportsView = "reports.view";
    public const string AuditView = "audit.view";
    public const string UsersManage = "users.manage";

    public static readonly string[] All =
    [
        DashboardView, HrManage, EmployeesManage, PayrollManage, AttendanceManage,
        LeaveManage, InventoryManage, SalesManage, PurchasingManage, FinanceManage,
        ReportsView, AuditView, UsersManage
    ];
}
