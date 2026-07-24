FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY src/ERP.Domain/ERP.Domain.csproj src/ERP.Domain/
COPY src/ERP.Application/ERP.Application.csproj src/ERP.Application/
COPY src/ERP.Infrastructure/ERP.Infrastructure.csproj src/ERP.Infrastructure/
COPY src/ERP.Api/ERP.Api.csproj src/ERP.Api/
RUN dotnet restore src/ERP.Api/ERP.Api.csproj

COPY src/ src/
RUN dotnet publish src/ERP.Api/ERP.Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ERP.Api.dll"]
