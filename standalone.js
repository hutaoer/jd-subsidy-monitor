/* ============================================================
 * 京东国补监控 - 控制台独立版
 * 直接粘贴到商品页 F12 控制台即可运行，不依赖任何扩展
 * 支持无痕模式（无需安装扩展）
 *
 * 用法：
 *   1. 打开京东商品详情页（https://item.jd.com/xxx.html）
 *   2. 按 F12 打开控制台，粘贴本文件全部代码回车
 *   3. 首次运行会请求通知权限，点「允许」
 *   4. 脚本每 20~30 分钟自动检测一次，有国补时弹浏览器通知 + 微信推送
 *
 * 注意：
 *   - 本版不自动刷新页面（刷新会清掉控制台注入的脚本），改用定时扫描 DOM
 *   - 如需刷新后自动续跑，请用 Tampermonkey 把本脚本存为用户脚本，或直接用扩展版
 * ============================================================ */

(() => {
  // ===== 配置区：按需修改 =====
  // Server酱 SendKey，用于微信推送。留空则只弹浏览器通知不推微信。
  // 获取方式：打开 https://sct.ftqq.com/ 微信扫码登录，复制 SendKey
  const SERVERCHAN_SENDKEY = '';

  const RENDER_DELAY_MS = 10 * 1000;       // 首次运行前等页面渲染
  const CHECK_INTERVAL_MIN = 20;           // 检测间隔下限（分钟）
  const CHECK_INTERVAL_MAX = 30;           // 检测间隔上限（分钟）

  // ===== 以下无需修改 =====
  const SUBSIDY_RE = /领后减[¥￥]\s*([\d.]+)/;
  const TAG = '[国补监控]';

  function randomIntervalMs() {
    const minutes = CHECK_INTERVAL_MIN + Math.random() * (CHECK_INTERVAL_MAX - CHECK_INTERVAL_MIN);
    return Math.floor(minutes * 60 * 1000);
  }

  function getSkuId() {
    const m = location.pathname.match(/(\d+)\.html/);
    return m ? m[1] : 'unknown';
  }

  function getPageTitle() {
    return document.title.split(' - ')[0].trim() || '京东商品';
  }

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
      console.log(TAG, data.code === 0 ? '微信推送成功' : '微信推送失败:', JSON.stringify(data));
    } catch (e) {
      console.error(TAG, '微信推送请求异常:', e.message);
    }
  }

  function notifyBrowser(amount, title) {
    if (!('Notification' in window)) {
      console.warn(TAG, '当前浏览器不支持系统通知');
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification('京东商品有国补啦！', {
        body: `${title}：领后减 ¥${amount}，下单前先领券！`,
      });
      console.log(TAG, '已弹出浏览器通知');
    } else {
      console.warn(TAG, '未获得通知权限，无法弹出浏览器通知');
    }
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
      console.log(TAG, '❌ 未匹配到国补（可能是「又好又便宜」）');
    }

    // 状态存 localStorage，跨检测轮次去重（每个商品独立）
    const key = `hasSubsidy_${getSkuId()}`;
    const hadSubsidy = localStorage.getItem(key) === 'true';

    // 只在「无 → 有」变化时通知一次
    if (amount && !hadSubsidy) {
      notifyBrowser(amount, getPageTitle());
      pushToWeChat(amount, getPageTitle(), location.href);
    }
    localStorage.setItem(key, String(!!amount));

    // 排下一次检测
    const waitMs = randomIntervalMs();
    console.log(TAG, `本次检测完成，${(waitMs / 60000).toFixed(1)} 分钟后再次检测`);
    setTimeout(check, waitMs);
  }

  // 启动：先请求通知权限，再等渲染后开始检测
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then((p) => {
      console.log(TAG, `通知权限: ${p}`);
    });
  }

  console.log(TAG, '脚本已注入，开始监控');
  setTimeout(check, RENDER_DELAY_MS);
})();
