using ERP.Domain;
using ERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize(Policy = Permissions.DashboardView)]
public sealed class DashboardController(ErpDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var employees = await db.Employees.CountAsync(x => x.EmploymentStatus == "Active", cancellationToken);
        var attendanceToday = await db.AttendanceRecords.CountAsync(x => x.WorkDate == today, cancellationToken);
        var pendingLeave = await db.LeaveRequests.CountAsync(x => x.Status == "Pending", cancellationToken);
        var lowStock = await db.InventoryItems.CountAsync(x => x.QuantityOnHand <= x.ReorderLevel, cancellationToken);
        var openSales = await db.SalesOrders.CountAsync(x => x.Status != "Completed" && x.Status != "Cancelled", cancellationToken);
        var openPurchases = await db.PurchaseOrders.CountAsync(x => x.Status != "Received" && x.Status != "Cancelled", cancellationToken);
        var revenue = await db.SalesOrders.Where(x => x.Status != "Cancelled").SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0;
        var purchasing = await db.PurchaseOrders.Where(x => x.Status != "Cancelled").SumAsync(x => (decimal?)x.TotalAmount, cancellationToken) ?? 0;
        var activity = await db.AuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc).Take(8)
            .Select(x => new { x.Id, x.Action, x.EntityName, x.UserEmail, x.CreatedAtUtc })
            .ToListAsync(cancellationToken);

        return Ok(new
        {
            employees, attendanceToday, pendingLeave, lowStock, openSales, openPurchases,
            revenue, purchasing, activity
        });
    }
}

[ApiController]
[Route("api/reports")]
[Authorize(Policy = Permissions.ReportsView)]
public sealed class ReportsController(ErpDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken cancellationToken)
    {
        var payroll = await db.PayrollRecords
            .GroupBy(x => x.Status)
            .Select(x => new { label = x.Key, count = x.Count(), amount = x.Sum(y => y.BasePay + y.Allowances - y.Deductions) })
            .ToListAsync(cancellationToken);
        var leave = await db.LeaveRequests.GroupBy(x => x.Status)
            .Select(x => new { label = x.Key, count = x.Count() }).ToListAsync(cancellationToken);
        var inventory = await db.InventoryItems.GroupBy(x => x.Category ?? "Uncategorized")
            .Select(x => new { label = x.Key, count = x.Count(), value = x.Sum(y => y.QuantityOnHand * y.UnitCost) })
            .ToListAsync(cancellationToken);
        var sales = await db.SalesOrders.GroupBy(x => x.Status)
            .Select(x => new { label = x.Key, count = x.Count(), amount = x.Sum(y => y.TotalAmount) })
            .ToListAsync(cancellationToken);
        var purchasing = await db.PurchaseOrders.GroupBy(x => x.Status)
            .Select(x => new { label = x.Key, count = x.Count(), amount = x.Sum(y => y.TotalAmount) })
            .ToListAsync(cancellationToken);
        var finance = new
        {
            debit = await db.JournalEntries.SumAsync(x => (decimal?)x.Debit, cancellationToken) ?? 0,
            credit = await db.JournalEntries.SumAsync(x => (decimal?)x.Credit, cancellationToken) ?? 0
        };
        return Ok(new { payroll, leave, inventory, sales, purchasing, finance });
    }
}

[ApiController]
[Route("api/audit-logs")]
[Authorize(Policy = Permissions.AuditView)]
public sealed class AuditLogsController(ErpDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get([FromQuery] int take = 100, CancellationToken cancellationToken = default) =>
        Ok(await db.AuditLogs.AsNoTracking().OrderByDescending(x => x.CreatedAtUtc)
            .Take(Math.Clamp(take, 1, 500)).ToListAsync(cancellationToken));
}
