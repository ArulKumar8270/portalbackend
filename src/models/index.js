const { readdirSync } = require("fs");
const { basename: _basename, join } = require("path");
const Sequelize = require("sequelize");
const config = require("../config/index");
const basename = _basename(__filename);
const db = {};
let sequelize = new Sequelize(
  config.db.database,
  config.db.username,
  config.db.password,
  {
    host: config.db.host,
    port: config.db.port,
    dialect: config.db.connection,
    logging: false,
    underscored: true,
    pool: {
      max: 10, // Reduced from 20 to avoid hitting connection limits (500/hour)
      min: 0, // Start with 0 connections, create as needed
      idle: 20000, // Close idle connections after 10 seconds
      acquire: 30000, // Timeout after 30 seconds if connection can't be acquired
      evict: 1000, // Check for idle connections every 1 second
    },
    retry: {
      max: 3, // Retry failed connections up to 3 times
    },
    // Handle connection errors gracefully
    dialectOptions: {
      connectTimeout: 10000, // 10 second connection timeout
    },
    timestamps: true,
  }
);

// Test database connection on startup
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err.message);
  });

readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    const model = require(join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
