'use strict';
const { sequelize, DataTypes } = require('./sequelize-loader');

const Weekly = sequelize.define(
  'weeklies',
  {
    playFabId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    displayName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    killRanking: {
      type: DataTypes.INTEGER,
    },
    winRanking: {
      type: DataTypes.INTEGER,
    },
    damageRanking: {
      type: DataTypes.INTEGER,
    },
    CareerGamesPlayed: {
      type: DataTypes.INTEGER,
    },
    CareerKills: {
      type: DataTypes.INTEGER,
    },
    CareerWins: {
      type: DataTypes.INTEGER,
    },
    CareerDamage: {
      type: DataTypes.INTEGER,
    },
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    freezeTableName: true,
    timestamps: false,
    indexes: [
      {
        fields: ['playFabId']
      }
    ]
  }
);

module.exports = Weekly;