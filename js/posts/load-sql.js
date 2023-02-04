const Sequelize = require('sequelize');
const Op = Sequelize.Op;
const Stats = require('../../models/stats');

let now = null;
let year = null;
let month = null;
let date = null;

// 昨日の日付
now = new Date();
now.setDate(now.getDate() - 1);
year = now.getFullYear();
month = now.getMonth() + 1;
date = now.getDate();
const yesterday = `${year}-${month}-${date}`
// const yesterday = `2022-06-13`

// 1週間前
now = new Date();
now.setDate(now.getDate() - 7)
year = now.getFullYear();
month = now.getMonth() + 1;
date = now.getDate();
const weekAgo = `${year}-${month}-${now.getDate()}`

// 1ヶ月前
now = new Date();
year = now.getFullYear();
month = now.getMonth() + 1;
date = now.getDate();
const monthAgo = `${year}-${month - 1}-01`

/**
 * 昨日の個人スタッツのデータベース
 * @param {Object}
 * @returns データベースのオブジェクト
 */
const loadingSql = function (i) {
  return new Promise(function (resolve) {
    Stats.findOne({
      where: {
        playFabId: `${weeklyResult[i].playFabId}`,
        updatedAt: {
          [Op.between]: [`${yesterday} 00: 00: 00`, `${yesterday} 23: 59: 59`]
        }
      },
      order: [
        ['updatedAt', 'DESC']
      ]
    }).then((stats) => {
      resolve(stats)
    })
  });
}

/**
 * 1週間前の個人スタッツのデータベース
 * @param {Object}
 * @returns データベースのオブジェクト
 */
const loadingSqlWeek = function (i) {
  return new Promise(function (resolve) {
    Stats.findOne({
      where: {
        playFabId: `${weeklyResult[i].playFabId}`,
        updatedAt: {
          [Op.between]: [`${weekAgo} 00: 00: 00`, `${weekAgo} 23: 59: 59`]
        }
      },
      order: [
        ['updatedAt', 'DESC']
      ]
    }).then((stats) => {
      resolve(stats)
    })
  });
}

/**
 * 1ヶ月前の個人スタッツのデータベース
 * @param {Object}
 * @returns データベースのオブジェクト
 */
const loadingSqlMonth = function (i) {
  return new Promise(function (resolve) {
    Stats.findOne({
      where: {
        playFabId: `${weeklyResult[i].playFabId}`,
        updatedAt: {
          [Op.between]: [`${monthAgo} 00: 00: 00`, `${monthAgo} 23: 59: 59`]
        }
      },
      order: [
        ['updatedAt', 'DESC']
      ]
    }).then((stats) => {
      resolve(stats)
    })
  });
}

module.exports = { loadingSql, loadingSqlWeek, loadingSqlMonth, yesterday, weekAgo, monthAgo }