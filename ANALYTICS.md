# JATA 独立站埋点数据查询指南

## 系统架构

```
访客浏览器 → analytics.js → localStorage备份 → 页面关闭时 POST /api/collect
                                                      ↓
                                              Vercel KV (Upstash Redis)
                                                      ↓
                                              /api/report 查询
```

数据在 Vercel KV 中保留 7 天。

## API 端点

### 1. 查询报表 — `/api/report`

**请求方式**: GET

**参数**:
- `date` (可选): 日期格式 `YYYY-MM-DD`，不传默认查昨天

**示例**:

```bash
# 查昨天的数据
curl https://www.jata-scr.com/api/report

# 查指定日期
curl https://www.jata-scr.com/api/report?date=2026-06-05
```

**返回格式**:

```json
{
  "date": "2026-06-05",
  "totalEvents": 2,
  "summary": {
    "pageViews": 2,
    "uniqueSessions": 2,
    "countryCount": 2,
    "heroTabViews": 0,
    "sectionViews": 0
  },
  "topCountries": [
    { "country": "China", "visits": 1 },
    { "country": "Germany", "visits": 1 }
  ],
  "events": [
    { "session": "t1", "country": "China", "type": "page_exit", "value": "30s" },
    { "session": "t2", "country": "Germany", "type": "page_exit", "value": "22s" }
  ]
}
```

### 2. 数据收集 — `/api/collect`（内部使用，analytics.js 自动调用）

```bash
curl -X POST https://www.jata-scr.com/api/collect \
  -H "Content-Type: application/json" \
  -d '[{"session":"xxx","country":"China","type":"page_exit","value":"30s"}]'
```

## 事件类型 (type 字段)

| type | value 格式 | 说明 |
|------|-----------|------|
| `page_exit` | `"30s"` | 页面停留时长（秒） |
| `section_view` | `{"section":"top","duration_ms":12000,"total_page_ms":45000}` | 区块浏览 |
| `hero_tab_view` | `{"tab":"About Us","tab_index":0,"duration_ms":8000}` | Hero 轮播停留 |
| `hero_tab` | `"About Us"` | Hero tab 点击 |

## 数据导入 GVA

将 `/api/report` 返回的 `events` 数组逐条 POST 到 GVA：

```bash
# 获取数据
curl https://www.jata-scr.com/api/report?date=2026-06-05 > report.json

# 导入 GVA（每条 event 需要加 session/country/type/value 字段）
# POST http://<gva-host>:8888/biz/analytics/event
```

### 导入脚本

```javascript
// 用 Node.js 导入
const events = require('./report.json').events;
const GVA = 'http://localhost:8888/biz/analytics/event';

for (const ev of events) {
  await fetch(GVA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-tenant-id': '2' },
    body: JSON.stringify(ev),
  });
}
console.log(`Imported ${events.length} events`);
```
