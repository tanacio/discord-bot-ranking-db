const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../../models/user');
const Weekly = require('../../models/weekly');
const loadingSql = require('../posts/load-sql');
// プレイヤーリストの読み込み
const playerObject = require('../player');
// プレイヤーIDの配列
const playerArray = Object.values(playerObject);
// Discord に何位まで投稿するか
const playerDisplayInit = 20;

/**
 * Discord に送る Kill Rate Ranking メッセージを作成
 * @returns Discord に送る kill Rate Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー Kill Rate の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.WeeklyAvgKill - a.WeeklyAvgKill);
  });

  // 0 Kill Rate のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyAvgKill !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する Kill Rate Ranking メッセージ
  let discordMsgKills = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgKills = `【Kill Rate 部門】今週の最高キルレートは ** ${rankingArray[0].WeeklyAvgKill} ** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          if (user.get('killAvgCH') === 0) {
            discordMsgKills += `初めてのキルレートリーダーです。${playerArray.length}人中の1位、おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgKills += `${user.get('killAvgCH') + 1}回目のキルレートリーダーです。${playerArray.length}人中の1位、おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('killAvgCH');
        }).then((killAvgCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            killAvgCH: killAvgCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgKills = `【Kill Rate 部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyAvgKill} ** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyAvgKill - rankingArray[1].WeeklyAvgKill} 差をつけて首位 :gun:\n\n`;
    }

    // player.js の人数の方が少なければそちらの数字を優先する
    let playerDisplay = null;
    if (playerDisplayInit > rankingArray.length) {
      playerDisplay = rankingArray.length;
    } else {
      playerDisplay = playerDisplayInit
    }
    // 1位から順にランキングを出力
    async function outputRanking() {
      for (let i = 0; i < playerDisplay; i++) {
        // 名前の最後にアンダーバーがあるプレイヤーの名前を修正
        if (rankingArray[i].displayName === 'Lapras_') {
          rankingArray[i].displayName = 'Lapras'
        }
        /** @type {string} プレイヤー名 / キル数 */
        const weeklyKillAvgValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyAvgKill}`;
        await loadingSql.loadingSql(i).then((stats) => {
          // ランキングのアップダウンの表示
          let upDown = '';
          if (sorting === 'finalRanking') {
            Weekly.findOne({
              where: {
                playFabId: rankingArray[i].playFabId,
              },
              updatedAt: {
                [Op.between]: [`${loadingSql.weekAgo} 00: 00: 00`, `${loadingSql.weekAgo} 23: 59: 59`]
              },
              order: [
                ['updatedAt', 'DESC']
              ]
            }).then((stats) => {
              if (stats === null) {
                upDown = '';
              } else if ((stats.get('killAvgRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('killAvgRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('killAvgRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if (stats.get('killAvgRanking') === null) {
              upDown = '  ↗';
            } else if ((stats.get('killAvgRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('killAvgRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('killAvgRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgKills += `:first_place:  ** ${weeklyKillAvgValue} ** ${upDown}\n`;
          } else if (i === 1) {
            discordMsgKills += `:second_place:  ** ${weeklyKillAvgValue} ** ${upDown}\n`;
          } else if (i === 2) {
            discordMsgKills += `:third_place:  ** ${weeklyKillAvgValue} ** ${upDown}\n`;
          } else {
            discordMsgKills += `${i + 1}th  ${weeklyKillAvgValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgKills = '【Kill Rate 部門】誰も1キル以上していないため計測できません。\n'
  }

  return discordMsgKills;
}