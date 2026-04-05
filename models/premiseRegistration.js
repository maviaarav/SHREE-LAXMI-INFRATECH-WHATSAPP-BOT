const {DataTypes} = require('sequelize');
const { sequelize } = require('../database/db');

const premiseRegistration = sequelize.define('premiseRegistration',{
    OwnerName : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    House_no : {
        type : DataTypes.STRING,
        allowNull : false,
    },
   ColonyName: {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Landmark : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    Locality : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    EmailAgent : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    MobileAgent : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    AgentName : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    RegistrationNeworOld : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    whetherPrivateorpublic : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    whetherCommercialorResidential : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    type : {
        type : DataTypes.STRING,
        allowNull : false,
    },
    ocAvailable : {
        type : DataTypes.BOOLEAN,
        allowNull : false,
    },
    ocNumber : {
        type : DataTypes.STRING,
        allowNull : true,
    },
    ocDate : {
        type : DataTypes.DATE,
        allowNull : true,
    },
    Make:{
        type : DataTypes.STRING,
        allowNull : true,
    },
    serialNo: {
        type : DataTypes.TEXT,
        allowNull : true,
    },
    weight: {
        type : DataTypes.TEXT,
        allowNull : true,
    },
    proposedDateofcommencement: {
        type : DataTypes.DATE,
        allowNull : true,
    },
    proposedDateofcompletion: {
        type : DataTypes.DATE,
        allowNull : true,
    },
    ApprovedbuildingplanDocument: {
        type: DataTypes.BLOB,
        allowNull: true,
    },
    ApprovedbuildingplanDocumentMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    DrawingsofPremise: {
        type: DataTypes.BLOB,
        allowNull: true,
    },
    DrawingsofPremiseMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    SafetyCertificate: {
        type: DataTypes.BLOB,
        allowNull: true,
    },
    SafetyCertificateMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    SignatureofOwner: {
        type: DataTypes.BLOB,
        allowNull: true,
    },
    SignatureofOwnerMimeType: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    personCapacity: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    gstNumber: {
        type: DataTypes.STRING,
        allowNull: true
    }
})
module.exports = premiseRegistration;

