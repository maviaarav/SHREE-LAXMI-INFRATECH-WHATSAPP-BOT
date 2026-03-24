const { sequelize } = require('../database/db');
const User = require('./user');
const RenewalTable = require('./renewalTable');
const nocRegistration = require('./nocRegistration');
const premiseRegistration = require('./premiseRegistration');

User.hasMany(RenewalTable, { foreignKey: 'userId' });
RenewalTable.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(nocRegistration, { foreignKey: 'userId' });
nocRegistration.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(premiseRegistration, { foreignKey: 'userId' });
premiseRegistration.belongsTo(User, { foreignKey: 'userId' });
module.exports = { sequelize, User, RenewalTable, nocRegistration, premiseRegistration };
