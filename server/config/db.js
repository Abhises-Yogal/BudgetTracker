// server/config/db.js
// Opens and manages the Mongoose connection. Called once at server boot; Mongoose handles reconnection internally.
// All connection events are logged so problems are easy to spot.

import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    throw new Error("MONGODB_URI or MONGO_URI is not set in environment variables.");
  }

  // Log every state change so you can see connects/disconnects in the console
  mongoose.connection.on("connected", () =>
    console.log("  ✔  MongoDB connected:", uri.replace(/:\/\/.*@/, "://<credentials>@"))
  );
  mongoose.connection.on("disconnected", () =>
    console.warn("  ✖  MongoDB disconnected — will retry automatically")
  );
  mongoose.connection.on("error", (err) =>
    console.error("  ✖  MongoDB error:", err.message)
  );

  await mongoose.connect(uri, {
    // Prevents deprecation warnings in Mongoose 8
    serverSelectionTimeoutMS: 5000, // fail fast if MongoDB isn't reachable
  });
}
