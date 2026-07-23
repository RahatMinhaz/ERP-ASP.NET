using ERP.Application;
using ERP.Domain;
using ERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Policy = Permissions.UsersManage)]
public sealed class UsersController(
    ErpDbContext db,
    IPasswordService passwords,
    IAuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> List(CancellationToken cancellationToken) =>
        Ok(await db.Users.AsNoTracking().OrderBy(x => x.FullName)
            .Select(x => new
            {
                x.Id, x.FullName, x.Email, x.Role, x.IsActive, x.CreatedAtUtc,
                Permissions = x.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries)
            }).ToListAsync(cancellationToken));

    [HttpGet("options")]
    public ActionResult Options() => Ok(new { roles = Roles.All, permissions = Permissions.All });

    [HttpPost]
    public async Task<ActionResult> Create(CreateUserRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (!Roles.All.Contains(request.Role) || request.Password.Length < 10 ||
            !System.Net.Mail.MailAddress.TryCreate(email, out _) ||
            request.Permissions.Except(Permissions.All).Any())
            return BadRequest(new { message = "Invalid role, permissions, email, or password." });
        if (await db.Users.AnyAsync(x => x.Email == email, cancellationToken))
            return Conflict(new { message = "An account with that email already exists." });

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PasswordHash = string.Empty,
            Role = request.Role,
            Permissions = string.Join(',', request.Permissions.Distinct())
        };
        user.PasswordHash = passwords.Hash(user, request.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        await audit.RecordAsync(User.TryGetUserId(), User.Identity?.Name, "Create", nameof(ERP.Domain.User),
            user.Id.ToString(), $"Created {user.Email} with role {user.Role}.",
            HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return CreatedAtAction(nameof(List), new { id = user.Id }, new { user.Id });
    }

    [HttpPut("{id:guid}/access")]
    public async Task<ActionResult> UpdateAccess(Guid id, UpdateAccessRequest request, CancellationToken cancellationToken)
    {
        if (!Roles.All.Contains(request.Role) || request.Permissions.Except(Permissions.All).Any())
            return BadRequest(new { message = "Invalid role or permission." });
        var user = await db.Users.FindAsync([id], cancellationToken);
        if (user is null) return NotFound();
        if (user.Id == User.GetUserId() && !request.IsActive)
            return BadRequest(new { message = "You cannot deactivate your own account." });

        user.Role = request.Role;
        user.Permissions = string.Join(',', request.Permissions.Distinct());
        user.IsActive = request.IsActive;
        await db.SaveChangesAsync(cancellationToken);
        await audit.RecordAsync(User.TryGetUserId(), User.Identity?.Name, "Update access", nameof(ERP.Domain.User),
            user.Id.ToString(), $"Role: {user.Role}; Active: {user.IsActive}.",
            HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return NoContent();
    }
}
