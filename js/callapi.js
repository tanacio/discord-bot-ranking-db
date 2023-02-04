const axios = require('axios');
var Weekly = require('../models/weekly');
module.exports = weeklyResult = []; // 週間ランキングの配列

/**
 * Population one の APIを叩く
 * @param {URL} playerInfoUrl 
 * @returns APIから取り出した週間ランキングのオブジェクト
 */

module.exports = function (playerInfoUrl) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      axios.get(playerInfoUrl).then(res => {
        // プレイヤー名
        const displayName = res.data.accountInfo.titleInfo.displayName;

        // プレイヤーID
        const playFabId = res.data.accountInfo.playFabId;

        // API に WeeklyKillsTotal が存在するかチェック
        function weeklyKillsExist() {
          for (let i = 0; i < res.data.playerStatistics.length; i++) {
            if (res.data.playerStatistics[i].statisticName === "WeeklyKillsTotal") {
              return true;
            }
          }
        }
        // API に WeeklyWinsTotal が存在するかチェック
        function weeklyWinsExist() {
          for (let i = 0; i < res.data.playerStatistics.length; i++) {
            if (res.data.playerStatistics[i].statisticName === "WeeklyWinsTotal") {
              return true;
            }
          }
        }

        // Weekly キル数
        let WeeklyKillsTotal = undefined;
        if (weeklyKillsExist()) {
          1
          const WeeklyKillsTotalObj = res.data.playerStatistics.filter(target => {
            if (target.statisticName.indexOf('WeeklyKillsTotal') !== -1) {
              return target;
            }
          });
          WeeklyKillsTotal = WeeklyKillsTotalObj[0].value;
        } else {
          WeeklyKillsTotal = 0;
        }

        // Weekly 勝利数
        let WeeklyWinsTotal = undefined;
        if (weeklyWinsExist()) {
          const WeeklyWinsTotalObj = res.data.playerStatistics.filter(target => {
            if (target.statisticName.indexOf('WeeklyWinsTotal') !== -1) {
              return target;
            }
          });
          WeeklyWinsTotal = WeeklyWinsTotalObj[0].value;
        } else {
          WeeklyWinsTotal = 0;
        }
        // キャリアゲーム数
        const CareerGamesPlayedObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('CareerGamesPlayed') !== -1) {
            return target;
          }
        });
        const CareerGamesPlayed = CareerGamesPlayedObj[0].value;
        // キャリアキル数
        const CareerKillsObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('CareerKills') !== -1) {
            return target;
          }
        });
        const CareerKills = CareerKillsObj[0].value;
        // キャリア勝利数
        const CareerWinsObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('CareerWins') !== -1) {
            return target;
          }
        });
        const CareerWins = CareerWinsObj[0].value;
        // キャリアダメージ数
        const CareerDamageObj = res.data.playerStatistics.filter(target => {
          if (target.statisticName.indexOf('CareerDamage') !== -1) {
            return target;
          }
        });
        const CareerDamage = CareerDamageObj[0].value;


        let WeeklyGamesPlayed = null;
        let WeeklyAvgKill = null;
        let WeeklyAvgWin = null;
        let WeeklyAvgDamage = null;
        Weekly.findOne({
          where: {
            playFabId: playFabId,
          },
          order: [
            ['updatedAt', 'DESC']
          ]
        }).then((stats) => {
          console.log(stats)
          let damage = stats.get('CareerDamage');
          WeeklyDamagesTotal = CareerDamage - damage;
          WeeklyGamesPlayed = CareerGamesPlayed - stats.get('CareerGamesPlayed');
          if (WeeklyGamesPlayed !== 0) {
            WeeklyAvgKill = (WeeklyKillsTotal / WeeklyGamesPlayed).toFixed(2);
            WeeklyAvgWin = (WeeklyWinsTotal / WeeklyGamesPlayed).toFixed(2) * 100;
            WeeklyAvgDamage = (WeeklyDamagesTotal / WeeklyGamesPlayed).toFixed(0);
          } else {
            WeeklyAvgKill = 0;
            WeeklyAvgWin = 0;
            WeeklyAvgDamage = 0;
          }
          weeklyResult.push({ displayName, playFabId, WeeklyKillsTotal, WeeklyWinsTotal, WeeklyDamagesTotal, WeeklyGamesPlayed, WeeklyAvgKill, WeeklyAvgWin, WeeklyAvgDamage, CareerGamesPlayed, CareerKills, CareerWins, CareerDamage });
          resolve(stats);
        }).catch(error => {
          console.log('1週間初期化したデータがない');
          console.log(error);
          WeeklyDamagesTotal = 0;
          WeeklyGamesPlayed = 0;
          WeeklyAvgKill = 0;
          WeeklyAvgWin = 0;
          WeeklyAvgDamage = 0;
          weeklyResult.push({ displayName, playFabId, WeeklyKillsTotal, WeeklyWinsTotal, WeeklyDamagesTotal, WeeklyGamesPlayed, WeeklyAvgKill, WeeklyAvgWin, WeeklyAvgDamage, CareerGamesPlayed, CareerKills, CareerWins, CareerDamage });
          resolve();
        });

        // 最終週間ランキングの配列にプレイヤー stats のオブジェクトを入れる
        // weeklyResult.push({ displayName, playFabId, WeeklyKillsTotal, WeeklyWinsTotal, WeeklyDamagesTotal, CareerGamesPlayed, CareerKills, CareerWins, CareerDamage });
        //resolve();
      }).catch(error => {
        // アカウント削除などで API が 404エラーなどになる場合はプレイヤ名unkwown、数値を0として処理を続行する。
        weeklyResult.push({ displayName: 'unknown', WeeklyKillsTotal: 0, WeeklyWinsTotal: 0, WeeklyDamagesTotal: 0, CareerGamesPlayed: 0, CareerKills: 0, CareerWins: 0, CareerDamage: 0 });
        console.log(error);
        resolve();
      });
    }, 500);
  });
}
