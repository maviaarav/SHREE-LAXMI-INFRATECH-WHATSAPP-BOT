const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');
 
const quotationAmount = sequelize.define('quotationAmount', {
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.STRING,
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    pdfData: {
        type: DataTypes.BLOB,
        allowNull: true
    },
    pdfMimeType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    pdfOriginalName: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending'
    },
    orderNo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    gstNumber: {
        type: DataTypes.STRING,
        allowNull: true
    }
});
module.exports = quotationAmount;