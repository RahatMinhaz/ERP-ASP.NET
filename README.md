# Northstar ERP

A clean-architecture ERP built with ASP.NET Core, Entity Framework Core, SQL Server, Next.js, TypeScript, and Tailwind CSS.

## Solution structure

- `src/ERP.Domain` — business entities, roles, and permission claims
- `src/ERP.Application` — application contracts and authentication DTOs
- `src/ERP.Infrastructure` — SQL Server persistence, password hashing, audit service, and migrations
- `src/ERP.Api` — JWT authentication, claims policies, REST controllers, and reporting
- `frontend` — standalone Next.js App Router frontend for opening in VS Code
- `tests/ERP.Tests` — domain and security-catalog tests

## First run

Prerequisites: .NET 10 SDK, Node.js, and SQL Server Express.

### Backend in Visual Studio

Open `ERP.slnx` in Visual Studio 2026. The solution contains only the ASP.NET projects and tests; the frontend is deliberately excluded.

If Visual Studio reports that `ERP.Api.exe` is in use, stop the running API/debug session before selecting **Build Solution**. A running copy of the API locks its build output on Windows.

### Frontend in VS Code

Open `E:\Projects\ASP .NET\ERP\frontend` as its own VS Code folder. Then run `npm install` and `npm run dev` from the integrated terminal.

1. Confirm the connection string in `src/ERP.Api/appsettings.json`.
2. Apply the schema:

   ```powershell
   dotnet ef database update --project src\ERP.Infrastructure --startup-project src\ERP.Api
   ```

3. Start the API:

   ```powershell
   dotnet run --project src\ERP.Api --urls http://localhost:5266
   ```

4. In a second terminal, start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

5. Open `http://localhost:3100`.

The database contains no seeded users or business records. The first-run screen creates the administrator account. Every later account is created from **User access** by a user who has the `users.manage` claim.

## Security notes

- JWTs expire after eight hours and are stored in browser session storage.
- API routes enforce permission claims independently of the frontend navigation.
- Passwords use PBKDF2-SHA256 with unique random salts.
- All create, update, delete, login, and access-management events are written to the audit log.
- Replace `Jwt:Key` with a deployment secret before production use.

## Verification

```powershell
dotnet build ERP.slnx
dotnet test ERP.slnx
cd frontend
npm run build
```
