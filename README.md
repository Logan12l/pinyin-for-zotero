[README.md](https://github.com/user-attachments/files/33396304/README.md)
# pinyin-for-zotero

帮助识别中文文献特殊姓氏：让 Zotero 里中文作者的排序按拼音生效。

比如"曾"作姓氏读 zēng，系统却按常用读音 céng 排，结果曾向红跑到 C 区——
装上本插件后它会出现在 Z 位置，中文条目仍然聚成一堆。

**仅支持 Zotero 10**（实测 10.0.6 / Windows）。

## 功能

- **Zotero 主界面**：点"创建者"列排序时，中文条目整体聚拢（在前），块内按修正拼音排列。
- **WPS / Word**：点一次 Refresh 刷新文档，参考文献表与同一处引文簇的顺序一并修正。
- 其它列（标题、年份等）保持 Zotero 原生行为；不改任何元数据、不改显示文本、不联网。

## 安装

1. 从 [Releases](../../releases) 下载最新的 `pinyin-for-zotero.xpi`
2. Zotero：工具 → 插件 → 右上角齿轮 → `Install Plugin From File…` → 选择该文件
3. 重启 Zotero，并确认插件是**启用**状态

装好后点"创建者"列排序即可看到效果；WPS / Word 里需要点一次 **Refresh**。

## 设置（可选，改完需重启 Zotero）

位置：`编辑 → 设置 → 高级 → 配置编辑器`

- `extensions.zotero.creatorPinyinSort.fixItemTreeSorting`（默认 `true`）——接管条目列表"创建者"列排序
- `extensions.zotero.creatorPinyinSort.fixCiteprocSorting`（默认 `true`）——接管文档刷新（WPS/Word）的排序
- `extensions.zotero.creatorPinyinSort.extraCorrections`（默认空）——补充读音，例如 `区=ou,覃=qin`

把前两项设为 `false`，即可完全恢复 Zotero 原生排序。

## 读音修正范围

- 内置 413 个单姓 + 60 个复姓的姓氏读音表，另补充常见多音字姓氏：
  曾→zeng、单→shan、仇→qiu、区→ou、查→zha、解→xie、乐→yue、朴→piao、覃→qin、尉迟→yuchi 等。
- 名字的其余部分按常用读音；查不到读音的生僻字保持原字符。

## 已知边界

- **只支持 Zotero 10**（依赖其内部结构）；Zotero 11 起需要更新插件。
- 只修正**姓氏**读音；名字中间的多音字按常用读音（例如"李重光"的"重"）。
- 只改排序，不改显示与引用格式；中文/西文谁在前，完全沿用 Zotero 原生规则。
- 通过包装 Zotero 内部排序函数实现；若将来内部结构变化，会**静默恢复原生排序**，
  不会影响 Zotero 正常使用。

自检方法与详细分析见 [COMPATIBILITY.md](COMPATIBILITY.md)。

## 隐私

不联网、不上传任何数据、不修改条目/附件/文档；只在内存中计算排序键。

## 许可证

- 插件代码：[GNU AGPL-3.0](LICENSE)
- 内嵌第三方数据（node-pinyin，MIT）：[THIRD-PARTY-NOTICES.txt](THIRD-PARTY-NOTICES.txt)

本插件是独立的第三方插件，与 Zotero 官方无从属关系。

改版记录见 [CHANGELOG.md](CHANGELOG.md)；发版与维护流程见 [RELEASING.md](RELEASING.md)。
