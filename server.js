

require('dotenv').config();
const express = require('express');
const path = require('path');
const { pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// GET /api/health - check DB connection (helps debug "cannot fetch models")
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, database: 'connected' });
  } catch (err) {
    console.error('Health check failed:', err);
    res.status(503).json({
      ok: false,
      database: 'disconnected',
      detail: err.message || String(err),
    });
  }
});

// GET /api/models - fetch all compressor models for dropdown
app.get('/api/models', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT model_id, model_name FROM compressor_models ORDER BY model_name'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching models:', err);
    res.status(500).json({
      error: 'Failed to fetch compressor models',
      detail: err.message || String(err),
    });
  }
});

// GET /api/customers - list customers for reference
app.get('/api/customers', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT customer_id, customer_name FROM customers ORDER BY customer_name'
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching customers:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/search - autocomplete for customer names
app.get('/api/customers/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }
  
  try {
    const { rows } = await pool.query(
      'SELECT customer_name FROM customers WHERE customer_name ILIKE $1 ORDER BY customer_name LIMIT 10',
      [`${q}%`]
    );
    res.json(rows.map(row => row.customer_name));
  } catch (err) {
    console.error('Error searching customers:', err);
    res.status(500).json({ error: 'Failed to search customers' });
  }
});

// GET /api/locations/search - autocomplete for location tags
app.get('/api/locations/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }
  
  try {
    const { rows } = await pool.query(
      'SELECT DISTINCT location_tag FROM compressor_assets WHERE location_tag ILIKE $1 ORDER BY location_tag LIMIT 10',
      [`${q}%`]
    );
    res.json(rows.map(row => row.location_tag));
  } catch (err) {
    console.error('Error searching locations:', err);
    res.status(500).json({ error: 'Failed to search locations' });
  }
});

// GET /api/serial-numbers/search - autocomplete for serial numbers
app.get('/api/serial-numbers/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) {
    return res.json([]);
  }
  
  try {
    const { rows } = await pool.query(
      'SELECT serial_number FROM compressor_assets WHERE serial_number ILIKE $1 ORDER BY serial_number LIMIT 10',
      [`${q}%`]
    );
    res.json(rows.map(row => row.serial_number));
  } catch (err) {
    console.error('Error searching serial numbers:', err);
    res.status(500).json({ error: 'Failed to search serial numbers' });
  }
});

// POST /api/assets - add new compressor asset
app.post('/api/assets', async (req, res) => {
  const { customerName, modelId, locationTag, serialNumber } = req.body;

  if (!customerName || !modelId || !locationTag || !serialNumber) {
    return res.status(400).json({
      error: 'Missing required fields: customerName, modelId, locationTag, serialNumber',
    });
  }

  const customerNameNorm = String(customerName).trim().replace(/\s+/g, ' ');
  const locationTagNorm = String(locationTag).trim().replace(/\s+/g, ' ');
  const serialNumberNorm = String(serialNumber).trim().replace(/\s+/g, ' ');
  const modelIdNum = Number(modelId);

  if (!customerNameNorm || !locationTagNorm || !serialNumberNorm || !Number.isFinite(modelIdNum)) {
    return res.status(400).json({ error: 'Invalid input values' });
  }

  let client;
  try {
    client = await pool.connect();
    // 1) Find or create customer (case-insensitive, trim-insensitive)
    // Requires: UNIQUE INDEX on lower(btrim(customer_name))
    const customerUpsert = await client.query(
      `INSERT INTO customers (customer_name)
       VALUES ($1)
       ON CONFLICT ((lower(btrim(customer_name))))
       DO UPDATE SET customer_name = customers.customer_name
       RETURNING customer_id`,
      [customerNameNorm]
    );

    const customerId = customerUpsert.rows[0]?.customer_id;

    if (!customerId) {
      return res.status(500).json({ error: 'Failed to resolve customer_id' });
    }

    // 2. Verify model_id exists
    const modelCheck = await client.query(
      'SELECT model_id FROM compressor_models WHERE model_id = $1',
      [modelIdNum]
    );

    if (modelCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid compressor model' });
    }

    // 3) Check if serial number already exists first
    const existingCheck = await client.query(
      `SELECT asset_id, customer_id, model_id
       FROM compressor_assets
       WHERE lower(btrim(serial_number)) = lower(btrim($1))
       LIMIT 1`,
      [serialNumberNorm]
    );

    if (existingCheck.rows.length > 0) {
      const existing = existingCheck.rows[0];
      return res.status(200).json({
        success: true,
        assetId: existing.asset_id,
        customerId: existing.customer_id,
        modelId: existing.model_id,
        message: 'Serial number already exists',
        duplicate: true,
      });
    }

    // 4) Insert new asset (only if doesn't exist)
    const assetInsert = await client.query(
      `INSERT INTO compressor_assets (customer_id, model_id, serial_number, location_tag)
       VALUES ($1, $2, $3, $4)
       RETURNING asset_id, customer_id, model_id`,
      [customerId, modelIdNum, serialNumberNorm, locationTagNorm]
    );

    const asset = assetInsert.rows[0];
    return res.status(201).json({
      success: true,
      assetId: asset.asset_id,
      customerId: asset.customer_id,
      modelId: asset.model_id,
      message: `Asset added successfully (asset_id: ${asset.asset_id})`,
      duplicate: false,
    });
  } catch (err) {
    console.error('Error adding asset:', err);
    res.status(500).json({ error: 'Failed to add asset' });
  } finally {
    client?.release();
  }
});

app.listen(PORT, () => {
  console.log(`Compressor Asset Management app running at http://localhost:${PORT}`);
});
