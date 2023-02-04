const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../../models/user');
const Weekly = require('../../models/weekly');
const loadingSql = require('../posts/load-sql');
// Discord に何位まで投稿するか
const playerDisplayInit = 20;

/**
 * Discord に送る Win Rate Ranking メッセージを作成
 * @returns Discord に送る Win Rate Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー Win Rate の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.WeeklyAvgWin - a.WeeklyAvgWin);
  });

  // 0 Win Rate のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyAvgWin !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する Win Rate Ranking メッセージ
  let discordMsgWins = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgWins = `【勝率部門】今週の最優秀勝率は ** ${rankingArray[0].WeeklyAvgWin} %** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          if (user.get('winAvgCH') === 0) {
            discordMsgWins += `初めての最優秀勝率です。おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgWins += `${user.get('winAvgCH') + 1}回目の最優秀勝率です。おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('winAvgCH');
        }).then((winAvgCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            winAvgCH: winAvgCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgWins = `【勝率部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyAvgWin} %** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyAvgWin - rankingArray[1].WeeklyAvgWin} % 差をつけて首位 :gun:\n\n`;
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
        const weeklyWinAvgValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyAvgWin}`;
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
              } else if ((stats.get('winAvgRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('winAvgRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('winAvgRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if (stats.get('winAvgRanking') === null) {
              upDown = '  ↗';
            } else if ((stats.get('winAvgRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('winAvgRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('winAvgRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgWins += `:first_place:  ** ${weeklyWinAvgValue} ** ${upDown}\n`;
          } else if (i === 1) {
            discordMsgWins += `:second_place:  ** ${weeklyWinAvgValue} ** ${upDown}\n`;
          } else if (i === 2) {
            discordMsgWins += `:third_place:  ** ${weeklyWinAvgValue} ** ${upDown}\n`;
          } else {
            discordMsgWins += `${i + 1}th  ${weeklyWinAvgValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgWins = '【勝率部門】誰も1勝以上していないため計測できません。\n'
  }

  return discordMsgWins;
}