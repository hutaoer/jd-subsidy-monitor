// 监控京东商品详情页的国补状态：每 20~30 分钟随机刷新一次页面，保持页面是最新状态后再检测
const RENDER_DELAY_MS = 10 * 1000; // 页面加载后等动态内容渲染完再检测

// 生成 20~30 分钟之间的随机刷新间隔（毫秒），每次刷新都重新抽样，避开固定频率
function randomReloadIntervalMs() {
  const minutes = 20 + Math.random() * 10; // 20 ~ 30
  return Math.floor(minutes * 60 * 1000);
}

// 匹配 "领后减¥1045.65 立即领取" 中的金额（金额不固定，用正则提取；¥ 兼容全角￥）
const SUBSIDY_RE = /领后减[¥￥]\s*([\d.]+)/;

const TAG = '[国补监控]';

// 从 URL 取商品 ID，作为状态存储的 key（每个商品独立去重）
function getSkuId() {
  const m = location.pathname.match(/(\d+)\.html/);
  return m ? m[1] : 'unknown';
}

// 取商品标题（京东标题结尾一般是 " - 京东"，去掉后缀方便识别商品）
function getPageTitle() {
  return document.title.split(' - ')[0].trim() || '京东商品';
}

function check() {
  const els = document.querySelectorAll('.pay-right-text');
  console.log(TAG, `检测中... 找到 ${els.length} 个 .pay-right-text 元素`);

  let amount = null;
  for (const el of els) {
    console.log(TAG, '元素内容:', JSON.stringify(el.textContent.trim()));
    const match = el.textContent.match(SUBSIDY_RE);
    if (match) {
      amount = match[1];
      break;
    }
  }

  if (amount) {
    console.log(TAG, `✅ 正则匹配到国补，金额: ${amount}`);
  } else {
    console.log(TAG, '❌ 未匹配到国补（可能是「又好又便宜」或元素未渲染）');
  }

  // 上一次的状态存在 chrome.storage 里，页面刷新不会丢失，每个商品独立去重
  const key = `hasSubsidy_${getSkuId()}`;
  chrome.storage.local.get({ [key]: false }, (data) => {
    // 只在状态从「无国补」变为「有国补」时通知一次
    if (amount && !data[key]) {
      try {
        chrome.runtime.sendMessage({ type: 'SUBSIDY_FOUND', amount, title: getPageTitle(), url: location.href }, () => {
          if (chrome.runtime.lastError) {
            console.error(TAG, '消息发送失败:', chrome.runtime.lastError.message);
          } else {
            console.log(TAG, '已通知后台弹出系统通知');
          }
        });
      } catch (e) {
        // 插件重载后旧页面会失联，刷新页面即可
        console.error(TAG, '插件连接已失效，请刷新页面:', e.message);
      }
    }
    chrome.storage.local.set({ [key]: !!amount });
  });

  // 检测完成，等一个随机间隔（20~30 分钟）后刷新页面
  const waitMs = randomReloadIntervalMs() - RENDER_DELAY_MS;
  console.log(TAG, `本次检测完成，${(waitMs / 60000).toFixed(1)} 分钟后刷新页面`);
  setTimeout(() => location.reload(), waitMs);
}

console.log(TAG, '内容脚本已注入，开始监控');
setTimeout(check, RENDER_DELAY_MS);
