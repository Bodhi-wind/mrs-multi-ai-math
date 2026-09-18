# 手动创建 GitHub 仓库并上传（无需 PAT）

目标仓库名建议：`mrs-multi-ai-math`（Public）

本仓库本地已初始化 git，最新提交在 `main`。你**不需要**把 `node_modules/` 或 `data/*.db` 上传到 GitHub。

---

## 方式 A（推荐）：本机用 Git 推送

适合：你的电脑已登录 GitHub（GitHub Desktop / `gh auth login` / SSH key）。

### 1. 在 GitHub 网页新建空仓库

1. 打开 https://github.com/new
2. Repository name: `mrs-multi-ai-math`
3. Public
4. **不要**勾选 Add README / .gitignore / license（保持空仓库，避免首次 push 冲突）
5. Create repository

### 2. 获取本项目代码

任选其一：

- **ZIP**：解压 `mrs-multi-ai-math-github.zip`（与 git archive 内容一致）
- **Bundle**：`git clone mrs-multi-ai-math.bundle mrs-multi-ai-math`
- **若已在 Arena 工作区**：直接使用目录 `mrs-math-lab/`

### 3. 关联远程并推送

```bash
cd mrs-multi-ai-math   # 或 mrs-math-lab
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/<你的用户名>/mrs-multi-ai-math.git
# 若用 SSH：
# git remote add origin git@github.com:<你的用户名>/mrs-multi-ai-math.git

git branch -M main
git push -u origin main
```

浏览器登录 / GitHub Desktop / `gh auth login` 均可完成认证，**不必把 PAT 发给任何人**。

### 4. 推送后建议

- About 描述：`MRS Multi-Role System · 多AI协作数学前沿攻克库`
- Topics：`mathematics`, `multi-agent`, `lean`, `research`, `discrete-geometry`, `open-problems`
- 可在 README 顶部加徽章（可选）

---

## 方式 B：网页 Upload files（无 git）

适合：临时上传、不熟悉 git。

1. 仍按方式 A 第 1 步建**空仓库**（或建库时勾选 README 也行）
2. 解压 `mrs-multi-ai-math-github.zip`
3. 打开仓库页 → **Add file → Upload files**
4. 将解压后的**文件夹内层文件**拖入（保持相对路径；GitHub 网页一次上传有数量/大小限制，大项目更推荐方式 A）
5. Commit message: `feat: initial import of MRS math lab`
6. Commit changes

> 网页上传对 50+ 文件较麻烦，优先方式 A。

---

## 方式 C：GitHub Desktop

1. 解压 ZIP 或 clone bundle 到本地
2. GitHub Desktop → File → Add Local Repository
3. Publish repository → 名称 `mrs-multi-ai-math` → Public → Publish

---

## 不要上传的内容

| 路径 | 原因 |
|------|------|
| `**/node_modules/` | 体积大，由 `npm install` 恢复 |
| `data/*.db*` | 本地 SQLite，运行 `npm run seed` 重建 |
| `.env` / 任何 token | 密钥 |
| `dist/` / 构建缓存 | 可再生成 |

`.gitignore` 已排除上述路径。

---

## 上传后他人如何运行

```bash
git clone https://github.com/<你的用户名>/mrs-multi-ai-math.git
cd mrs-multi-ai-math
cd backend && npm install && npm run seed && npm run dev   # :8787
# 新终端
cd frontend && npm install && npm run dev                 # :5173
```

---

## 仓库应有的顶层结构

```
mrs-multi-ai-math/
├── README.md
├── LICENSE
├── package.json
├── .gitignore
├── agents/
│   └── roles.yaml
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── db.ts
│       ├── index.ts
│       └── seed.ts
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx
│       ├── api.ts
│       ├── components.tsx
│       ├── markdown.tsx
│       ├── main.tsx
│       └── index.css
├── knowledge/
│   ├── challenges/
│   │   ├── README.md
│   │   └── unit-disk-100-circle-covering.png
│   └── problems/
│       ├── *.md                    # 21 个问题
│       └── assets/
│           └── unit-disk-100-circle-covering.png
├── docs/
│   ├── ARCHITECTURE.md
│   ├── USAGE_ZH.md
│   └── GITHUB_UPLOAD_ZH.md
└── scripts/
    └── start.sh
```

## 旗舰问题入口

- 题面：`knowledge/problems/unit-disk-100-circle-covering.md`
- 原图：`knowledge/challenges/unit-disk-100-circle-covering.png`
