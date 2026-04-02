const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'sqlite::memory:', {
  dialect: process.env.DATABASE_DIALECT || 'sqlite',
  storage: process.env.DATABASE_DIALECT === 'sqlite' ? 'database.sqlite' : undefined,
  logging: false,
  // For production (PostgreSQL)
  ...(process.env.NODE_ENV === 'production' && {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  })
});

module.exports = { sequelize };
