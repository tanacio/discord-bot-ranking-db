'use strict';
const cron = require('node-cron');
const callApi = require('./js/callapi');
const createKillMsg = require('./js/posts/kill');
const createWinMsg = require('./js/posts/win');
const createDamageMsg = require('./js/posts/damage');
const createKillAvgMsg = require('./js/posts/kill-avg');
const createWinAvgMsg = require('./js/posts/win-avg');
const createDamageAvgMsg = require('./js/posts/damage-avg');
const createSql = require('./js/create-sql');

// discord.js を読み込み Client を新規に作成
const { Client, Intents } = require('discord.js');
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

// Discord Bot のアクセストークンとチャンネルIDの環境変数
require('dotenv').config();
const token = process.env.DISCORD_BOT_TOKEN;
const channelIdTraining = process.env.DISCORD_CHANNEL_ID_TRAINING;

// プレイヤーリストの読み込み
const playerObject = require('./js/player.js');
// プレイヤーIDの配列
const playerArray = Object.values(playerObject);

// 週間ランキングを作成する関数
let discordMsg = 'ごめんなさい。失敗しました。';
async function createRanking(sorting, clan) {
  // クラン別の配列にする
  let clanArray = playerArray.filter((clanName) => {
    if (clanName['clan'].match(`${clan}`) !== null) {
      return true;
    } else {
      return false;
    }
  });

  // クラン別に promise で api通信
  for (let i = 0; i < clanArray.length; i++) {
    const playerInfoUrl = `https://nykloo.com/api/PlayerStats/Stats/${clanArray[i].id}`;
    await callApi(playerInfoUrl);
  }
  console.log('weeklyResult1')
  console.log(weeklyResult)
  // ウィークリー Kill 数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyKillsTotal > b.WeeklyKillsTotal) ? -1 : 1;
  });
  // 配列にキル数順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].killRanking = i + 1;
  }

  // ウィークリー Win 数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyWinsTotal > b.WeeklyWinsTotal) ? -1 : 1;
  });
  // 配列に勝利数順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].winRanking = i + 1;
  }

  // ウィークリー ダメージ数の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (a.WeeklyDamagesTotal > b.WeeklyDamagesTotal) ? -1 : 1;
  });
  // 配列にダメージ数順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].damageRanking = i + 1;
  }

  // ウィークリー キルレートの降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.WeeklyAvgKill - a.WeeklyAvgKill);
  });
  // 配列にキルレート順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].killAvgRanking = i + 1;
  }

  // ウィークリー 勝率の降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.WeeklyAvgWin - a.WeeklyAvgWin);
  });
  // 配列に勝率順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].winAvgRanking = i + 1;
  }

  // ウィークリー 平均ダメージの降順ソート
  weeklyResult = weeklyResult.sort(function (a, b) {
    return (b.damageAvgRanking - a.damageAvgRanking);
  });
  // 配列に平均ダメージ順位を追加
  for (let i = 0; i < weeklyResult.length; i++) {
    weeklyResult[i].damageAvgRanking = i + 1;
  }

  // データベースを作る
  await createSql(sorting, weeklyResult);
  const crown = [];

  // kill Ranking メッセージ
  const weeklyKillMsg = await createKillMsg(sorting, weeklyResult, crown, clanArray);
  // Win Ranking メッセージ
  const weeklyWinMsg = await createWinMsg(sorting, weeklyResult, crown, clanArray);
  // Damage Ranking メッセージ
  const weeklyDamageMsg = await createDamageMsg(sorting, weeklyResult, crown, clanArray);
  // キルレート メッセージ
  const weeklyKillAvgMsg = await createKillAvgMsg(sorting, weeklyResult, crown, clanArray);
  // 勝率 メッセージ
  const weeklyWinAvgMsg = await createWinAvgMsg(sorting, weeklyResult, crown, clanArray);
  // 平均ダメージ メッセージ
  const weeklyDamageAvgMsg = await createDamageAvgMsg(sorting, weeklyResult, crown, clanArray);
  // Kill and Win Ranking のメッセージを結合
  discordMsg = weeklyKillMsg + '\n' + weeklyWinMsg + '\n' + weeklyDamageMsg + '\n' + weeklyKillAvgMsg + '\n' + weeklyWinAvgMsg + '\n' + weeklyDamageAvgMsg;
};

/**
 * Discord のチャンネルに投稿
 */
client.on('ready', async () => {
  // 指定時に最終結果を投稿 ('秒 分 時間 日 月 曜日')曜日は0と7が日曜日
  cron.schedule('0 50 22 * * 7', async () => {
    await createRanking('finalRanking', 'training');
    const channelTraining = client.channels.cache.get(channelIdTraining); // channelIdxxx は .env に入力
    weeklyResult = []; // 週間ランキングの配列初期化
    // await sleep(4); // sleep 早朝に通知を飛ばさないため(例: 5時間後)
    await channelTraining.send(discordMsg); // Discord のチャンネルにメッセージを送信

    // discordMsg = '';
    // await createRanking('finalRanking', 'clan name');
    // const channelXXX = client.channels.cache.get(''); // channelIdxxx は .env に入力
    // weeklyResult = []; // 週間ランキングの配列初期化
    // await channelXXX.send(discordMsg);
  });

  // 指定時に途中経過を投稿 ('秒 分 時間 日 月 曜日')曜日は0と7が日曜日
  cron.schedule('0 0 10 * * 2,3,4,5,6,7', async () => {
    await createRanking('progressRanking', 'training');
    const channelTraining = client.channels.cache.get(channelIdTraining); // channelIdxxx は .env に入力
    weeklyResult = []; // 週間ランキングの配列初期化
    await channelTraining.send(discordMsg); // Discord のチャンネルにメッセージを送信

    // discordMsg = '';
    // await createRanking('progressRanking', 'clan name');
    // const channelXXX = client.channels.cache.get(''); // channelIdxxx は .env に入力
    // weeklyResult = []; // 週間ランキングの配列初期化
    // await channelXXX.send(discordMsg);
  });

  // 月曜日
  cron.schedule('0 0 12 * * 1', async () => {
    await createRanking('progressRanking', 'training');
    const channelTraining = client.channels.cache.get(channelIdTraining); // channelIdxxx は .env に入力
    weeklyResult = []; // 週間ランキングの配列初期化
    await channelTraining.send(discordMsg); // Discord のチャンネルにメッセージを送信
  });
});

// 月初 データベース初期化
(async () => {
  cron.schedule('0 1 0 1 * *', async () => {
    await createRanking('initMonthly', 'training');
    weeklyResult = []; // 週間ランキングの配列初期化
  });
})();

// sleep 関数
function sleep(hour) {
  return new Promise(resolve => setTimeout(resolve, hour * 3600000));
}

// アクセストークンで Discord にログイン
client.login(token); // token は .env に入力