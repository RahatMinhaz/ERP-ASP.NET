using ERP.Domain;

namespace ERP.Application;

public interface IPasswordService
{
    string Hash(User user, string password);
    bool Verify(User user, string passwordHash, string password);
}

public interface ITokenService
{
    AuthResponse Create(User user);
}

public interface IAuditService
{
    Task RecordAsync(Guid? userId, string? userEmail, string action, string entityName,
        string? entityId, string? details, string? ipAddress, CancellationToken cancellationToken = default);
}

public sealed record AuthResponse(string Token, DateTime ExpiresAtUtc, CurrentUser User);
public sealed record CurrentUser(Guid Id, string FullName, string Email, string Role, string[] Permissions);
public sealed record SetupStatus(bool RequiresSetup);
public sealed record LoginRequest(string Email, string Password);
public sealed record SetupRequest(string FullName, string Email, string Password);
public sealed record CreateUserRequest(string FullName, string Email, string Password, string Role, string[] Permissions);
public sealed record UpdateAccessRequest(string Role, string[] Permissions, bool IsActive);
