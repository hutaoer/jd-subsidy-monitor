// 收到 content script 的消息后弹出系统通知 + Server酱微信推送
const TAG = '[国补监控][后台]';

// ===== Server酱微信推送配置 =====
// 1. 打开 https://sct.ftqq.com/ 用微信扫码登录
// 2. 复制页面上的 SendKey，粘贴到下面引号里
// 3. 按页面引导在微信里关注「方糖」服务号，消息会从这里推给你
const SERVERCHAN_SENDKEY = '';

// 通过 Server酱 把消息推送到微信
async function pushToWeChat(amount, title, url) {
  if (!SERVERCHAN_SENDKEY) {
    console.warn(TAG, '未配置 SERVERCHAN_SENDKEY，跳过微信推送');
    return;
  }
  try {
    const res = await fetch(`https://sctapi.ftqq.com/${SERVERCHAN_SENDKEY}.send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        title: `有国补啦！领后减¥${amount}`,
        desp: `${title}\n\n[点我打开商品页](${url})`
      }).toString()
    });
    const data = await res.json();
    if (data.code === 0) {
      console.log(TAG, '微信推送成功');
    } else {
      console.error(TAG, '微信推送失败:', JSON.stringify(data));
    }
  } catch (e) {
    console.error(TAG, '微信推送请求异常:', e.message);
  }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SUBSIDY_FOUND') {
    console.log(TAG, '收到国补消息:', msg);
    chrome.notifications.create(
      {
        type: 'basic',
        iconUrl: 'icon.png',
        title: '京东商品有国补啦！',
        message: `${msg.title || '京东商品'}：领后减 ¥${msg.amount}，下单前先领券！`,
        priority: 2
      },
      (id) => {
        if (chrome.runtime.lastError) {
          console.error(TAG, '通知创建失败:', chrome.runtime.lastError.message);
        } else {
          console.log(TAG, '通知已创建, id:', id);
        }
      }
    );
    pushToWeChat(msg.amount, msg.title || '京东商品', msg.url || '');
    // 立即应答，避免 content script 报 "message port closed"
    sendResponse({ ok: true });
  }
});

console.log(TAG, 'service worker 已启动');
