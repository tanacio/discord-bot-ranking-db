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
 * Discord に送る Kill Ranking メッセージを作成
 * @returns Discord に送る kill Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー Kill 数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyKillsTotal > b.WeeklyKillsTotal) ? -1 : 1;
  });

  // 0 Kill のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyKillsTotal !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する Kill Ranking メッセージ
  let discordMsgKills = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgKills = `【Kill 部門】今週のキルリーダーは ** ${rankingArray[0].WeeklyKillsTotal} キル ** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          console.log(user.get('playFabId'));
          if (user.get('killsCH') === 0) {
            discordMsgKills += `初めてのキルリーダーです。${playerArray.length}人中の1位、おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgKills += `${user.get('killsCH') + 1}回目のキルリーダーです。${playerArray.length}人中の1位、おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('killsCH');
        }).then((killsCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            killsCH: killsCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgKills = `【Kill 部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyKillsTotal} キル ** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyKillsTotal - rankingArray[1].WeeklyKillsTotal} キル差をつけて首位 :gun:\n\n`;
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
        const weeklyKillsValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyKillsTotal}`;
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
              } else if ((stats.get('killRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('killRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('killRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if ((stats.get('killRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('killRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('killRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgKills += `:first_place:  ** ${weeklyKillsValue} ** キル${upDown}\n`;
          } else if (i === 1) {
            discordMsgKills += `:second_place:  ** ${weeklyKillsValue} ** キル${upDown}\n`;
          } else if (i === 2) {
            discordMsgKills += `:third_place:  ** ${weeklyKillsValue} ** キル${upDown}\n`;
          } else {
            discordMsgKills += `${i + 1}th  ${weeklyKillsValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgKills = '【Kill 部門】誰も1キル以上していないため計測できません。\n'
  }

  return discordMsgKills;
}