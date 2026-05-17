-- 1. Foydalanuvchilar va barcha bizneslar jadvali (Users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT CHECK (role IN ('superadmin', 'merchant', 'client')) DEFAULT 'client',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Mahsulotlar (Products)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL, -- Narxlar oson hisob-kitob uchun dollarda saqlanadi
    product_type TEXT CHECK (product_type IN ('lux_copy', 'original')) NOT NULL,
    image_url TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Buyurtmalar (Orders)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- Format: [{ product_id, quantity, price_at_purchase }]
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    client_address TEXT,
    region TEXT NOT NULL,
    receipt_url TEXT,
    order_type TEXT CHECK (order_type IN ('full_payment', 'deposit_50')) NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'delivered', 'cancelled')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Kirim / Chiqim Jurnali (Transactions)
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    description TEXT NOT NULL, -- Masalan: "Turkiyadan tovar keldi", "Atir sotildi"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) sozlamalari kelgusida qoshiladi
