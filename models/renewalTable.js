const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const renewalTable = sequelize.define('renewalTable',{
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
    }
})
module.exports = renewalTable;
