-- Додаємо поле, якщо його ще немає
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_name TEXT UNIQUE;

-- Для існуючих записів заповнюємо tenant_name, якщо воно порожнє
UPDATE tenants SET tenant_name = 'tenant_' || id WHERE tenant_name IS NULL OR tenant_name = '';

-- Робимо поле NOT NULL
ALTER TABLE tenants ALTER COLUMN tenant_name SET NOT NULL; 