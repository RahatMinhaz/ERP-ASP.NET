using ERP.Domain;

namespace ERP.Tests;

public sealed class DomainTests
{
    [Fact]
    public void PayrollNetPay_CombinesPayAllowancesAndDeductions()
    {
        var payroll = new PayrollRecord
        {
            BasePay = 5_000m,
            Allowances = 400m,
            Deductions = 275m
        };

        Assert.Equal(5_125m, payroll.NetPay);
    }

    [Fact]
    public void PermissionCatalog_HasUniqueNonEmptyClaims()
    {
        Assert.DoesNotContain(Permissions.All, string.IsNullOrWhiteSpace);
        Assert.Equal(Permissions.All.Length, Permissions.All.Distinct().Count());
    }

    [Fact]
    public void RoleCatalog_ContainsSupportedEnterpriseRoles()
    {
        Assert.Equal([Roles.Administrator, Roles.Manager, Roles.Employee], Roles.All);
    }
}
