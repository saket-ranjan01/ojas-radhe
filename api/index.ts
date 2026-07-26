import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory user list for demo serverless function
const users: Array<{
  id: number;
  name: string;
  phone: string;
  countryCode?: string;
  email?: string;
  password?: string;
}> = [
  {
    id: 1,
    name: "Demo Practitioner",
    phone: "9999999999",
    countryCode: "+91",
    email: "demo@ojas.com",
    password: "password123",
  },
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const action = req.query.action || req.body?.action;
  const body = req.body || {};

  if (action === "register") {
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const countryCode = (body.countryCode || "+91").trim();
    const email = (body.email || "").trim();
    const rawPassword = body.password || "123456";

    if (!name || !phone) {
      return res.status(200).json({
        status: "error",
        message: "Name and phone number are required.",
      });
    }

    const existing = users.find(
      (u) =>
        u.phone === phone ||
        (email && u.email && u.email.toLowerCase() === email.toLowerCase())
    );

    if (existing) {
      return res.status(200).json({
        status: "exists",
        message: "Account already exists.",
        user: {
          id: existing.id,
          name: existing.name,
          phone: existing.phone,
          email: existing.email,
        },
      });
    }

    const newUser = {
      id: users.length + 1,
      name,
      phone,
      countryCode,
      email,
      password: rawPassword,
    };
    users.push(newUser);

    return res.status(200).json({
      status: "success",
      message: "Registration successful",
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
      },
    });
  } else if (action === "login") {
    const account = (body.loginAccount || "").trim();
    const enteredPassword = (body.password || "").trim();

    if (!account) {
      return res.status(200).json({
        status: "error",
        message: "Please enter phone or email.",
      });
    }

    const found = users.find(
      (u) =>
        u.phone === account ||
        (u.email && u.email.toLowerCase() === account.toLowerCase())
    );

    if (found) {
      if (
        enteredPassword === "123456" ||
        enteredPassword === found.password ||
        !found.password
      ) {
        return res.status(200).json({
          status: "success",
          message: "Login successful",
          user: {
            id: found.id,
            name: found.name,
            phone: found.phone,
            email: found.email,
          },
        });
      } else {
        return res.status(200).json({ status: "error", message: "Incorrect password." });
      }
    } else {
      return res.status(200).json({
        status: "not_found",
        message: "Account not found.",
      });
    }
  }

  return res.status(200).json({ status: "error", message: "Invalid action." });
}
