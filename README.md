# Customer UI

Telecom CRM & self-service frontend monorepo (Angular).

Tek API: **`http://localhost:8080`** (`customer-crud-api` monolith — [telecom-microservices](https://github.com/Waira16/telecom-microservices) içinde).

## Framework & Stack

| Teknoloji | Not |
|-----------|-----|
| Angular | 22 (CLI) |
| Angular Material | UI bileşenleri |
| TypeScript | Strict |
| RxJS | HTTP / async |
| telecom-shared | Ortak taksit / para yardımcıları |

Üç uygulama aynı workspace içinde:

| Uygulama | Port | npm script |
|----------|------|------------|
| **Public Pricing** | 4200 | `npm run start:public` |
| **CRM (Agent/Admin)** | 4201 | `npm run start` / `start:crm` |
| **Self-Service (Müşteri)** | 4202 | `npm run start:self-service` |

```powershell
cd customer-ui
npm install
npm run start:public        # http://localhost:4200
npm run start:crm           # http://localhost:4201
npm run start:self-service  # http://localhost:4202
```

> `npm run start:all` için `concurrently` gerekir (`npm i -D concurrently`).

---

## 1) Public Pricing — `:4200`

Herkese açık vitrin.

**Ne yapılabilir?**
- Tarife / cihaz kataloğunu görüntüleme ve filtreleme
- AI paket önerisi sohbeti
- Yeni müşteri **online başvurusu** (`POST /api/customers/applications`)

Giriş gerekmez.

---

## 2) CRM UI — `:4201`

Bayi / admin paneli.

**Giriş:** staff kullanıcı (`admin` / `admin123` veya `agent` / `agent123`)  
→ `POST /api/auth/login`

**Ne yapılabilir?**

| Sayfa | Yetki | İşlev |
|-------|-------|--------|
| Dashboard | ADMIN | Müşteri / fatura / risk istatistikleri |
| Müşteriler | ADMIN | Liste, arama, ekle, düzenle, detay |
| Agent Portal | AGENT/ADMIN | Müşteri seç → profil, fatura öde, bakiye, kullanım |
| Faturalar | AGENT/ADMIN | Fatura listesi / ödeme |
| Tarifeler | Auth | Katalog yönetimi görünümü |
| Bayiler | AGENT/ADMIN | Bayi / komisyon ekranı |
| AI Chat | Auth | Destek asistanı widget |

---

## 3) Self-Service — `:4202`

Müşteri self-servis portalı.

**Giriş:** `customerId` + telefon  
→ `POST /api/auth/customer-portal-login`

**Ne yapılabilir?**

| Sayfa | İşlev |
|-------|--------|
| **Hesabım** | Profil, sadakat, kullanım özeti, aldıklarım, taksitli ürünler |
| **Paketler** | Ek paket & ürün mağazası, sepet, ödeme |
| **Faturalar** | Aylık + mağaza faturaları, ödeme |
| **Tarifeler** | Tarife görüntüleme / değiştirme |
| **AI Chat** | Destek sohbeti |

### Ödeme ekranı (Paketler → Sepet → Öde)

1. **Kredi Kartı** — peşin veya banka taksiti; tutar telekom faturasına yazılmaz.  
2. **Faturaya Yansıt** — peşin tutar veya taksit doğrudan faturaya eklenir (`billToInvoice: true`).

Kart demo: `4242 4242 4242 4242` · SKT `12/30` · CVV `123`

---

## API bağımlılıkları (özet)

Self-service tipik çağrılar:

```http
GET  /api/customers/portal/me
GET  /api/customers/portal/purchases
POST /api/customers/portal/shop/checkout
POST /api/customers/portal/devices/purchase
GET  /api/invoices/customer/{id}
```

CRM tipik çağrılar:

```http
GET  /api/customers
GET  /api/dashboard/stats
POST /api/invoices/{id}/pay
GET  /api/customers/{id}/shop/orders
```

Ortam dosyası: her projedeki `environments/environment.ts` → `apiBaseUrl: 'http://localhost:8080'`.

---

## Build

```powershell
npm run build:crm
npm run build:self-service
npm run build:public
```

## İlişkili projeler

- Backend (monolit + mikroservisler, tek repo): [telecom-microservices](https://github.com/Waira16/telecom-microservices) — monolit: `customer-crud-api/`
