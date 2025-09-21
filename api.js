// api.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const PORT = parseInt(process.env.PORT || '3006', 10);
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY; // idéalement SERVICE_ROLE

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const app = express();
app.use(cors());
app.get('/api/health', (_, res) => res.json({ ok: true }));

// Top N
app.get('/api/top', async (req, res) => {
  const limit = parseInt(req.query.limit || '20', 10);
  const { data, error } = await supabase.rpc('lb_top', { p_limit: limit });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ top: data });
});

// Rang d’une adresse
app.get('/api/rank/:trader', async (req, res) => {
  const trader = String(req.params.trader || '').toLowerCase();
  const { data, error } = await supabase.rpc('lb_rank', { p_trader: trader });
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ me: data[0] });
});

// 10 avant / 10 après (paramétrable)
app.get('/api/around/:trader', async (req, res) => {
  const trader = String(req.params.trader || '').toLowerCase();
  const before = parseInt(req.query.before || '10', 10);
  const after  = parseInt(req.query.after  || '10', 10);
  const { data, error } = await supabase.rpc('lb_around', {
    p_trader: trader, p_before: before, p_after: after
  });
  if (error) return res.status(500).json({ error: error.message });
  res.json({ window: data });
});

app.listen(PORT, () => {
  console.log(`Leaderboard API listening on :${PORT}`);
});
