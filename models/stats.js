'use strict';
const { sequelize, DataTypes } = require('./sequelize-loader');

const Stats = sequelize.define(
  'statistic',
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
    killAvgRanking: {
      type: DataTypes.INTEGER,
    },
    winAvgRanking: {
      type: DataTypes.INTEGER,
    },
    damageAvgRanking: {
      type: DataTypes.INTEGER,
    },
    WeeklyKillsTotal: {
      type: DataTypes.INTEGER,
    },
    WeeklyWinsTotal: {
      type: DataTypes.INTEGER,
    },
    WeeklyDamagesTotal: {
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
    WeeklyGamesPlayed: {
      type: DataTypes.INTEGER,
    },
    WeeklyAvgKill: {
      type: DataTypes.NUMERIC,
    },
    WeeklyAvgWin: {
      type: DataTypes.NUMERIC,
    },
    WeeklyAvgDamage: {
      type: DataTypes.NUMERIC,
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

module.exports = Stats;