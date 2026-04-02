const { sequelize } = require('../database/db');
const User = require('./User');
const RenewalTable = require('./renewalTable');
const nocRegistration = require('./nocRegistration');
const premiseRegistration = require('./premiseRegistration');
const quotationAmount = require('./quotationAmount');
const paymentProof = require('./paymentProof');

User.hasMany(RenewalTable, { foreignKey: 'userId' });
RenewalTable.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(nocRegistration, { foreignKey: 'userId' });
nocRegistration.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(premiseRegistration, { foreignKey: 'userId' });
premiseRegistration.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(quotationAmount, { foreignKey: 'userId' });
quotationAmount.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(paymentProof, { foreignKey: 'userId' });
paymentProof.belongsTo(User, { foreignKey: 'userId' });
quotationAmount.hasMany(paymentProof, { foreignKey: 'quotationId' });
paymentProof.belongsTo(quotationAmount, { foreignKey: 'quotationId' });

module.exports = { sequelize, User, RenewalTable, nocRegistration, premiseRegistration, quotationAmount, paymentProof };
