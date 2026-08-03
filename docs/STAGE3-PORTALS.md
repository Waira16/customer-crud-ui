# Aşama 3 — Üç Ayrı UI Portal

```
                    API Gateway (8080)
                           |
     +---------------------+---------------------+
     |                     |                     |
 Public Pricing      CRM Portal          Self-Service
   port 4200           port 4201             port 4202
```

## Çalıştırma

Backend (gateway + microservices) 8080'de açık olmalı.

```bash
# Tek tek
npm run start:public        # http://localhost:4200
npm run start:crm             # http://localhost:4201
npm run start:self-service    # http://localhost:4202

# Hepsi (concurrently gerekir: npm i -D concurrently)
npm run start:all
```

## Portallar

| Portal | Proje | Kullanıcı | Özellikler |
|--------|-------|-----------|------------|
| **Public Pricing** | `public-pricing` | Aday müşteri | Tarife robotu, paket hesaplayıcı, online başvuru (`PENDING_VERIFICATION`) |
| **CRM** | `customer-crud-ui` | Admin / Agent | Müşteri yönetimi, faturalar, bayi, dashboard |
| **Self-Service** | `customer-self-service` | Son müşteri | Kullanım halkaları, ek 5 GB, Luhn ile fatura ödeme |

## Demo girişleri

- **CRM (4201):** `admin/admin123` veya `agent/agent123`
- **Self-Service (4202):** Müşteri no + kayıtlı telefon (ör. Basri #34 + telefonu)

## Yeni API uçları

- `POST /api/customers/applications` — kamuya açık online başvuru
- `POST /api/auth/customer-portal-login` — müşteri portal JWT
- `POST /api/v1/usage/customer/{id}/buy-extra-data` — ek internet paketi
