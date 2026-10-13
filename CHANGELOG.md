# 更新日志

## 1.2.1

- **兼容范围收紧为 Zotero 10**。经源码核查（Zotero 7.0.32 / 8.0.5 / 9.0.6 / 10.0.6），
  条目列表排序修复所依赖的 `ItemTreeRowProvider._compareField` 只在 Zotero 10 中存在，
  在 7 / 8 / 9 上无法生效。为避免 7–9 的用户装上后"核心功能不生效"，
  把清单里的 `strict_min_version` 从 `7.0` 提高到 `10.0`。
- 同步更新 README 与 COMPATIBILITY.md 的兼容性说明（附核查方法与证据）。

## 1.2.0

- **修正**：不再改写 `item.sortCreator`（该做法会让中文作者被转成拼音字母串，
  导致中英文作者混排）。改为只接管"创建者"列的**比较**逻辑：中文条目仍整体聚成一堆，
  只在中文块内部按修正拼音排序。
- 其它列（标题、年份等）行为与 Zotero 原生完全一致。
- `sortCreatorAsString=true` 时同样生效。
- "作者拼音"列改为默认不显示（需要时可在列选择器里勾选）。

## 1.1.0

- 新增：接管 Zotero 主界面内置"创建者"列排序。
- 新增：接管 citeproc 排序，使 WPS / Word 刷新后的参考文献表与引文簇顺序按修正拼音排列。
- 新增两个开关（`fixItemTreeSorting`、`fixCiteprocSorting`）。

## 1.0.1

- 修正插件清单：补充 Zotero 10 要求的 `applications.zotero.update_url` 字段。

## 1.0.0

- 首个版本：新增"作者拼音"列，按拼音（含多音字姓氏修正）排序。
