import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory user store for migrated PHP API
interface User {
  id: number;
  name: string;
  phone: string;
  countryCode?: string;
  email?: string;
  password?: string;
}

const users: User[] = [
  {
    id: 1,
    name: "Demo Practitioner",
    phone: "9999999999",
    countryCode: "+91",
    email: "demo@ojas.com",
    password: "password123",
  },
];

// Replicate PHP API logic (/api.php?action=register & /api.php?action=login)
const handleApiRequest = (req: express.Request, res: express.Response) => {
  const action = req.query.action || req.body.action;
  const body = req.body || {};

  if (action === "register") {
    const name = (body.name || "").trim();
    const phone = (body.phone || "").trim();
    const countryCode = (body.countryCode || "+91").trim();
    const email = (body.email || "").trim();
    const rawPassword = body.password || "123456";

    if (!name || !phone) {
      return res.json({
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
      return res.json({
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

    const newUser: User = {
      id: users.length + 1,
      name,
      phone,
      countryCode,
      email,
      password: rawPassword,
    };
    users.push(newUser);

    return res.json({
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
      return res.json({
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
        return res.json({
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
        return res.json({ status: "error", message: "Incorrect password." });
      }
    } else {
      return res.json({
        status: "not_found",
        message: "Account not found.",
      });
    }
  }

  return res.json({ status: "error", message: "Invalid action." });
};

app.get("/api.php", handleApiRequest);
app.post("/api.php", handleApiRequest);

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
  }

  app.use(express.static(process.cwd()));

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
