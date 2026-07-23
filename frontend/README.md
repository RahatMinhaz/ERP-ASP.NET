# ERP Frontend

This folder is the standalone Next.js, TypeScript, and Tailwind CSS frontend.

Open this folder directly in VS Code:

```powershell
code "E:\Projects\ASP .NET\ERP\frontend"
```

Install and run:

```powershell
npm install
npm run dev
```

The frontend expects the ASP.NET API at `http://localhost:5266/api`. This is configured in `.env.local`.

Production checks:

```powershell
npm run lint
npm run build
```
