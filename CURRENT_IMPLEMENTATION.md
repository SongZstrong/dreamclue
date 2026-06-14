# Current Implementation

## 1. 项目定位

当前仓库是一个面向梦境记录与解梦检索的 SaaS 应用，现阶段真正落地的业务已经集中在以下能力：

1. 用户记录梦境日志，并可调用 AI 做文本分析。
2. 管理员上传解梦资料，系统将其解析、分块、向量化并写入 Supabase Postgres。
3. 登录用户在 `/dreambook` 页面查询知识库结果。
4. Stripe 负责订阅、终身套餐和积分包结算。

代码入口主要在：

- `src/app`：页面与 API route
- `src/actions`：server action
- `src/db`：Drizzle schema 与数据库连接
- `src/payment`：支付实现
- `src/credits`：积分结算
- `src/lib/knowledge-base`：当前在用的知识库检索实现

## 2. 技术栈与运行方式

### 前端与路由

- Next.js 16 + React 19 + TypeScript
- App Router
- `next-intl` 做中英文路由与文案
- `nuqs` 将分页、筛选、排序同步到 URL
- React Query 负责客户端数据获取和缓存

### 认证与数据库

- Better Auth
- Drizzle ORM
- PostgreSQL
- `src/lib/safe-action.ts` 提供三层 action client：
  - `actionClient`
  - `userActionClient`
  - `adminActionClient`

### 向量检索

- 当前主链路使用 SiliconFlow Embeddings API
- 存储层使用 Supabase Postgres
- 检索层使用 `pgvector + Postgres FTS`
- 文件解析与向量化逻辑在 `src/lib/knowledge-base/*`

### 外部集成

- Stripe：支付
- Resend：邮件
- Resend / Beehiiv：Newsletter
- Discord / Feishu：通知

## 3. 路由与页面现状

### 公共页面

公开页面来自 `src/app/[locale]/(marketing)`，主要包括：

- `/`：营销首页
- `/pricing`：价格页
- `/dreambook`：Dreambook 搜索页
- `/about`
- `/contact`
- `/waitlist`
- `/roadmap`
- `/changelog`
- `/blog/*`
- `/cookie`、`/privacy`、`/terms`

首页主要由现成的营销 blocks 组合而成，真正的业务页是 `/dreambook`。

### 登录与受保护页面

受保护页面来自 `src/app/[locale]/(protected)`：

- `/dashboard`：梦境统计面板
- `/journal`：梦境日志列表与创建入口
- `/journal/[id]`：单条梦境详情
- `/payment`：支付结果轮询页
- `/settings/*`：个人资料、账单、积分、安全、通知、API Key
- `/admin/users`：管理员用户列表
- `/admin/knowledge`：管理员知识库管理

## 4. 功能实现拆解

### 4.1 国际化与认证

#### 国际化

- 路由定义在 `src/i18n/routing.ts`
- 当前 locale 为 `en` / `zh`
- `localePrefix` 为 `as-needed`，默认语言不带前缀
- 文案文件在 `messages/en.json` 与 `messages/zh.json`

#### 认证

认证主配置在 `src/lib/auth.ts`：

- 支持邮箱密码登录
- 支持 GitHub / Google OAuth
- 支持忘记密码与重置密码邮件
- 开启账号关联
- 使用 Better Auth admin / bearer / emailHarmony 插件

当前实现细节：

- 邮箱验证发送能力还在，但 `requireEmailVerification` 被设置为 `false`
- 新用户创建后会触发 `databaseHooks.user.create.after`
- 这个 hook 会尝试：
  - 自动订阅 newsletter
  - 如果积分开关开启，则发放注册赠送积分
  - 如果积分开关开启，则发放免费计划月度积分

### 4.2 梦境日志

梦境核心表是 `src/db/app.schema.ts` 中的 `dreams`：

- `title`
- `content`
- `mood`
- `tags`
- `aiAnalysis`
- `aiAnalyzedAt`

对应 action：

- `src/actions/create-dream.ts`
- `src/actions/get-dreams.ts`
- `src/actions/get-dream.ts`
- `src/actions/update-dream.ts`
- `src/actions/delete-dream.ts`
- `src/actions/analyze-dream.ts`

实现特点：

- 所有 CRUD 都要求登录
- 读写前会校验 `dream.userId === currentUser.id`
- 列表支持：
  - 标题/正文模糊搜索
  - `mood` 过滤
  - `createdAt` / `updatedAt` 排序
  - 分页

前端入口：

- `src/components/journal/journal-page-client.tsx`
- `src/hooks/use-journal.ts`

其中：

- `CreateDreamForm` 负责创建
- `JournalTable` 负责列表展示
- URL 参数由 `nuqs` 管理

### 4.3 梦境 AI 分析

AI 分析入口：

- `src/actions/analyze-dream.ts`
- `src/ai/index.ts`
- `src/ai/provider/openai.ts`

当前链路：

1. 用户在梦境记录里触发分析。
2. action 先确认梦境归属当前用户。
3. 使用 `OpenAIProvider` 调用 `chat.completions.create`。
4. 结果写回 `dreams.aiAnalysis` 与 `dreams.aiAnalyzedAt`。

当前默认模型：

- `OPENAI_MODEL`
- 未设置时回退到 `gpt-4o-mini`

Prompt 目标是输出：

- 象征意义
- 情绪主题
- 与现实生活的联系
- 反思建议

### 4.4 Dashboard 统计

Dashboard 页面在 `src/app/[locale]/(protected)/dashboard/page.tsx`，其业务数据来自以下 action：

- `src/actions/get-dream-stats.ts`
- `src/actions/get-dream-timeline.ts`
- `src/actions/get-dream-mood-distribution.ts`
- `src/actions/get-dream-tags.ts`

统计内容包括：

- 梦境总数
- 本周 / 本月新增
- 上月对比变化
- 已完成 AI 分析的数量与分析率
- 近 7 / 30 / 90 天时间线
- 心情分布
- Top 10 标签

这些统计都是直接读 `dreams` 表后在 SQL 或应用层聚合。

### 4.5 Dreambook 检索

#### 当前页面

当前线上主入口是：

- 页面：`src/app/[locale]/(marketing)/(pages)/dreambook/page.tsx`
- 组件：`src/components/dreambook/dreambook-explorer-new.tsx`

这个页面调用的是当前在用的检索 action：

- `src/actions/search-knowledge.ts`

#### 访问限制

`searchKnowledgeAction` 的限制逻辑如下：

1. 必须登录，否则返回 `DreambookPage.signInRequired`
2. `admin` 角色无限制
3. 只要用户存在任意 `paid = true` 且 `status = 'active'` 的支付记录，也视为无限制
4. 其余用户每天只能查 1 次

每日次数记录在：

- `dreambook_queries`

#### 当前检索链路

当前实际检索链路全部在 `src/lib/knowledge-base/*`：

1. `rewriteQuery(...)` 做规则优先的问题重写，低置信度时再走 LLM rewrite
2. `detectIntent(...)` 做意图识别
3. `buildRetrievalPlan(...)` 生成检索路由计划
4. `embedText(query)` 生成查询向量
5. `searchDocuments(...)` 从 Postgres `pgvector` 拉回候选片段
6. `searchLexicalDocuments(...)` 从 Postgres FTS 拉回词项候选
7. `mergeAndDedupeResults(...)` 合并去重
8. `rerankSearchResults(...)` 用 Bailian `qwen3-rerank` 重排
9. `generateKnowledgeAnswer(...)` 基于重排后的片段生成最终回答
10. 写入 `dreambook_queries`
11. 返回“综合回答 + 引用片段 + 重排结果”给前端

#### 向量化实现

当前知识库 embedding 使用 SiliconFlow 的远端接口：

- 基础地址：`SILICONFLOW_BASE_URL`
- API Key：`SILICONFLOW_API_KEY`
- 模型：`EMBEDDING_MODEL`
- 维度：`EMBEDDING_DIMENSION`

当前默认对齐的是：

- `SILICONFLOW_BASE_URL=https://api.siliconflow.cn`
- `EMBEDDING_MODEL=Qwen/Qwen3-Embedding-8B`
- `EMBEDDING_DIMENSION=4096`

当前链路完全由 Next.js 侧直接调用，不依赖本地模型，也不依赖 Python 服务。

#### 重排序与最终回答

Dreambook 页面已经接上第二阶段能力：

- 重排序：Bailian `qwen3-rerank`
- 最终回答：默认 `CHAT_DEFAULT_MODEL`，当前默认是 `qwen3-max`

实现位置：

- `src/lib/knowledge-base/reranker.ts`
- `src/lib/knowledge-base/answer-generator.ts`

当前行为是：

- 如果配置了 `BAILIAN_API_KEY`，会执行重排序
- 如果配置了聊天模型对应 provider 的 API Key，会在检索结果上方生成综合回答
- 如果没有配置这些 key，页面仍可保留纯检索结果，但会提示 AI 综合回答不可用

#### 存储层

当前知识库存储改为 Supabase Postgres 的统一表：

- 表：`knowledge_chunks`
- 向量列：`embedding vector(4096)`
- 词项列：`search_tokens`
- FTS 生成列：`search_vector`

存储字段包含：

- `file_id`
- `file_name`
- `title`
- `text`
- `search_tokens`
- `chunk_id`
- `start`
- `end`
- `embedding`

前端展示字段：

- 标题显示 `title`
- 正文显示 `text`
- 标签显示 `file_name`

### 4.6 管理员知识库上传与处理

管理员页面：

- `src/app/[locale]/(protected)/admin/knowledge/page.tsx`
- `src/components/knowledge/knowledge-page-client.tsx`

核心表：

- `knowledge_files`

状态流转：

- `pending`
- `processing`
- `completed`
- `failed`

#### 当前前端实际走的是 API route

虽然仓库里存在一套 server action：

- `uploadKnowledgeFileAction`
- `processKnowledgeFileAction`
- `deleteKnowledgeFileAction`
- `getKnowledgeFilesAction`

但当前上传弹窗 `src/components/knowledge/upload-file-dialog-simple.tsx` 真正调用的是三段式 API：

1. `POST /api/knowledge/upload`
2. `POST /api/knowledge/create-record`
3. `POST /api/knowledge/process`

#### 上传阶段

`src/app/api/knowledge/upload/route.ts` 负责：

- 校验登录和管理员身份
- 限制大小 50MB
- 允许格式：
  - `.pdf`
  - `.txt`
  - `.md`
  - `.markdown`
  - `.epub`
  - `.docx`
- 把原文件写入 `uploads/knowledge`

#### 建记录阶段

`src/app/api/knowledge/create-record/route.ts` 负责把上传结果写入 `knowledge_files`。

#### 处理阶段

`src/app/api/knowledge/process/route.ts` 负责异步处理：

1. `parseFile(filePath)`
2. `chunkText(text, 512, 50)`
3. `embedBatch(texts)`
4. `addDocuments(...)`
5. 更新 `knowledge_files.status`

`addDocuments(...)` 现在会把 chunk、向量和词项检索字段统一写入 Supabase Postgres 的 `knowledge_chunks`，不再依赖本地 LanceDB 或 SQLite。

#### 文件解析

`src/lib/knowledge-base/parsers.ts` 当前支持：

- PDF：`pdf-parse`
- TXT：直接读取
- Markdown：渲染后去 HTML
- DOCX：从 zip 中抽 `word/document.xml`
- EPUB：解压并清洗 html/xhtml

#### 删除逻辑

`src/actions/delete-knowledge-file.ts` 会尝试：

1. 从 Postgres `knowledge_chunks` 删除 `file_id` 对应块
2. 删除物理文件
3. 删除数据库记录

### 4.7 支付与订阅

#### 价格定义

价格与计划定义在 `src/config/website.tsx`：

- `free`
- `pro`
  - 月付 `$9.90`
  - 年付 `$99`
- `lifetime`
  - 一次性 `$199`

积分包还定义了：

- `basic`
- `standard`
- `premium`
- `enterprise`

#### 创建支付

对应 action：

- `src/actions/create-checkout-session.ts`
- `src/actions/create-credit-checkout-session.ts`
- `src/actions/create-customer-portal-session.ts`

主要流程：

1. 根据 plan / package 校验价格
2. 自动创建或复用 Stripe customer
3. 按 locale 生成 success / cancel URL
4. 跳转 Stripe Checkout

#### 支付结果页

`src/components/payment/payment-card.tsx` 会在 `/payment` 页面轮询：

- `checkPaymentCompletionAction`

直到：

- 支付成功
- 超时

然后根据回调地址跳回：

- `/settings/billing`
- `/settings/credits`

#### Webhook

Webhook 入口：

- `src/app/api/webhooks/stripe/route.ts`

核心实现：

- `src/payment/provider/stripe.ts`

当前 webhook 架构是两段式：

1. `checkout.session.completed`
   - 先创建本地 `payment` 记录
   - `paid = false`
2. `invoice.paid`
   - 再把记录标为已支付
   - 发放对应权益

订阅还会同步：

- `customer.subscription.updated`
- `customer.subscription.deleted`

这样可以把本地 `payment` 表维持为主业务状态源。

### 4.8 积分系统

积分相关表：

- `user_credit`
- `credit_transaction`

核心逻辑：

- `src/credits/credits.ts`
- `src/credits/distribute.ts`

实现内容包括：

- 查询余额
- 写入积分流水
- 增发积分
- FIFO 消耗积分
- 过期积分处理
- 批量发放免费 / 终身 / 年付用户月度积分

相关 action：

- `get-credit-balance.ts`
- `get-credit-stats.ts`
- `get-credit-transactions.ts`
- `consume-credits.ts`
- `get-current-plan.ts`

#### 重要现状

虽然积分系统实现很完整，但 UI 和很多发放行为受以下开关控制：

- `websiteConfig.credits.enableCredits`
- 其值来自 `NEXT_PUBLIC_DEMO_WEBSITE === 'true'`

也就是说，默认情况下：

- 积分页可能会被重定向
- 顶部积分入口不会显示
- 注册赠送积分、免费月度积分、部分支付后积分发放不会启用

#### 定时分发

提供两种入口：

- API：`GET /api/distribute-credits`
- 脚本：`pnpm distribute-credits`

其中 API 入口使用 Basic Auth 校验。

### 4.9 Newsletter、邮件、通知

#### Newsletter

Provider 入口：

- `src/newsletter/index.ts`

支持：

- Resend
- Beehiiv

相关 action：

- `subscribe-newsletter.ts`
- `unsubscribe-newsletter.ts`
- `check-newsletter-status.ts`

用户创建时也会自动尝试订阅。

#### 邮件

邮件入口：

- `src/mail/index.ts`

当前模板包括：

- 验证邮件
- 重置密码
- newsletter 欢迎邮件
- 联系表单通知

所有模板都按 locale 渲染。

#### 通知

通知入口：

- `src/notification/index.ts`

当前用于：

- 支付通知
- 月度积分分发通知

支持：

- Discord
- Feishu

### 4.10 内容系统

`content/` 目录当前真实在用的内容有：

- `content/blog`
- `content/changelog`
- `content/pages`
- `content/author`
- `content/category`

也就是说：

- 博客可用
- Changelog 可用
- 法务页可用

但是文档系统存在明显残留：

- `source.config.ts` 仍然配置了 `content/docs`
- `websiteConfig.docs.enable` 当前已关闭
- 当前仓库里并没有 `content/docs/`
- `src/app` 里也没有实际 docs 页面路由文件

结论：文档系统脚手架还在，但当前项目并没有真正维护中的产品文档内容，所以展示入口已关闭。

## 5. 数据模型总览

### Better Auth 相关

由 `src/db/auth.schema.ts` 维护，核心表包括：

- `user`
- `session`
- `account`
- `verification`
- `apikey`

### 业务表

定义在 `src/db/app.schema.ts`：

| 表名 | 用途 |
| --- | --- |
| `payment` | Stripe 订阅/一次性支付记录 |
| `user_credit` | 当前积分余额 |
| `credit_transaction` | 积分流水与剩余额度 |
| `dreams` | 用户梦境日志 |
| `knowledge_files` | 上传知识库文件及处理状态 |
| `dreambook_queries` | Dreambook 查询次数限制与统计 |

## 6. 当前仓库中并存的遗留实现

当前最需要明确的是：知识库与 AI 检索不是只有一套实现。

### 当前主链路

主链路是这套：

- `src/actions/search-knowledge.ts`
- `src/lib/knowledge-base/*`
- `src/components/dreambook/dreambook-explorer-new.tsx`

这是当前 `/dreambook` 页面真正使用的代码。

### 遗留 / 实验链路

仓库中还保留了一套没有接到当前主页面的实现：

- `rag/*`

这套实现的特点：

- 还保留了 Python RAG 服务对接口

当前与主页面无关的 TypeScript 实验入口已经清理，只剩 Python 侧 `rag/*` 作为历史保留目录。

## 7. 需要注意的实现现状

### 7.1 当前 README 已经从模板描述改为项目现状入口

原 `README.md` 还是通用 SaaS 模板介绍，与仓库实际功能不一致，已改成当前项目入口说明。

### 7.2 知识库管理存在双入口

仓库中同时存在：

- server action 版上传/处理
- API route 版上传/处理

当前 UI 走的是 API route 版，不是 action 版。

### 7.3 文档系统与内容系统不完全一致

当前 repo 有博客、法务页、changelog 的 MDX 内容，但没有真正维护中的 `content/docs` 文档源。

### 7.4 管理员提权接口存在风险

`src/app/api/admin/set-role/route.ts` 目前只有参数校验，没有做登录校验或管理员权限校验。

从实现现状看，这个接口应视为高风险内部调试入口，后续如果继续保留，至少需要补上：

1. 登录校验
2. 管理员权限校验
3. 审计日志

## 8. 推荐的阅读顺序

如果要继续维护这个项目，建议按下面顺序进入代码：

1. `src/config/website.tsx`
2. `src/routes.ts`
3. `src/lib/auth.ts`
4. `src/db/app.schema.ts`
5. `src/actions/*`
6. `src/lib/knowledge-base/*`
7. `src/payment/provider/stripe.ts`
8. `src/credits/*`

这样能最快建立对当前业务实现的正确认知。
