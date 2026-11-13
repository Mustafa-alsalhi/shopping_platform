# Shopping Platform (.NET + Angular)

منصة تجارة إلكترونية متعددة البائعين والأنشطة (متاجر، مطاعم، منتجات، طلبات، توصيل، كوبونات، عروض) مبنية بـ:

- **Backend (`backend-dotnet/`)**: ASP.NET Core (.NET) مع معمارية Clean + Feature-Based Architecture (`MyStore.Domain`, `MyStore.Application`, `MyStore.Infrastructure`, `MyStore.Api`).
- **Frontend (`frontend-angular/`)**: Angular Standalone Components مع معمارية Feature-Based Architecture والتحميل الكسول (Lazy Loading) لجميع الوحدات (`admin`, `seller`, `driver`, `customer`, `auth`, `storefront`).

## تشغيل المشروع

### 1. Backend (.NET)
```bash
cd backend-dotnet/MyStore.Api
dotnet run
```

### 2. Frontend (Angular)
```bash
cd frontend-angular
npm install
npm start
```
