const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const nocRegistration = sequelize.define('nocRegistration',{
   type: {
        type : DataTypes.STRING,
        allowNull : false,
    },
    capacity: {
        type : DataTypes.INTEGER,
        allowNull : true,
    },
    quantity:{
        type : DataTypes.INTEGER,
        allowNull : false,
    },
    kva : {
        type : DataTypes.INTEGER,
        allowNull : true,
    },
           
})
module.exports = nocRegistration;

