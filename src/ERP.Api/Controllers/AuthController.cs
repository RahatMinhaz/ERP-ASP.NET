using ERP.Application;
using ERP.Domain;
using ERP.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Data;

namespace ERP.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(
    ErpDbContext db,
    IPasswordService passwords,
    ITokenService tokens,
    IAuditService audit) : ControllerBase
{
    [HttpGet("setup-status")]
    public async Task<ActionResult<SetupStatus>> SetupStatus(CancellationToken cancellationToken) =>
        new SetupStatus(!await db.Users.AnyAsync(cancellationToken));

    [HttpPost("setup")]
    public async Task<ActionResult<AuthResponse>> Setup(SetupRequest request, CancellationToken cancellationToken)
    {
        await using var transaction = await db.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        if (await db.Users.AnyAsync(cancellationToken))
            return Conflict(new { message = "Initial setup has already been completed." });
        if (!IsValidEmail(request.Email) || request.Password.Length < 10 || string.IsNullOrWhiteSpace(request.FullName))
            return BadRequest(new { message = "Provide a valid name, email, and password of at least 10 characters." });

        var user = new User
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = string.Empty,
            Role = Roles.Administrator,
            Permissions = string.Join(',', Permissions.All)
        };
        user.PasswordHash = passwords.Hash(user, request.Password);
        db.Users.Add(user);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        await audit.RecordAsync(user.Id, user.Email, "Initial setup", nameof(User), user.Id.ToString(),
            "Created the first administrator account.", HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(tokens.Create(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null || !user.IsActive || !passwords.Verify(user, user.PasswordHash, request.Password))
            return Unauthorized(new { message = "Invalid email or password." });

        await audit.RecordAsync(user.Id, user.Email, "Login", nameof(User), user.Id.ToString(),
            null, HttpContext.Connection.RemoteIpAddress?.ToString(), cancellationToken);
        return Ok(tokens.Create(user));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<CurrentUser>> Me(CancellationToken cancellationToken)
    {
        var id = User.GetUserId();
        var user = await db.Users.AsNoTracking().SingleOrDefaultAsync(x => x.Id == id && x.IsActive, cancellationToken);
        if (user is null) return Unauthorized();
        return new CurrentUser(user.Id, user.FullName, user.Email, user.Role,
            user.Permissions.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
    }

    private static bool IsValidEmail(string email) =>
        System.Net.Mail.MailAddress.TryCreate(email, out _);
}

internal static class ClaimsPrincipalExtensions
{
    public static Guid? TryGetUserId(this System.Security.Claims.ClaimsPrincipal principal) =>
        Guid.TryParse(principal.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    public static Guid GetUserId(this System.Security.Claims.ClaimsPrincipal principal) =>
        principal.TryGetUserId() ?? throw new UnauthorizedAccessException();
}
