# ⌚ Prime Watches — Full-Stack E-Commerce

A complete e-commerce + business management system for a watch store. Built with **Next.js 14 App Router**, **Supabase**, and **Tailwind CSS**.

---

## 🗂 Project Structure

```
prime-watches/
├── app/
│   ├── shop/                    # 🛍️ Storefront (product listing)
│   ├── product/[id]/            # 🔍 Product detail page
│   ├── checkout/[id]/           # 🛒 Order form (no account needed)
│   ├── order-success/[id]/      # ✅ Order confirmation
│   ├── admin/
│   │   ├── login/               # 🔐 Admin login
│   │   ├── dashboard/           # 📊 Stats, charts, recent orders
│   │   ├── products/            # 📦 CRUD products + image upload
│   │   ├── orders/              # 📋 View & update order status
│   │   ├── expenses/            # 💸 Expense tracking
│   │   └── settings/            # ⚙️ Delivery prices, packaging cost
│   └── api/
│       ├── auth/{login,logout,me}/
│       ├── products/[id]/
│       ├── orders/[id]/
│       ├── expenses/[id]/
│       ├── delivery/
│       ├── settings/
│       ├── dashboard/
│       └── upload/
├── lib/
│   ├── supabase.ts              # Supabase clients (anon + service role)
│   ├── auth.ts                  # JWT helpers, bcrypt
│   ├── calculations.ts          # 💰 Profit, revenue, real profit logic
│   ├── types.ts                 # TypeScript interfaces
│   └── wilayas.ts               # All 69 Algerian wilayas
├── supabase/
│   └── schema.sql               # Complete DB schema + seed data
└── middleware.ts                # Admin route protection
```

---

## 🚀 Setup Guide

### 1. Clone & Install

```bash
git clone <your-repo>
cd prime-watches
npm install
```

### 2. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **API keys** (anon key + service role key)
3. Go to **Storage** → Create bucket named `product-images` → Set to **Public**

### 3. Run the Database Schema

In **Supabase SQL Editor**, paste and run the contents of `supabase/schema.sql`.

This creates all tables, RLS policies, seeds the 69 wilayas, and creates 2 admin accounts.

### 4. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
JWT_SECRET=your-random-secret-string-min-32-chars
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run in Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---



## 💰 Business Logic

### Profit per Order
```
profit = sellingPrice - (purchasePrice + packagingCost + deliveryCost)
```

### Order Total (shown to customer)
```
total = sellingPrice × quantity + deliveryCost
```

### Real Business Profit (bottom line)
```
realProfit = Σ(order profits) - Σ(all expenses)
```

---

## 🛒 User Flow

1. Browse watches at `/shop`
2. Click product → detail page at `/product/[id]`
3. Click "Commander" → checkout at `/checkout/[id]`
4. Fill in name, phone, address, wilaya, delivery type
5. System auto-calculates delivery price based on wilaya
6. Submit → order confirmation at `/order-success/[id]`

**No account registration required. Cash on delivery only.**

---

## 🛠 Admin Features

| Feature | Route |
|---------|-------|
| Dashboard + KPIs | `/admin/dashboard` |
| Add/Edit/Delete products | `/admin/products` |
| View orders + change status | `/admin/orders` |
| Track expenses by type | `/admin/expenses` |
| Edit delivery prices per wilaya | `/admin/settings` |
| Set packaging cost, WhatsApp | `/admin/settings` |

### Order Status Flow
```
pending → confirmed → shipped → delivered
                               ↓
                           cancelled (any stage)
```

---

## 🗄 Database Schema

| Table | Description |
|-------|-------------|
| `admins` | Admin accounts (bcrypt passwords) |
| `products` | Watch catalog (purchase price, selling price, stock) |
| `orders` | Customer orders with financial snapshot |
| `expenses` | Operational expenses (packaging, fuel, other) |
| `delivery_prices` | Delivery cost per wilaya (home + office) |
| `settings` | Global key-value config |

---

## 🏗 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard or:
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add JWT_SECRET
```

---

## 📦 Tech Stack

- **Next.js 14** (App Router, API Routes, Middleware)
- **Supabase** (PostgreSQL, Row Level Security, Storage)
- **Tailwind CSS** (utility-first styling)
- **bcryptjs** (password hashing)
- **jsonwebtoken** (admin session JWTs)
- **react-hot-toast** (notifications)
- **lucide-react** (icons)
- **date-fns** (date formatting)
