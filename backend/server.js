const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { connectDB } = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const path = require("path");

// Load env vars from backend folder
dotenv.config({ path: path.join(__dirname, ".env") });

// Initialize models and associations
require("./models");

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount routers
app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/reports", require("./routes/reports"));
app.use("/api/payslip", require("./routes/payslip"));
app.use("/api/payments", require("./routes/payments"));

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Serve React frontend in production (only if build exists)
const fs = require("fs");
const buildPath = path.join(__dirname, "../frontend/build");
if (
  (process.env.NODE_ENV === "production" ||
    process.env.ELECTRON_MODE === "true") &&
  fs.existsSync(buildPath)
) {
  // Serve static files from React build
  app.use(express.static(buildPath));

  // Handle React routing - return index.html for all non-API routes
  app.get("*", (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
} else if (process.env.ELECTRON_MODE === "true" && !fs.existsSync(buildPath)) {
  // Error route for missing build in Electron mode
  app.get("*", (req, res) => {
    res.status(500).send(`
      <html>
        <head><title>Build Required</title></head>
        <body style="font-family: Arial; padding: 40px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #FF6347;">⚠️ Frontend Build Required</h1>
            <p>The React frontend hasn't been built yet. Please build it first:</p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="color: #333;">
                cd frontend<br>
                npm install<br>
                npm run build<br>
                cd ..
              </code>
            </div>
            <p><strong>Or use the quick script:</strong></p>
            <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <code style="color: #333;">Double-click: BUILD_INSTALLER.bat</code>
            </div>
            <p style="color: #666; margin-top: 30px;">After building, restart the application.</p>
          </div>
        </body>
      </html>
    `);
  });
}

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

module.exports = app;
