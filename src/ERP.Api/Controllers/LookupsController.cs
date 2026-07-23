using ERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/lookups")]
[Authorize]
public sealed class LookupsController(ErpDbContext db) : ControllerBase
{
    [HttpGet("departments")]
    public async Task<ActionResult> Departments(CancellationToken cancellationToken) =>
        Ok(await db.Departments.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new { x.Id, label = x.Name }).ToListAsync(cancellationToken));

    [HttpGet("employees")]
    public async Task<ActionResult> Employees(CancellationToken cancellationToken) =>
        Ok(await db.Employees.AsNoTracking().Where(x => x.EmploymentStatus == "Active").OrderBy(x => x.FullName)
            .Select(x => new { x.Id, label = $"{x.EmployeeNumber} · {x.FullName}" }).ToListAsync(cancellationToken));

    [HttpGet("suppliers")]
    public async Task<ActionResult> Suppliers(CancellationToken cancellationToken) =>
        Ok(await db.Suppliers.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new { x.Id, label = x.Name }).ToListAsync(cancellationToken));

    [HttpGet("customers")]
    public async Task<ActionResult> Customers(CancellationToken cancellationToken) =>
        Ok(await db.Customers.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new { x.Id, label = x.Name }).ToListAsync(cancellationToken));
}
