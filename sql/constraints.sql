-- Run this once in your TimescaleDB database.
-- It prevents duplicates caused by different casing or extra spaces.

-- 1) Customer names: unique ignoring case and surrounding spaces
CREATE UNIQUE INDEX IF NOT EXISTS customers_customer_name_unique_ci
  ON customers ((lower(btrim(customer_name))));

-- 2) Serial numbers: unique ignoring case and surrounding spaces
CREATE UNIQUE INDEX IF NOT EXISTS compressor_assets_serial_number_unique_ci
  ON compressor_assets ((lower(btrim(serial_number))));

