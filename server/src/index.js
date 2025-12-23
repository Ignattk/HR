require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes/api");
const connectMongo = require("./config/mongo");
const { startEmailService } = require("./services/emailService");

const app = express();
// Serve uploaded CVs
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.use(express.json());
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://hr-nine-sable.vercel.app",
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

connectMongo();

app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    startEmailService();
  } catch (err) {
    console.error("Email worker failed to start:", err?.message || err);
  }
});
