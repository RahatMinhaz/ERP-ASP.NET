using ERP.Domain;
using Microsoft.EntityFrameworkCore;

namespace ERP.Infrastructure;

public sealed class ErpDbContext(DbContextOptions<ErpDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<PayrollRecord> PayrollRecords => Set<PayrollRecord>();
    public DbSet<InventoryItem> InventoryItems => Set<InventoryItem>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
    public DbSet<JournalEntry> JournalEntries => Set<JournalEntry>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Employee>().HasIndex(x => x.EmployeeNumber).IsUnique();
        modelBuilder.Entity<Employee>().HasIndex(x => x.WorkEmail).IsUnique();
        modelBuilder.Entity<InventoryItem>().HasIndex(x => x.Sku).IsUnique();
        modelBuilder.Entity<PurchaseOrder>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<SalesOrder>().HasIndex(x => x.OrderNumber).IsUnique();
        modelBuilder.Entity<PayrollRecord>().Ignore(x => x.NetPay);

        modelBuilder.Entity<Department>().Property(x => x.Name).HasMaxLength(150);
        modelBuilder.Entity<User>().Property(x => x.Email).HasMaxLength(256);
        modelBuilder.Entity<Employee>().Property(x => x.BaseSalary).HasPrecision(18, 2);
        modelBuilder.Entity<PayrollRecord>().Property(x => x.BasePay).HasPrecision(18, 2);
        modelBuilder.Entity<PayrollRecord>().Property(x => x.Allowances).HasPrecision(18, 2);
        modelBuilder.Entity<PayrollRecord>().Property(x => x.Deductions).HasPrecision(18, 2);
        modelBuilder.Entity<InventoryItem>().Property(x => x.UnitCost).HasPrecision(18, 2);
        modelBuilder.Entity<PurchaseOrder>().Property(x => x.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<SalesOrder>().Property(x => x.TotalAmount).HasPrecision(18, 2);
        modelBuilder.Entity<JournalEntry>().Property(x => x.Debit).HasPrecision(18, 2);
        modelBuilder.Entity<JournalEntry>().Property(x => x.Credit).HasPrecision(18, 2);

        modelBuilder.Entity<Employee>()
            .HasOne(x => x.Department)
            .WithMany()
            .HasForeignKey(x => x.DepartmentId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<Entity>().Where(x => x.State == EntityState.Modified))
            entry.Entity.UpdatedAtUtc = DateTime.UtcNow;

        return base.SaveChangesAsync(cancellationToken);
    }
}
