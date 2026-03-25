const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const nocRegistration = sequelize.define('nocRegistration',{
   type: {
        type : DataTypes.STRING,
        allowNull : false,
    },
    capacity: {
        type : DataTypes.NUMBER,
        allowNull : true,
    },
    quantity:{
        type : DataTypes.NUMBER,
        allowNull : false,
    },
    kva : {
        type : DataTypes.NUMBER,
        allowNull : true,
    },
           
})
module.exports = nocRegistration;

