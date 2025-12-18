const { Sequelize } = require("sequelize");
const path = require("path");

// Load environment variables if not already loaded
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const sequelize = new Sequelize(
  process.env.DB_NAME || "rmc_database",
  process.env.DB_USER || "root",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const connectDB = async () => {
  try {
    console.log("Connecting to MySQL...");
    console.log("DB_HOST:", process.env.DB_HOST || "localhost");
    console.log("DB_NAME:", process.env.DB_NAME || "rmc_database");
    console.log("DB_USER:", process.env.DB_USER || "root");
    console.log(
      "DB_PASSWORD:",
      process.env.DB_PASSWORD ? "***SET***" : "***NOT SET***"
    );

    await sequelize.authenticate();
    console.log(`✓ MySQL Connected: ${process.env.DB_HOST || "localhost"}`);

    // Sync all models - schema already migrated manually
    await sequelize.sync({ alter: false });
    console.log("✓ Database tables synchronized");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
