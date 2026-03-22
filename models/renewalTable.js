const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const renewalTable = sequelize.define('renewalTable',{
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
    }
})
module.exports = renewalTable;
