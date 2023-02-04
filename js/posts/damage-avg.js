const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../../models/user');
const Weekly = require('../../models/weekly');
const loadingSql = require('../posts/load-sql');
// Discord に何位まで投稿するか
const playerDisplayInit = 20;

/**
 * Discord に送る 平均ダメージ Ranking メッセージを作成
 * @returns Discord に送る 平均ダメージ Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー 平均ダメージ の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.WeeklyAvgDamage - a.WeeklyAvgDamage);
  });

  // 0 平均ダメージ のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyAvgDamage !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する 平均ダメージ Ranking メッセージ
  let discordMsgDamages = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgDamages = `【平均ダメージ部門】今週の最優秀平均ダメージは ** ${rankingArray[0].WeeklyAvgDamage} ** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          if (user.get('damageAvgCH') === 0) {
            discordMsgDamages += `初めての最優秀平均ダメージです。おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgDamages += `${user.get('damageAvgCH') + 1}回目の最優秀平均ダメージです。おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('damageAvgCH');
        }).then((damageAvgCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            damageAvgCH: damageAvgCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgDamages = `【平均ダメージ部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyAvgDamage} %** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyAvgDamage - rankingArray[1].WeeklyAvgDamage} % 差をつけて首位 :gun:\n\n`;
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
        const weeklyDamageAvgValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyAvgDamage}`;
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
              } else if ((stats.get('damageAvgRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('damageAvgRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('damageAvgRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if (stats.get('damageAvgRanking') === null) {
              upDown = '  ↗';
            } else if ((stats.get('damageAvgRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('damageAvgRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('damageAvgRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgDamages += `:first_place:  ** ${weeklyDamageAvgValue} ** ${upDown}\n`;
          } else if (i === 1) {
            discordMsgDamages += `:second_place:  ** ${weeklyDamageAvgValue} ** ${upDown}\n`;
          } else if (i === 2) {
            discordMsgDamages += `:third_place:  ** ${weeklyDamageAvgValue} ** ${upDown}\n`;
          } else {
            discordMsgDamages += `${i + 1}th  ${weeklyDamageAvgValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgDamages = '【平均ダメージ部門】誰も1勝以上していないため計測できません。\n'
  }

  return discordMsgDamages;
}