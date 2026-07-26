// @ts-nocheck
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ── Safely init Supabase (won't crash module if env vars are missing) ──
let supabase: ReturnType<typeof createClient> | null = null;
let debugInfo: any = { url: !!process.env.VITE_SUPABASE_URL, key: !!process.env.VITE_SUPABASE_ANON_KEY, error: null };
try {
  let rawUrl = process.env.VITE_SUPABASE_URL || '';
  debugInfo.rawUrl = rawUrl; // DEBUG WHAT VERCEL HAS
  rawUrl = rawUrl.replace(/^["']|["']$/g, '').trim(); // Remove literal quotes
  const supabaseUrl = rawUrl.replace('/rest/v1/', '').replace(/\/$/, '');
  
  let supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
  supabaseKey = supabaseKey.replace(/^["']|["']$/g, '').trim(); // Remove literal quotes

  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
  }
} catch (e: any) {
  debugInfo.error = e.message || String(e);
  console.error('Supabase init error:', e);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Always return JSON so script.js .then(res => res.json()) never fails
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // If Supabase not configured → tell client to use localStorage fallback
  if (!supabase) {
    return res.status(200).json({ status: 'error', message: 'Server not configured. Using local storage.', debugInfo });
  }

  const action = req.query.action || req.body?.action;
  const body = req.body || {};

  try {
    // ─────────────── REGISTER ───────────────
    if (action === 'register') {
      const name = (body.name || '').trim();
      const phone = (body.phone || '').trim();
      const countryCode = (body.countryCode || '+91').trim();
      const email = (body.email || '').trim().toLowerCase();
      const password = (body.password || '123456').trim();

      if (!name || !phone) {
        return res.status(200).json({ status: 'error', message: 'Name and phone number are required.' });
      }

      // Check if already exists (by phone OR email)
      let query = supabase.from('users').select('id, name, phone, email').eq('phone', phone);
      if (email) {
        const { data: byEmail } = await supabase
          .from('users').select('id, name, phone, email').eq('email', email).maybeSingle();
        if (byEmail) {
          return res.status(200).json({
            status: 'exists',
            message: 'Account already exists.',
            user: { id: byEmail.id, name: byEmail.name, phone: byEmail.phone, email: byEmail.email },
          });
        }
      }

      const { data: byPhone } = await query.maybeSingle();
      if (byPhone) {
        return res.status(200).json({
          status: 'exists',
          message: 'Account already exists.',
          user: { id: byPhone.id, name: byPhone.name, phone: byPhone.phone, email: byPhone.email },
        });
      }

      // Insert new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{ name, phone, country_code: countryCode, email: email || null, password }])
        .select('id, name, phone, email')
        .single();

      if (error || !newUser) {
        console.error('Register DB error:', error);
        return res.status(200).json({ status: 'error', message: 'Could not save user. Try again.' });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Registration successful',
        user: { id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email },
      });
    }

    // ─────────────── LOGIN ───────────────
    if (action === 'login') {
      const account = (body.loginAccount || '').trim();
      const enteredPassword = (body.password || '').trim();

      if (!account) {
        return res.status(200).json({ status: 'error', message: 'Please enter phone or email.' });
      }

      const accountLower = account.toLowerCase();

      // Search by phone first, then by email
      let found: any = null;
      const { data: byPhone } = await supabase
        .from('users').select('id, name, phone, email, password').eq('phone', account).maybeSingle();
      if (byPhone) {
        found = byPhone;
      } else {
        const { data: byEmail } = await supabase
          .from('users').select('id, name, phone, email, password').eq('email', accountLower).maybeSingle();
        if (byEmail) found = byEmail;
      }

      if (!found) {
        return res.status(200).json({ status: 'not_found', message: 'Account not found.' });
      }

      const passwordOk = !found.password || enteredPassword === '' || enteredPassword === found.password;
      if (!passwordOk) {
        return res.status(200).json({ status: 'error', message: 'Incorrect password.' });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        user: { id: found.id, name: found.name, phone: found.phone, email: found.email },
      });
    }

    return res.status(200).json({ status: 'error', message: 'Invalid action.' });

  } catch (err: any) {
    console.error('Handler error:', err);
    // Return JSON error so script.js doesn't break trying to parse HTML error pages
    return res.status(200).json({ status: 'error', message: 'Server error. Please try again.' });
  }
}
