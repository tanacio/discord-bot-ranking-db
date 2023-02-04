// モデルの読み込み
const User = require('../models/user');
const Stats = require('../models/stats');
const Weekly = require('../models/weekly');
const Monthly = require('../models/monthly');
User.sync().then(async () => {
  Stats.belongsTo(User, { foreignKey: 'playFabId' });
  Stats.sync();
  Weekly.belongsTo(User, { foreignKey: 'playFabId' });
  Weekly.sync();
  Monthly.belongsTo(User, { foreignKey: 'playFabId' });
  Monthly.sync();
});

// プレイヤーリストの読み込み
const playerObject = require('./player');
// プレイヤーIDの配列
const playerArray = Object.values(playerObject);
// プレイヤー仮名の配列
const playerKeysArray = Object.keys(playerObject);

/**
 * データベースを作る
 * @param {*} sorting 
 * @param {*} weeklyResult 
 */
module.exports = async function (sorting, weeklyResult) {
  const updatedAt = new Date();
  // データベースに追加
  for (let i = 0; i < weeklyResult.length; i++) {
    User.upsert({
      playFabId: playerArray[i].id,
      nickName: playerKeysArray[i]
    }).then(() => {
      return Weekly.findOne({
        where: {
          playFabId: `${weeklyResult[i].playFabId}`
        },
        order: [
          ['updatedAt', 'DESC']
        ]
      });
    }).then(() => {
      Stats.create({
        playFabId: weeklyResult[i].playFabId,
        displayName: weeklyResult[i].displayName,
        WeeklyKillsTotal: weeklyResult[i].WeeklyKillsTotal,
        WeeklyWinsTotal: weeklyResult[i].WeeklyWinsTotal,
        WeeklyDamagesTotal: weeklyResult[i].WeeklyDamagesTotal,
        CareerGamesPlayed: weeklyResult[i].CareerGamesPlayed,
        CareerKills: weeklyResult[i].CareerKills,
        CareerWins: weeklyResult[i].CareerWins,
        CareerDamage: weeklyResult[i].CareerDamage,
        killRanking: weeklyResult[i].killRanking,
        winRanking: weeklyResult[i].winRanking,
        damageRanking: weeklyResult[i].damageRanking,
        killAvgRanking: weeklyResult[i].killAvgRanking,
        winAvgRanking: weeklyResult[i].winAvgRanking,
        damageAvgRanking: weeklyResult[i].damageAvgRanking,
        WeeklyGamesPlayed: weeklyResult[i].WeeklyGamesPlayed,
        WeeklyAvgKill: weeklyResult[i].WeeklyAvgKill,
        WeeklyAvgWin: weeklyResult[i].WeeklyAvgWin,
        WeeklyAvgDamage: weeklyResult[i].WeeklyAvgDamage,
        updatedAt
      });
    }).then(() => {
      if (sorting === 'finalRanking') {
        Weekly.create({
          playFabId: weeklyResult[i].playFabId,
          displayName: weeklyResult[i].displayName,
          CareerGamesPlayed: weeklyResult[i].CareerGamesPlayed,
          CareerKills: weeklyResult[i].CareerKills,
          CareerWins: weeklyResult[i].CareerWins,
          CareerDamage: weeklyResult[i].CareerDamage,
          killRanking: weeklyResult[i].killRanking,
          winRanking: weeklyResult[i].winRanking,
          damageRanking: weeklyResult[i].damageRanking,
          updatedAt
        });
      }
      if (sorting === 'initMonthly') {
        Monthly.create({
          playFabId: weeklyResult[i].playFabId,
          displayName: weeklyResult[i].displayName,
          CareerGamesPlayed: weeklyResult[i].CareerGamesPlayed,
          CareerKills: weeklyResult[i].CareerKills,
          CareerWins: weeklyResult[i].CareerWins,
          CareerDamage: weeklyResult[i].CareerDamage,
          killRanking: weeklyResult[i].killRanking,
          winRanking: weeklyResult[i].winRanking,
          damageRanking: weeklyResult[i].damageRanking,
          updatedAt
        });
      }
    });
  }
}