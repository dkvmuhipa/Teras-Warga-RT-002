import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import "dotenv/config";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer for temporary storage
const storage_multer = multer.diskStorage({});
const upload = multer({ storage: storage_multer });

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    const serviceAccountPath = path.join(process.cwd(), "firebase-service-account.json");
    
    if (serviceAccountVar) {
      try {
        const serviceAccount = JSON.parse(serviceAccountVar);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: "teras-warga"
        });
        console.log("✅ Firebase Admin initialized with Service Account (Env Var)");
      } catch (parseError) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:", parseError);
        admin.initializeApp({ projectId: "teras-warga" });
      }
    } else if (fs.existsSync(serviceAccountPath)) {
      try {
        const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: "teras-warga"
        });
        console.log("✅ Firebase Admin initialized with Service Account (Local File)");
      } catch (fileError) {
        console.error("❌ Failed to read or parse firebase-service-account.json:", fileError);
        admin.initializeApp({ projectId: "teras-warga" });
      }
    } else {
      console.warn("⚠️ No Service Account found (Env Var or Local File). Using default credentials.");
      admin.initializeApp({
        projectId: "teras-warga"
      });
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

async function startServer() {
  const app = express();
  app.use(cors()); // Add CORS middleware
  app.use(express.json()); // Add JSON body parser
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Push Notification Endpoint
  app.post("/api/push/send", async (req, res) => {
    const { tokens, notification, data } = req.body;
    
    if (!tokens || !tokens.length) {
      return res.status(400).json({ error: "No tokens provided" });
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification,
        data: data || {},
      });
      
      console.log(`Successfully sent ${response.successCount} messages; ${response.failureCount} errors.`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Token ${tokens[idx]} failed with error:`, resp.error);
          }
        });
      }

      res.json({ success: true, response });
    } catch (error: any) {
      console.error("Error sending push notification:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Weather Proxy
  app.get("/api/weather", async (req, res) => {
    console.log("Weather request received");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m', {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Weather API responded with ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || error.message?.includes('aborted');
      if (isAbort) {
        console.warn("Weather proxy request timed out or was aborted. Serving fallback weather data.");
      } else {
        console.warn("Weather proxy error:", error.message || error);
      }
      // Return seamless fallback data that adheres to open-meteo response structure
      res.json({
        current: {
          temperature_2m: 30,
          relative_humidity_2m: 75,
          weather_code: 1,
          wind_speed_10m: 5
        }
      });
    }
  });

  // AQI Proxy
  app.get("/api/aqi", async (req, res) => {
    console.log("AQI request received");
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('https://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10', {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AQI API responded with ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      const isAbort = error.name === 'AbortError' || error.message?.includes('aborted');
      if (isAbort) {
        console.warn("AQI proxy request timed out or was aborted. Serving fallback AQI data.");
      } else {
        console.warn("AQI proxy error:", error.message || error);
      }
      // Return seamless fallback data that adheres to open-meteo air quality response structure
      res.json({
        current: {
          us_aqi: 25,
          pm2_5: 5,
          pm10: 10
        }
      });
    }
  });

  // Cloudinary Upload Endpoint
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "teras-warga",
        upload_preset: process.env.CLOUDINARY_UPLOAD_PRESET || undefined,
      });

      res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error: any) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // WhatsApp Gateway Endpoint (Sidobe)
  app.post("/api/whatsapp/send", async (req, res) => {
    const { target, message } = req.body;
    const apiKey = process.env.WHATSAPP_GATEWAY_TOKEN;

    if (!apiKey) {
      console.warn('⚠️ WHATSAPP_GATEWAY_TOKEN is not set.');
      return res.status(500).json({ error: "WhatsApp Gateway Token not configured" });
    }

    if (!target || !message) {
      return res.status(400).json({ error: "Target and message are required" });
    }

    const targets = target.split(',').map((t: string) => t.trim());
    const results = [];

    try {
      for (const phone of targets) {
        // Sidobe uses the same endpoint for groups, but the 'phone' field contains the Group ID
        const response = await fetch('https://api.sidobe.com/v1/send-message', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone, // This can be a phone number or a Group ID (e.g., 123456789@g.us)
            message,
          }),
        });

        const result = await response.json();
        results.push({ target: phone, result });
      }
      
      res.json({ success: true, results });
    } catch (error: any) {
      console.error("WhatsApp Gateway error:", error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // WhatsApp Groups Endpoint (Sidobe)
  app.get("/api/whatsapp/groups", async (req, res) => {
    const apiKey = process.env.WHATSAPP_GATEWAY_TOKEN;

    if (!apiKey) {
      return res.status(500).json({ error: "WhatsApp Gateway Token not configured" });
    }

    try {
      const response = await fetch('https://api.sidobe.com/v1/groups', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const result = await response.json();
        res.json(result);
      } else {
        const text = await response.text();
        console.error(`WhatsApp Groups error: Received non-JSON response (Status ${response.status}):`, text.substring(0, 200));
        
        // If it's a 404, it might be the wrong endpoint
        if (response.status === 404) {
          return res.status(404).json({ 
            error: "Endpoint API tidak ditemukan (404). Silakan hubungi pengembang.",
            success: false 
          });
        }
        
        res.status(response.status).json({ 
          error: `Gateway mengembalikan respon non-JSON (Status ${response.status})`,
          success: false
        });
      }
    } catch (error: any) {
      console.error("WhatsApp Groups error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for /api routes to prevent falling through to Vite's SPA fallback
  app.all("/api/*all", (req, res) => {
    console.warn(`API route not found: ${req.method} ${req.url}`);
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
  });

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("emergency:triggered", (data) => {
      console.log("Emergency triggered:", data);
      io.emit("emergency:alert", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
