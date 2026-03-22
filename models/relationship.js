const { sequelize } = require('../database/db');
const User = require('./user');
const RenewalTable = require('./renewalTable');

User.hasMany(RenewalTable, { foreignKey: 'userId' });
RenewalTable.belongsTo(User, { foreignKey: 'userId' });

module.exports = { sequelize, User, RenewalTable };
