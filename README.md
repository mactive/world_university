# UniScope 世界大学留学地图

面向中国留学生的世界 Top 500 大学信息地图。首期重点覆盖美国、加拿大、英国、澳大利亚、新加坡和中国香港。

当前内置目录共 148 所：

- 美国 102 所：按用户提供的《2026年美国大学排名及地图》录入
- 加拿大 20 所
- 澳大利亚 Group of Eight 8 所
- 新加坡 6 所自治大学
- 中国香港 8 所教资会资助大学
- 英国 4 所首批重点大学

## 技术架构

- React + TypeScript + Vite
- MapLibre GL JS + OpenFreeMap
- Cloudflare Workers Static Assets
- Cloudflare D1
- Worker 内置轻量管理后台认证

## 本地运行

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run dev
```

访问 `/` 查看公开地图，访问 `/admin` 进入管理后台。开发环境默认密码为 `ChangeMe2026!`。

## 部署到 Cloudflare

1. 登录 Cloudflare：`npx wrangler login`
2. 创建数据库：`npx wrangler d1 create world-university-atlas`
3. 将返回的 `database_id` 写入 `wrangler.jsonc`
4. 执行迁移：`npm run db:migrate:remote`
5. 设置生产密码与会话密钥：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

6. 部署：`npm run deploy`

Google Maps 不是必需项。当前 OpenFreeMap 不需要 API Key；若未来需要 Google Places、街景或路线服务，再提供 Google Cloud 项目中的 Maps JavaScript API Key，并限制为正式域名使用。

## 数据维护原则

费用、招生人数、录取数据和申请要求都必须记录年份与来源。学校没有公开中国大陆录取人数时，应明确标注“未公开”，不要用国际生总数替代。

批量录入字段参考：`data/university-import-template.csv`。

## 刷新公开数据

```bash
npm run data:refresh
```

脚本会读取 2026 美国排名名单，并从以下公开数据源更新：

- 美国教育部 College Scorecard：城市、州、GPS、官网、州外学费、本科规模、公开录取率
- Wikidata：中英文校名、官网和非美国院校坐标

生成结果位于 `src/data/catalog.generated.json`。人工编辑仍以 D1 记录为覆盖层。

College Scorecard 最新机构文件不包含每所学校连续五年的全部录取率。当前批量目录保存最新公开年度；已有可靠历史数据的学校会继续展示多年度记录。
