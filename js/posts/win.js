const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../../models/user');
const Weekly = require('../../models/weekly');
const loadingSql = require('../posts/load-sql');
// Discord に何位まで投稿するか
const playerDisplayInit = 20;

/**
 * Discord に送る Win Ranking メッセージを作成
 * @returns Discord に送る Win Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー Win 数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyWinsTotal > b.WeeklyWinsTotal) ? -1 : 1;
  });

  // 0 Win のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyWinsTotal !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する Win Ranking メッセージ
  let discordMsgWins = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgWins = `【Victory 部門】今週の最多勝は ** ${rankingArray[0].WeeklyWinsTotal} 勝 ** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          console.log(user.get('playFabId'));
          if (user.get('winsCH') === 0) {
            discordMsgWins += `初めての最多勝です。おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgWins += `${user.get('winsCH') + 1}回目の最多勝です。おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('winsCH');
        }).then((winsCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            winsCH: winsCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgWins = `【Victory 部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyWinsTotal} 勝 ** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyWinsTotal - rankingArray[1].WeeklyWinsTotal} 勝差をつけて首位 :clap: \n\n`;
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
        /** @type {string} プレイヤー名 / 勝利数 */
        const weeklyWinsValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyWinsTotal}`;
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
              } else if ((stats.get('winRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('winRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('winRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if ((stats.get('winRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('winRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('winRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgWins += `:first_place:  ** ${weeklyWinsValue} ** 勝${upDown}\n`;
          } else if (i === 1) {
            discordMsgWins += `:second_place:  ** ${weeklyWinsValue} ** 勝${upDown}\n`;
          } else if (i === 2) {
            discordMsgWins += `:third_place:  ** ${weeklyWinsValue} ** 勝${upDown}\n`;
          }
          else {
            discordMsgWins += `${i + 1}th  ${weeklyWinsValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgWins = '【Victory 部門】誰も1勝以上していないため計測できません。'
  }

  return discordMsgWins;
}