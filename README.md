# Dreambook

这是一个基于 Next.js 16 的梦境记录与解梦检索项目，核心业务围绕以下几块展开：

- 梦境日志记录、编辑、删除、AI 分析
- Dreambook 知识库上传、分块、向量化、检索
- Stripe 订阅/一次性购买
- Better Auth 登录体系、后台用户管理、Newsletter/邮件通知

## 先看哪里

- 当前项目实现总览：[`CURRENT_IMPLEMENTATION.md`](./CURRENT_IMPLEMENTATION.md)
- 代理协作约定：[`AGENTS.md`](./AGENTS.md)

## 常用命令

```bash
pnpm dev
pnpm build
pnpm lint
pnpm format
pnpm db:generate
pnpm db:migrate
pnpm content
```

## 当前文档策略

仓库里历史上积累了大量阶段性报告、交付总结、模板说明和外部资料副本。当前只保留：

- `README.md` 作为入口
- `CURRENT_IMPLEMENTATION.md` 作为基于代码现状的功能实现文档
- `AGENTS.md` 作为协作说明

其余与当前实现重复或明显过时的说明文档已清理。

## License

详见 [`LICENSE`](./LICENSE)。
