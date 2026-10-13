[RELEASING.md](https://github.com/user-attachments/files/33396835/RELEASING.md)
# 从零开始：把插件发布到 GitHub，并提交到 Zotero 中文社区

这份文档写给第一次发布插件的人。全程只需要一个 GitHub 账号，不需要懂编程。

---

## 0. 先弄明白几个词

- **仓库（Repository）**：你在 GitHub 上的一个"文件夹"，存放插件的全部文件，别人可以浏览和下载。
- **Release（发行版）**：仓库里的"发布页面"，用来挂出可下载的 `.xpi` 安装包。
- **tag（标签）**：给某次提交起的名字，例如 `v1.0.1`。**发版 = 打一个 tag**；
  本仓库的自动化流程就是靠 tag 触发的。
- **Actions**：GitHub 自带的自动化机器人。本项目已配置好：**你只要打 tag，
  它自动打包 xpi、发 Release、更新 update.json**。
- **update.json**：Zotero 用来检查更新的清单文件。Zotero 会定期读取它，
  发现新版本后提示用户更新。

**关于"上传到 Zotero"**：Zotero 官方**没有**插件商店，插件不能"上传到 Zotero 官方"。
实际的发布渠道是两个：

1. **GitHub**（你自己托管，用户从这里下载、以及自动更新）；
2. **Zotero 中文社区插件目录**（仓库 `zotero-chinese/zotero-plugins`）——
   把仓库登记进去后，插件会出现在 <https://zotero-chinese.com/plugins>，
   以及"Zotero 插件商店 / Add-on Market"这类客户端里。

---

## 1. 准备

- GitHub 账号（<https://github.com/signup>，免费）
- 本目录的全部文件（就是你现在看到的这一套）
- 三选一的提交方式：
  - **方式 A：GitHub Desktop**（推荐，图形界面，隐藏文件不会漏）→ <https://desktop.github.com>
  - 方式 B：网页上传（不装任何软件，但 `.` 开头的文件需要手工新建）
  - 方式 C：命令行 Git（熟悉命令行的话最快）

> **重要**：只上传本目录（插件源码）。不要把个人数据（Zotero 数据库、你导出的作者名单、
> 测试脚本目录）一起传上去。

---

## 2. 方式 A：用 GitHub Desktop 上传（推荐）

1. 打开 GitHub Desktop → `File` → `New repository…`
2. 填写：
   - Name：`zotero-pinyin-sort`（或你喜欢的名字）
   - Local path：选一个空文件夹的上级目录
   - 勾选 `Initialize this repository with a README`（先勾着没关系）
   - License：可以选 `GNU Affero General Public License v3.0`
     （仓库里已经有 LICENSE 文件，这里只是 GitHub 的展示信息）
3. 创建后点 `Repository` → `Show in Explorer`，把**本目录的全部内容**复制进去，
   同名文件选择替换。
4. 回到 GitHub Desktop，左下角填一句提交说明（例如 `chore: 初始版本`），
   点 `Commit to main`，再点右上角 `Publish repository`。
5. **发布前把 `Private` 的勾去掉**（插件要让别人下载，必须是公开仓库）。

完成后打开 `https://github.com/<你的用户名>/zotero-pinyin-sort`，应能看到全部文件。

> 看不到 `.github`、`.gitignore` 不要紧（Windows 资源管理器有时不显示以点开头的项目），
> 到 GitHub 网页上确认仓库里有 `.github/workflows/release.yml` 这个文件即可。

**注意**：源码里 `manifest.json` 的 `update_url` 是 `OWNER/REPO` 占位，
**不用手动改**——发版时自动化流程会把它替换成你仓库的真实地址。

---

## 3. 方式 B：全程网页上传

1. 打开 <https://github.com/new>，填仓库名，选择 **Public**，点 `Create repository`。
2. 进入仓库页面 → `Add file` → `Upload files` → 把本目录里的文件拖进去 →
   下方填提交说明 → `Commit changes`。
   - 提示：Windows 资源管理器默认把 `.` 开头的项目当作隐藏项，拖拽时可能漏掉，
     所以 `.gitignore` 和 `.github/workflows/release.yml` 建议按下一条手工新建。
3. 手工创建 `.gitignore`：`Add file` → `Create new file` → 文件名输入 `.gitignore` →
   内容从本目录的 `.gitignore` 复制粘贴 → `Commit changes`。
4. 手工创建自动化文件：`Add file` → `Create new file` → 文件名输入
   `.github/workflows/release.yml`（输入斜杠会自动建目录）→
   内容从本目录的 `.github/workflows/release.yml` 复制粘贴 → `Commit changes`。
5. 确认仓库根目录下有 `manifest.json`、`bootstrap.js`、`content/` 等文件。

---

## 4. 方式 C：命令行 Git

```bash
cd 本目录
git init
git add .
git commit -m "chore: 初始版本"
git branch -M main
git remote add origin https://github.com/<你的用户名>/<仓库名>.git
git push -u origin main
```

---

## 5. 第一次发版（打 tag）

### 5.1 网页操作（最简单）

1. 打开仓库页面右侧的 `Releases` → `Draft a new release`。
2. `Choose a tag` → 输入 `v1.0.1` → 点 `Create new tag: v1.0.1 on publish`。
   （**tag 名要和 `manifest.json` 里的 version 一致，前面加一个小写 v**。）
3. 标题写 `v1.0.1`，说明可以留空或写一句更新摘要，点 `Publish release`。

### 5.2 命令行

```bash
git tag v1.0.1
git push origin main --tags
```

### 5.3 等机器人干活（约 1 分钟）

打开仓库的 **Actions** 页签，会看到一条 `Release` 任务在运行。它会自动：

1. 把 `manifest.json` 里的 `update_url` 指向
   `https://github.com/<你>/<仓库>/releases/download/release/update.json`；
2. 打包出 `pinyin-for-zotero.xpi`（只包含插件文件）；
3. 在 `v1.0.1` 这个 Release 上附上该 xpi；
4. 新建一个固定标签 `release` 的 Release，里面放 `update.json`（以后每次发版只更新它）。
   它会被标记为 **Pre-release**——这是刻意的：否则它会抢走 `vX.Y.Z` 的 "Latest" 徽章，
   社区收录工具就会把版本号抓错。**已装的用户不受影响**，Zotero 只按固定网址读取 `update.json`。

### 5.4 检查成果

- `Releases` 页面能看到版本号发行版，里面有 `pinyin-for-zotero.xpi` 可下载；
- 还有一个标题为"更新清单（请勿删除）"的 `release` 发行版，里面有 `update.json`，
  标记为 **Pre-release**（正常现象），**不要删除它**——Zotero 的自动更新靠它。
  真正的 "Latest" 徽章应该在 `v1.0.1` 上。

> 第一次运行时如果 Actions 提示需要授权/启用，按提示允许即可（个人仓库默认是开启的）。

---

## 6. 在 Zotero 里测试你自己发布的包

1. Zotero：工具 → 插件 → 右上角齿轮 → `Install Plugin From File…`，
   选择刚从 Release 下载的 xpi，重启 Zotero，确认插件是**启用**状态。
2. 库里放两条中文作者条目（例如"曾向红"和"陈明霞"），点"创建者"列排序：
   - 曾向红排在陈明霞**之后** → 生效；
   - 排在毕洪业与陈明霞**之间** → 没生效，去看
     「帮助 → Debug Output Logging」里 `CreatorPinyinSort:` 开头的日志。
3. Word / WPS 里点一次 **Refresh**，检查参考文献表的顺序。

---

## 7. 以后更新版本怎么发

1. 打开 `manifest.json`，把 `"version": "1.0.1"` 改成新版本号，例如 `1.0.2`。
2. 在 `CHANGELOG.md` 顶部加一段本次更新说明（这段文字会出现在 Release 说明里）。
3. 提交改动（GitHub Desktop：填说明 → Commit → Push；或命令行 `git commit` + `git push`）。
4. 打新 tag 并推送：网页上再走一次第 5.1 步（tag 填 `v1.0.2`），
   或命令行 `git tag v1.0.2 && git push origin main --tags`。
5. 机器人会自动打包发布，并更新 `update.json`。
6. 已安装旧版本的用户：Zotero 会定期检查更新并提示；用户也可以手动到插件管理器的
   齿轮菜单里点 `Check for Updates`。

> 日常发新版本**不需要**再去社区仓库提交一次：那边的收集器会自动抓取你仓库的最新稳定版
> （见第 8 节）。只有当**兼容的 Zotero 版本范围**发生变化（例如支持到 Zotero 11）时，
> 才需要去更新目录里的信息。

---

## 8. 提交到 Zotero 中文社区插件目录

仓库地址：<https://github.com/zotero-chinese/zotero-plugins>

**方式 A（推荐，省事）**：开一个 issue，内容照抄下面这段（把链接换成你的）：

```
插件仓库：https://github.com/<你的用户名>/<仓库名>
简介：修正 Zotero 中文作者的拼音排序（多音字姓氏，如“曾”），保持中文条目聚成一堆；
      同时修正 WPS/Word 刷新后的参考文献与正文引文顺序。
发布页：https://github.com/<你的用户名>/<仓库名>/releases
```

**方式 B（提 PR，进阶）**：在 `src/plugins.ts` 里按仓库名字母顺序加一条：

```ts
{
  repo: '<你的用户名>/<仓库名>',
  tags: ['sort'],
  releases: [],
  discoverReleases: true,
},
```

> 该仓库的 README 说明现在接受新插件提交（issue 或 PR 均可），
> 但仓库标题标注了"暂缓更新"，处理速度可能较慢，提交后耐心等待即可。
> 审核合并后，插件会出现在 zotero-chinese.com 的插件商店，
> 以及使用同一数据源的"Zotero 插件商店 / Add-on Market"客户端里。

可选：也可以到 Zotero 官方论坛的 Plugins 板块发一个介绍帖（英文），让更多国际用户看到。

---

## 9. 常见问题排查

- **Actions 里没有任务**：检查 `.github/workflows/release.yml` 是否已上传到仓库；
  工作流只在**打 tag** 时触发。
- **Actions 失败（红叉）**：点进失败的任务看日志最后几行（通常是版本号或 tag 格式问题）；
  修好后重新打一个 tag 再试。
- **Release 里没有 xpi**：看 Actions 日志里"发布或更新该版本的 Release"那一步的报错。
- **社区目录还没收录**：先确认仓库是**公开**且已有 Release；再确认 issue/PR 已提交、等待审核。
- **Zotero 提示无法安装 / 不兼容**：本插件要求 **Zotero 10**（清单里
  `strict_min_version` 为 `10.0`）；确认你的 Zotero 版本与 `strict_max_version`
  （见 [COMPATIBILITY.md](COMPATIBILITY.md) 第二节）。
- **Releases 里那个"更新清单"抢了 Latest 徽章**：打开该发行版 → 右上角铅笔图标
  （Edit release）→ 勾选 `Set as a pre-release` → `Update release`。
  徽章会自动回到版本号发行版上。（本仓库的自动化脚本已修正，新版本不会再出现。）
- **用户装不上旧版本**：Zotero 可能拒绝"降级安装"；让用户先在插件列表里移除新版本，
  再安装旧版本。
- **装了但排序没变化**：按 [COMPATIBILITY.md](COMPATIBILITY.md) 第五节的"自检方法"看日志与开关。
- **想回滚到旧版**：在插件列表里移除当前版本，再安装旧 tag 对应的 xpi。

---

## 10. 发版前的检查清单

- [ ] `manifest.json` 的 `version` 已改成新版本号，且与要打的 tag 一致（`1.0.1` ↔ `v1.0.1`）
- [ ] `CHANGELOG.md` 已写本次更新说明
- [ ] 仓库里**没有**个人数据文件（数据库、导出名单、测试目录）
- [ ] `LICENSE` 与 `THIRD-PARTY-NOTICES.txt` 仍在仓库里（对外发布需要）
- [ ] 有条件的话，在本机跑一次排序自检（见 [COMPATIBILITY.md](COMPATIBILITY.md) 第五节）

---

## 11. Zotero 升级后要做什么

1. 在 `manifest.json` 里放宽 `strict_max_version`（例如 Zotero 11 发布后改成 `"11.*"`）。
2. 在本机的新版 Zotero 里实测："创建者"列排序 + WPS/Word 刷新各验证一次。
3. 若日志里出现 `CreatorPinyinSort: 未找到…` / `未能定位…` 之类的提示，说明 Zotero
   内部结构变了，需要按提示调整 `content/main.js` 里对应的补丁点
   （见 [COMPATIBILITY.md](COMPATIBILITY.md) 第四节）。
4. 按第 7 节的流程发一个新版本。
