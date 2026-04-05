const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const paymentProof = sequelize.define('paymentProof',{
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    orderNo: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
    },
    screenshotData: {
        type: DataTypes.BLOB,
        allowNull: false,
    },
    screenshotMimeType: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    screenshotOriginalName: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
    },
    ownerReviewedAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    gstNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
});

module.exports = paymentProof;
