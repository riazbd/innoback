const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const formRoutes = require("./routes/forms");
const adminRoutes = require("./routes/admin");
const http = require("http");
const { Server } = require("socket.io");
const logTraffic = require("./middleware/traffic"); // New middleware
require("./jobs/aggregateTraffic"); // Start aggregation job
require("dotenv").config();

const app = express();
const server = http.createServer(app);
// const io = socketIo(server, { cors: { origin: "http://localhost:3000" } });
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "https://innohedge-redesign.vercel.app"], // Allow Next.js frontend
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors({ origin: ["http://localhost:3000", "https://innohedge-redesign.vercel.app"], credentials: true }));
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(logTraffic); // Log traffic for every request

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));