# 手机端把 MRS 库传到 GitHub（不需 PAT 发给别人）

你在手机上，推荐顺序：**Working Copy（iOS）/ MGit·GitJournal 等（Android）**，或 **GitHub 官方 App + 网页建库**。
纯浏览器上传完整项目较吃力，可分两步：先上知识库，回电脑再推完整代码。

---

## 一、先在手机浏览器建空仓库（1 分钟）

1. 手机浏览器打开：https://github.com/new  
2. 登录你的 GitHub  
3. 填写：
   - **Repository name**：`mrs-multi-ai-math`
   - **Public**
   - **不要**勾选 Add a README / gitignore / license（保持空仓库）
4. 点 **Create repository**
5. 建好后地址形如：  
   `https://github.com/你的用户名/mrs-multi-ai-math`

---

## 二、从 Arena 下载文件到手机

在本对话/工作区下载这两个（都能在手机下）：

| 文件 | 大小 | 用途 |
|------|------|------|
| `mrs-multi-ai-math-github.zip` | ~400KB | **完整项目**（推荐最终上传这个） |
| `mrs-multi-ai-math.bundle` | ~250KB | 带 git 历史（可选，App 里 clone） |

下载位置一般在「文件 / Downloads」。

---

## 三、推荐做法（按手机系统选）

### 方案 A — iPhone / iPad：Working Copy（最省事）

1. App Store 安装 **Working Copy**（推送公开库可用免费功能；大量 push 有时需付费，可先试）  
2. 打开 Working Copy → **+** → **Unzip…** / 导入 zip  
   - 或：把 `mrs-multi-ai-math-github.zip` 用「文件」App 分享到 Working Copy  
3. 解压得到文件夹 `mrs-multi-ai-math`  
4. 若解压后没有 git：在该目录 **Initialize Repository**，全部 Stage，Commit：  
   `feat: MRS math lab initial`  
5. **Remotes → Add Remote**  
   - URL：`https://github.com/你的用户名/mrs-multi-ai-math.git`  
6. **Push**  
7. 按提示用浏览器登录 GitHub 授权（Safari 登录即可，**token 留在手机 App 里，不用发给我**）

### 方案 B — Android：MGit / GitJournal / GitDex 等

1. 安装 **MGit**（或你熟悉的 Git 客户端）  
2. 用文件管理器解压 `mrs-multi-ai-math-github.zip`  
3. MGit → 添加本地仓库 → 指向解压目录  
4. 若无 `.git`：先 init + add + commit（部分 App 有「Create commit」）  
5. 添加 remote：`https://github.com/你的用户名/mrs-multi-ai-math.git`  
6. Push，用 GitHub 账号登录授权  

### 方案 C — 只有 GitHub 官方 App + 手机浏览器（无本地 git）

GitHub App **不能**方便地整包 push 任意本地文件夹。可用网页「Upload files」，但有限制：

1. 手机浏览器打开你的空仓库页  
2. 点 **Add file → Upload files**  
3. 从解压后的文件夹里**分批选文件上传**（一次别选太多，易失败）  
4. 保持**相对路径**：GitHub 网页上传时，若只能平铺文件名，**路径会丢**，目录结构会坏掉  

因此：**不推荐**方案 C 传完整 `frontend/src/...` 树。  
若只能用网页，请至少先上传「知识库包」（见方案 D），完整代码等有电脑或 Working Copy 再推。

### 方案 D — 手机先只传「题库 + 旗舰题」（网页也能搞定）

若你现在只想先把 **100 圆覆盖题** 和问题库亮到 GitHub：

1. 建空仓库 `mrs-multi-ai-math`（同上）  
2. 下载并解压 zip 后，用网页 Upload **优先传这些**：

```
README.md
LICENSE
knowledge/challenges/unit-disk-100-circle-covering.png
knowledge/challenges/README.md
knowledge/problems/unit-disk-100-circle-covering.md
knowledge/problems/assets/unit-disk-100-circle-covering.png
knowledge/problems/*.md   （其余 20 个 md，可分批）
docs/
agents/roles.yaml
```

3. Commit message：`docs: add MRS problem library and 100-circle challenge`  
4. 完整 `backend/` + `frontend/` 等有电脑时再 `git push` 补齐  

> 注意：网页上传**很难**一次建好嵌套目录。  
> 技巧：在电脑或 Working Copy 里 push 一次最稳；手机网页适合「少文件、扁目录」。

---

## 四、zip 解压后你应看到的结构（核对用）

打开解压目录，顶层应是：

```
mrs-multi-ai-math/
  README.md
  LICENSE
  package.json
  .gitignore
  agents/
  backend/
  frontend/
  knowledge/
  docs/
  scripts/
```

其中旗舰题：

- `knowledge/problems/unit-disk-100-circle-covering.md`
- `knowledge/challenges/unit-disk-100-circle-covering.png`

**不要**上传：`node_modules`、`data/*.db`（zip 里本来就没有）。

---

## 五、推送成功后在手机上检查

浏览器打开：

`https://github.com/你的用户名/mrs-multi-ai-math`

应能看到 README，并能点进：

`knowledge/problems/unit-disk-100-circle-covering.md`

---

## 六、手机上跑不跑得起来？

完整前后端需要 Node，**手机浏览器一般跑不了** dev server。  
手机负责：**建库 + 上传源码**；运行在电脑 / 云主机 / 以后再弄。

---

## 七、最短路径（建议你照做）

1. 浏览器建空库 `mrs-multi-ai-math`  
2. 下载 `mrs-multi-ai-math-github.zip`  
3. iOS 用 **Working Copy** 导入 zip → commit → remote → push  
4. Android 用 **MGit** 同样操作  
5. 把最终仓库链接发给自己收藏即可  

**全程不用把 PAT 发给任何人。**
