const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const User = require('../../models/user');
const Weekly = require('../../models/weekly');
const loadingSql = require('../posts/load-sql');
// Discord に何位まで投稿するか
const playerDisplayInit = 20;

/**
 * Discord に送る Damage Ranking メッセージを作成
 * @returns Discord に送る Damage Ranking メッセージの文字列
 */
module.exports = async function (sorting, weeklyResult, crown) {
  // ウィークリー Damage 数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyDamagesTotal > b.WeeklyDamagesTotal) ? -1 : 1;
  });

  // 0 Damage のプレイヤーを削除した新しい配列を作る
  let rankingArray = [];
  for (let i = 0; i < weeklyResult.length; i++) {
    if (weeklyResult[i].WeeklyDamagesTotal !== 0) {
      rankingArray.push(weeklyResult[i]);
    }
  }

  // Discord のチャンネルに送信する Damage Ranking メッセージ
  let discordMsgDamages = '';
  if (rankingArray.length !== 0) {
    // 途中経過と最終ランキングの結果発表メッセージ 条件分岐
    if (sorting === 'finalRanking') {
      discordMsgDamages = `【Damage 部門】今週の最多勝は ** ${rankingArray[0].WeeklyDamagesTotal} 勝 ** で ** ${rankingArray[0].displayName} ** さんです:reminder_ribbon:\n`;
      crown.push(rankingArray[0].displayName);
      await (async function () {
        return await User.findOne({
          where: {
            playFabId: `${rankingArray[0].playFabId}`
          }
        }).then((user) => {
          console.log(user.get('playFabId'));
          if (user.get('damagesCH') === 0) {
            discordMsgDamages += `初めての最多勝です。おめでとうございます:confetti_ball:\n\n`;
          } else {
            discordMsgDamages += `${user.get('damagesCH') + 1}回目の最多勝です。おめでとうございます:confetti_ball:\n\n`;
          }
          return user.get('damagesCH');
        }).then((damagesCH) => {
          User.upsert({
            playFabId: rankingArray[0].playFabId,
            damagesCH: damagesCH + 1
          })
        });
      })();
    } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
      discordMsgDamages = `【Damage 部門】現在 ** ${rankingArray[0].displayName} ** さんが ** ${rankingArray[0].WeeklyDamagesTotal} ダメージ ** で 2 位の ${rankingArray[1].displayName} さんに ${rankingArray[0].WeeklyDamagesTotal - rankingArray[1].WeeklyDamagesTotal} ダメージ差をつけて首位 :clap: \n\n`;
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
        const weeklyDamagesValue = `${rankingArray[i].displayName} / ${rankingArray[i].WeeklyDamagesTotal}`;
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
              } else if ((stats.get('damageRanking') - i + 1) >= 10) {
                upDown = '  ⬆';
              } else if (i + 1 < stats.get('damageRanking')) {
                upDown = '  ↗';
              } else if (i + 1 > stats.get('damageRanking')) {
                upDown = '  ↘';
              } else {
                upDown = '  ➡';
              }
            });
          } else if (sorting === 'progressRanking' && rankingArray.length > 1) {
            if (stats === null) {
              upDown = '';
            } else if ((stats.get('damageRanking') - i + 1) >= 10) {
              upDown = '  ⬆';
            } else if (i + 1 < stats.get('damageRanking')) {
              upDown = '  ↗';
            } else if (i + 1 > stats.get('damageRanking')) {
              upDown = '  ↘';
            } else {
              upDown = '  ➡';
            }
          }
          // 順位を書き出す
          if (i === 0) {
            discordMsgDamages += `:first_place:  ** ${weeklyDamagesValue} ** ダメージ${upDown}\n`;
          } else if (i === 1) {
            discordMsgDamages += `:second_place:  ** ${weeklyDamagesValue} ** ダメージ${upDown}\n`;
          } else if (i === 2) {
            discordMsgDamages += `:third_place:  ** ${weeklyDamagesValue} ** ダメージ${upDown}\n`;
          }
          else {
            discordMsgDamages += `${i + 1}th  ${weeklyDamagesValue}${upDown}\n`;
          }
        });
      }
    }
    await outputRanking();
  } else {
    discordMsgDamages = '【Damage 部門】誰も1ダメージ以上していないため計測できません。'
  }

  return discordMsgDamages;
}