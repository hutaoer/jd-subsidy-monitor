# 实现一个京东网页插件
* 开发一个chrome插件，用来监控mac mini 这款商品，有没有国补。
* 用来监控mac mini 这款商品，有没有国补
* 没有国补的时候，会显示 “又好又便宜”这个文案，htm代码为`<span class="pay-right-text">又好又便宜</span>`；有国补状态会显示`<span class="pay-right-text">领后减¥1045.65 立即领取</span>`，这里减的金额是不一样的，可以通过正则来匹配
* 商品链接为：`https://item.jd.com/100406236966.html?spmTag=YTAyMTguYjAwMjQ1NS5jMDAwMDM5OTEucHJvZHVjdF9uYW1lJTQwMTc5MDQ4OTk2Nzg3MCUyMzE3NDMyMTgyOTI3NjIyMDg3MzI3NzUxJTIzMTQ1NTY1NTYyNw&pcdk=189xhwLQ6a8mYYOjNkM-wl1noIQ76XgNqGnpStDrB9ymgXZ-IczrQMt01BCfXr2M.rQ4a.tlbT`，仅针对该链接进行监控，每一分钟检测一次。
* 如果判断有国补，则使用Chrome的扩展功能，弹出一个通知，提示用户有国补。
* 用最简单的方式实现。