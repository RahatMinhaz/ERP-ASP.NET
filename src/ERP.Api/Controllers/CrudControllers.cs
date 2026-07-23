using ERP.Application;
using ERP.Domain;
using ERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

public abstract class CrudController<TEntity>(
    ErpDbContext db,
    IAuditService audit) : ControllerBase where TEntity : Entity
{
    protected ErpDbContext Db { get; } = db;
    protected abstract DbSet<TEntity> Set { get; }
    protected virtual IQueryable<TEntity> Query => Set.AsNoTracking();

    [HttpGet]
    public virtual async Task<ActionResult<IReadOnlyList<TEntity>>> List(CancellationToken cancellationToken) =>
        Ok(await Query.OrderByDescending(x => x.CreatedAtUtc).ToListAsync(cancellationToken));

    [HttpGet("{id:guid}")]
    public virtual async Task<ActionResult<TEntity>> Get(Guid id, CancellationToken cancellationToken)
    {
        var item = await Query.SingleOrDefaultAsync(x => x.Id == id, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public virtual async Task<ActionResult<TEntity>> Create(TEntity input, CancellationToken cancellationToken)
    {
        input.Id = Guid.NewGuid();
        input.CreatedAtUtc = DateTime.UtcNow;
        Set.Add(input);
        try
        {
            await Db.SaveChangesAsync(cancellationToken);
            await RecordAudit("Create", input, cancellationToken);
            return CreatedAtAction(nameof(Get), new { id = input.Id }, input);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "The record conflicts with existing data or a required related record is missing." });
        }
    }

    [HttpPut("{id:guid}")]
    public virtual async Task<ActionResult<TEntity>> Update(Guid id, TEntity input, CancellationToken cancellationToken)
    {
        var existing = await Set.FindAsync([id], cancellationToken);
        if (existing is null) return NotFound();
        var created = existing.CreatedAtUtc;
        Db.Entry(existing).CurrentValues.SetValues(input);
        existing.Id = id;
        existing.CreatedAtUtc = created;

        try
        {
            await Db.SaveChangesAsync(cancellationToken);
            await RecordAudit("Update", existing, cancellationToken);
            return Ok(existing);
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "The record conflicts with existing data or a required related record is missing." });
        }
    }

    [HttpDelete("{id:guid}")]
    public virtual async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var existing = await Set.FindAsync([id], cancellationToken);
        if (existing is null) return NotFound();
        Set.Remove(existing);
        try
        {
            await Db.SaveChangesAsync(cancellationToken);
            await RecordAudit("Delete", existing, cancellationToken);
            return NoContent();
        }
        catch (DbUpdateException)
        {
            return Conflict(new { message = "This record is referenced by other data and cannot be deleted." });
        }
    }

    private Task RecordAudit(string action, TEntity entity, CancellationToken cancellationToken) =>
        audit.RecordAsync(User.TryGetUserId(), User.Identity?.Name, action, typeof(TEntity).Name,
            entity.Id.ToString(), null, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
}

[ApiController, Route("api/departments"), Authorize(Policy = Permissions.HrManage)]
public sealed class DepartmentsController(ErpDbContext db, IAuditService audit)
    : CrudController<Department>(db, audit)
{
    protected override DbSet<Department> Set => Db.Departments;
}

[ApiController, Route("api/employees"), Authorize(Policy = Permissions.EmployeesManage)]
public sealed class EmployeesController(ErpDbContext db, IAuditService audit)
    : CrudController<Employee>(db, audit)
{
    protected override DbSet<Employee> Set => Db.Employees;
    protected override IQueryable<Employee> Query => Db.Employees.AsNoTracking().Include(x => x.Department);
}

[ApiController, Route("api/attendance"), Authorize(Policy = Permissions.AttendanceManage)]
public sealed class AttendanceController(ErpDbContext db, IAuditService audit)
    : CrudController<AttendanceRecord>(db, audit)
{
    protected override DbSet<AttendanceRecord> Set => Db.AttendanceRecords;
    protected override IQueryable<AttendanceRecord> Query => Db.AttendanceRecords.AsNoTracking().Include(x => x.Employee);
}

[ApiController, Route("api/leave"), Authorize(Policy = Permissions.LeaveManage)]
public sealed class LeaveController(ErpDbContext db, IAuditService audit)
    : CrudController<LeaveRequest>(db, audit)
{
    protected override DbSet<LeaveRequest> Set => Db.LeaveRequests;
    protected override IQueryable<LeaveRequest> Query => Db.LeaveRequests.AsNoTracking().Include(x => x.Employee);
}

[ApiController, Route("api/payroll"), Authorize(Policy = Permissions.PayrollManage)]
public sealed class PayrollController(ErpDbContext db, IAuditService audit)
    : CrudController<PayrollRecord>(db, audit)
{
    protected override DbSet<PayrollRecord> Set => Db.PayrollRecords;
    protected override IQueryable<PayrollRecord> Query => Db.PayrollRecords.AsNoTracking().Include(x => x.Employee);
}

[ApiController, Route("api/inventory"), Authorize(Policy = Permissions.InventoryManage)]
public sealed class InventoryController(ErpDbContext db, IAuditService audit)
    : CrudController<InventoryItem>(db, audit)
{
    protected override DbSet<InventoryItem> Set => Db.InventoryItems;
}

[ApiController, Route("api/suppliers"), Authorize(Policy = Permissions.PurchasingManage)]
public sealed class SuppliersController(ErpDbContext db, IAuditService audit)
    : CrudController<Supplier>(db, audit)
{
    protected override DbSet<Supplier> Set => Db.Suppliers;
}

[ApiController, Route("api/purchase-orders"), Authorize(Policy = Permissions.PurchasingManage)]
public sealed class PurchaseOrdersController(ErpDbContext db, IAuditService audit)
    : CrudController<PurchaseOrder>(db, audit)
{
    protected override DbSet<PurchaseOrder> Set => Db.PurchaseOrders;
    protected override IQueryable<PurchaseOrder> Query => Db.PurchaseOrders.AsNoTracking().Include(x => x.Supplier);
}

[ApiController, Route("api/customers"), Authorize(Policy = Permissions.SalesManage)]
public sealed class CustomersController(ErpDbContext db, IAuditService audit)
    : CrudController<Customer>(db, audit)
{
    protected override DbSet<Customer> Set => Db.Customers;
}

[ApiController, Route("api/sales-orders"), Authorize(Policy = Permissions.SalesManage)]
public sealed class SalesOrdersController(ErpDbContext db, IAuditService audit)
    : CrudController<SalesOrder>(db, audit)
{
    protected override DbSet<SalesOrder> Set => Db.SalesOrders;
    protected override IQueryable<SalesOrder> Query => Db.SalesOrders.AsNoTracking().Include(x => x.Customer);
}

[ApiController, Route("api/finance"), Authorize(Policy = Permissions.FinanceManage)]
public sealed class FinanceController(ErpDbContext db, IAuditService audit)
    : CrudController<JournalEntry>(db, audit)
{
    protected override DbSet<JournalEntry> Set => Db.JournalEntries;
}
