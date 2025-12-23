require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const apiRouter = require("./routes/api");
const connectMongo = require("./config/mongo");

const app = express();
// Serve uploaded CVs
app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173", // Specific origin instead of wildcard
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials if needed in the future
  })
);

connectMongo();

app.use("/api", apiRouter);

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
