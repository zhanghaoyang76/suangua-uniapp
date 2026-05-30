# 奇门遁甲问卦小程序

一个面向大众娱乐的奇门遁甲微信小程序首版。

## 首版范围

- 棕褐古风暗色首页。
- 首页无导航栏，仅保留“入局问卦”入口。
- 问事页仅保留问题输入框和“依时起局”按钮。
- 按当前时间起局，展示轻量起局过程。
- 展示九宫简图、传统断语、宜忌和提醒。
- 提供“玄机详解”入口，可本地生成详解；配置接口后可接入远端智能解读。
- 不做分类、历史、收藏、分享、登录或云同步。

## 目录结构

- `pages/index`: 首页入口。
- `pages/ask`: 问事输入页。
- `pages/result`: 结果页。
- `lib/qimen.js`: 奇门排盘核心。
- `lib/interpretation.js`: 简化断语生成。
- `lib/ai.js`: 玄机详解适配层。
- `config/features.js`: 功能开关和远端详解接口配置。

## 玄机详解配置

当前已配置为调用本地智谱代理服务：

```js
module.exports = {
  deepReadingEnabled: true,
  deepReadingEndpoint: 'http://127.0.0.1:8787/api/qimen-reading',
  deepReadingTimeout: 20000
}
```

启动服务：

```powershell
$env:ZHIPU_API_KEY="你的智谱 API Key"
cd server
npm start
```

服务端接口会调用智谱 `glm-4.7-flash` 模型，并返回 `{ "deepReading": "..." }`。如需切换模型，可设置 `ZHIPU_MODEL`。

小程序发布前，需要把 `deepReadingEndpoint` 换成你部署后的 HTTPS 域名，并在微信公众平台配置合法请求域名。不要把 `ZHIPU_API_KEY` 写入小程序前端代码。

获取智谱 API Key：

1. 打开 https://open.bigmodel.cn/usercenter/proj-mgmt/apikeys
2. 登录或注册账号。
3. 点击“新建 API 密钥”。
4. 复制生成的 key，用作 `ZHIPU_API_KEY`。

如果默认模型名不可用，可在智谱控制台复制可用模型 ID，然后启动前设置：

```powershell
$env:ZHIPU_MODEL="模型名称"
```

## 开发方式

使用微信开发者工具打开本目录。

当前 `project.config.json` 使用 `touristappid`，正式开发时请替换为你自己的小程序 AppID。

## 说明

首版排盘模块使用传统节气三元局数表结构，节气边界采用固定日期近似。后续如果要进一步提高专业准确度，可以把 `lib/qimen.js` 中的节气计算替换为精确天文节气算法，页面和断语模块无需改动。
