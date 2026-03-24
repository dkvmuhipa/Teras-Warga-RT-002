import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountVar) {
      const serviceAccount = JSON.parse(serviceAccountVar);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: "teras-warga"
      });
      console.log("Firebase Admin initialized with Service Account");
    } else {
      admin.initializeApp({
        projectId: "teras-warga"
      });
      console.log("Firebase Admin initialized with Project ID (Default Credentials)");
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
  }
}

async function startServer() {
  const app = express();
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
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('http://api.open-meteo.com/v1/forecast?latitude=-0.8917&longitude=119.8707&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m', {
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) throw new Error(`Weather API responded with ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Weather proxy error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // AQI Proxy
  app.get("/api/aqi", async (req, res) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('http://air-quality-api.open-meteo.com/v1/air-quality?latitude=-0.8917&longitude=119.8707&current=us_aqi,pm2_5,pm10', {
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) throw new Error(`AQI API responded with ${response.status}`);
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("AQI proxy error:", error);
      res.status(500).json({ error: error.message });
    }
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
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
