# NewCallCall Web Admin

基于 [shadcn-admin](https://github.com/satnaing/shadcn-admin)（Vite + TanStack Router）的 NewCallCall 管理端 SPA。

## 技术栈

- **构建：** Vite 8，`base: /admin/`
- **路由：** TanStack Router，`basepath: /admin`
- **UI：** shadcn/ui + Tailwind CSS
- **数据：** TanStack Query + `fetch`（`src/lib/api-client.ts`）
- **认证：** HTTP Basic Auth（`sessionStorage` 键 `ncc_basic_auth`）

## 本地开发

```bash
cd web-admin
pnpm install
pnpm run dev
```

浏览器访问 [http://localhost:5173/admin/](http://localhost:5173/admin/)。

开发服务器会将 `/admin/api` 与 `/admin/ws` 代理到 `http://127.0.0.1:8080`（需先启动 FastAPI 后端）。

## 环境变量

复制 `.env.example` 为 `.env`：

```bash
VITE_API_BASE=/admin/api
```

## 构建与部署

```bash
pnpm run build
```

产物输出到 `out/` 目录。nginx 配置示例：

```nginx
location /admin/ {
    alias /opt/ncc/admin/;
    try_files $uri $uri/ /admin/index.html;
}
```

## 目录说明

| 路径 | 说明 |
|------|------|
| `src/features/ncc-*` | 业务页面（从旧 Next.js 迁移） |
| `src/routes/_authenticated/` | 需登录的路由 |
| `src/components/ncc/` | NCC 共享组件 |
| `_legacy-next/` | 旧 Next.js 源码备份（参考用） |

## 后端依赖

管理端 API 由 FastAPI 提供（`/admin/api/*`）。登录凭证与后端 `.env` 中 `NEWCALLCALL_ADMIN_BASIC_PASS` 一致；若该变量为空，可匿名访问（开发环境）。
