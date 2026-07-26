import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!.replace('/rest/v1/', '');
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action;
  const body = req.body || {};

  // ──────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────
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
    const { data: existing } = await supabase
      .from('users')
      .select('id, name, phone, email')
      .or(`phone.eq.${phone}${email ? `,email.eq.${email}` : ''}`)
      .maybeSingle();

    if (existing) {
      return res.status(200).json({
        status: 'exists',
        message: 'Account already exists.',
        user: { id: existing.id, name: existing.name, phone: existing.phone, email: existing.email },
      });
    }

    // Insert new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ name, phone, country_code: countryCode, email: email || null, password }])
      .select('id, name, phone, email')
      .single();

    if (error || !newUser) {
      console.error('Register error:', error);
      return res.status(200).json({ status: 'error', message: 'Could not save user. Try again.' });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Registration successful',
      user: { id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email },
    });
  }

  // ──────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────
  if (action === 'login') {
    const account = (body.loginAccount || '').trim().toLowerCase();
    const enteredPassword = (body.password || '').trim();

    if (!account) {
      return res.status(200).json({ status: 'error', message: 'Please enter phone or email.' });
    }

    // Find by phone or email
    const { data: found } = await supabase
      .from('users')
      .select('id, name, phone, email, password')
      .or(`phone.eq.${account},email.eq.${account}`)
      .maybeSingle();

    if (!found) {
      return res.status(200).json({ status: 'not_found', message: 'Account not found.' });
    }

    // Password check (allow blank password or match)
    const passwordOk =
      !found.password ||
      enteredPassword === '' ||
      enteredPassword === found.password;

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
}
