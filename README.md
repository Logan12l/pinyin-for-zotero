# 作者拼音排序（Zotero 插件）

让 Zotero 里中文作者的排序按拼音生效，并修正多音字姓氏带来的错位——
比如"曾"作姓氏读 zēng，但系统按常用读音 céng 排，结果跑到 C 区。

**适用 Zotero 10（实测 10.0.6 / Windows）。** 在 Zotero 7 / 8 / 9 上无法安装——
原因见下面的"已知边界"。

## 它解决什么问题

1. **多音字姓氏排错**：曾、单、仇、区、查、解、乐、朴、覃、尉迟……这些姓氏的系统读音与姓氏读音不同，
   Zotero 用系统的拼音规则排序时会把它们放到错误的位置。
2. **WPS / Word 刷新后参考文献顺序不对**：文档里点 Refresh 后，参考文献表与同一处引文簇的顺序
   同样会踩这个坑。

## 特性

- **Zotero 主界面**：点"创建者"列排序时，中文条目仍整体在前、西文在后（保持 Zotero 原生分组），
  只把中文块内部改成按修正拼音排序——曾向红会出现在 Z 位置。
- **WPS / Word**：点 Refresh 更新文档后，参考文献表与引文簇顺序同样按修正拼音排。
- **其它列**（标题、年份等）保持 Zotero 原生行为不变。
- 不改任何元数据、不改显示文本、不联网、不收集数据：条目里的作者还是中文，
  参考文献内容一字不变，只是顺序正确。

## 安装

1. 从 [Releases](../../releases) 下载最新的 `zotero-pinyin-column.xpi`
2. Zotero 菜单：工具 → 插件（Tools → Add-ons）
3. 右上角齿轮 → Install Plugin From File… → 选择刚下载的 xpi
4. 重启 Zotero，并在插件列表里确认它是**启用**状态

装好后在 Zotero 里点"创建者"列排序即可看到效果；WPS / Word 里需要点一次 **Refresh** 才会重排文档内容。

## 开关（可选）

在 `编辑 → 设置 → 高级 → 配置编辑器` 里调整（改完需重启 Zotero）：

| 设置项 | 默认 | 作用 |
|--------|------|------|
| `extensions.zotero.creatorPinyinSort.fixItemTreeSorting` | true | 接管条目列表"创建者"列的排序比较 |
| `extensions.zotero.creatorPinyinSort.fixCiteprocSorting` | true | 接管文档刷新（WPS/Word）的参考文献与引文排序 |
| `extensions.zotero.creatorPinyinSort.extraCorrections` | 空 | 补充读音修正表，形如 `区=ou,覃=qin` |

把前两项设为 `false` 即可完全恢复 Zotero 原生排序行为。

## 读音修正范围

- 内置《百家姓》413 个单姓 + 60 个复姓的姓氏读音表，并补充常见多音字姓氏：
  曾→zeng、单→shan、仇→qiu、区→ou、查→zha、解→xie、乐→yue、朴→piao、覃→qin、
  尉迟→yuchi、种→chong、折→she、句→gou、员→yun、召→shao、秘→bi 等。
- 名字的其余部分按常用读音转拼音；查不到读音的生僻字保持原字符（不影响 Zotero 使用）。
- 西文姓名原样保留；中英文之间的前后关系完全按 Zotero 原生规则，插件不介入。

## 已知边界

- **版本范围：只支持 Zotero 10**（清单声明 `strict_min_version: 10.0`、`strict_max_version: 10.*`；
  实测环境 Zotero 10.0.6 / Windows）。
  原因：条目列表排序所依赖的 `ItemTreeRowProvider._compareField` 是 Zotero 10 才有的内部结构——
  我逐版本核查了源码（7.0.32 / 8.0.5 / 9.0.6 / 10.0.6），该标记在 7–9 的**全库中 0 命中**，
  只有 10.0.6 存在。为避免 7–9 用户装上后核心功能不生效，插件主动不允许在 7–9 安装。
  Zotero 升级到 11 及以后同样会被判为"不兼容"，需要更新插件（放宽版本上限）后才能继续使用。
- 样式的排序语言不是中文时（如 `default-locale-sort="en-US"`）不介入，保持 Zotero 原样。
- 若开启了 `extensions.zotero.cite.useCiteprocRs`（改用 citeproc-rs 引擎），文档侧修复不生效，
  插件会在调试日志里提示。
- 中文/西文"谁在前"完全沿用 Zotero 原生规则（中文界面下中文在前，英文界面下中文在后），
  插件只修正中文块内部的顺序，不改变分组。
- 只修正**姓氏**的读音；名字中间的多音字按常用读音处理（例如"李重光"的"重"）。
  姓氏读音表覆盖 413 个单姓 + 60 个复姓，另有 10 条多音字补充，可用偏好自行追加。
- 插件通过包装 Zotero 内部的排序函数实现（`ItemTreeRowProvider._compareField`、
  citeproc 的 `CSL.getSortKeys` / `CSL.getSortCompare`）。若未来 Zotero 大版本改动内部结构，
  补丁可能失效——插件对探测失败做了保护：只写调试日志、不修改行为、不影响 Zotero 使用，
  但需要跟随 Zotero 版本更新插件。

> 完整的兼容性分析、依赖的内部接口与失效后果、自检排查方法、性能与隐私说明，
> 见 **[COMPATIBILITY.md](COMPATIBILITY.md)**。

## 隐私

- 不联网、不上传任何数据、不读取文献内容。
- 不修改你的元数据、附件或文档；只在内存里计算排序键（不落盘）。
- 唯一改动的偏好项是上面表格里的三个开关；卸载后自动恢复。

## 开发与构建

源码即成品（纯 JavaScript，无编译步骤）：`manifest.json` + `bootstrap.js` + `prefs.js` + `content/`。
打包与发版流程（从建仓库到提交社区，含图文步骤）见 [RELEASING.md](RELEASING.md)；
版本变更见 [CHANGELOG.md](CHANGELOG.md)。

## 许可证

- 本插件代码：[GNU AGPL-3.0](LICENSE)
- 内嵌第三方数据（node-pinyin，MIT）的声明与许可全文：[THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)

本插件是独立的第三方插件，与 Zotero 官方无从属关系；"Zotero" 为其各自所有者的商标，
此处仅用于说明兼容性。
