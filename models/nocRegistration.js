const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const nocRegistration = sequelize.define('nocRegistration',{
   applicantName: {
        type : DataTypes.STRING,
        allowNull : true,
    },
   type: {
        type : DataTypes.STRING,
        allowNull : false,
    },
    capacity: {
        type : DataTypes.TEXT,
        allowNull : true,
    },
    quantity:{
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    kva : {
        type : DataTypes.TEXT,
        allowNull : true,
    },
    gstNumber: {
        type: DataTypes.STRING,
        allowNull: true,
    },
           
})
module.exports = nocRegistration;

