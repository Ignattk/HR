const mongoose = require("mongoose");

const redactUri = (uri = "") =>
  uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");

const connectMongo = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MongoDB connection error: MONGO_URI is missing");
    process.exit(1);
  }

  // Helpful runtime logs for debugging Atlas connection issues
  console.log("Connecting to MongoDB (sanitized):", redactUri(uri));

  mongoose.connection.on("connected", () => {
    console.log("MongoDB connected");
  });

  mongoose.connection.on("error", (err) => {
    console.error("MongoDB connection error (event):", err?.message || err);
  });

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10_000,
      connectTimeoutMS: 10_000,
      socketTimeoutMS: 20_000,
    });
  } catch (err) {
    console.error("MongoDB connection error (connect):", err);
    // Keep process alive so nodemon can retry after edits, but still surface error
  }
};

module.exports = connectMongo;
