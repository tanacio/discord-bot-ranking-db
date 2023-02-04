'use strict';
const { sequelize, DataTypes } = require('./sequelize-loader');

const User = sequelize.define(
  'users',
  {
    playFabId: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    nickName: {
      type: DataTypes.STRING,
    },
    killsCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    winsCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    damagesCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    killAvgCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    winAvgCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    damageAvgCH: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    grandSlam: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    freezeTableName: true,
    timestamps: false
  }
);

module.exports = User;