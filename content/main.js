/*
 * 插件主体
 *   1) 注册“作者拼音”列（默认不显示）
 *   2) 接管条目列表内置“创建者”列的排序比较（只改中文姓名块内部顺序）
 *   3) 接管 citeproc 的排序比较（影响 WPS/Word 刷新后的参考文献与引文簇顺序）
 * 所有改动只影响“排序键的计算”，不改元数据、不改显示文本；
 * “中文条目聚成一堆”是 Zotero 原生行为，本插件不改动它，只在中文字块内部改用修正拼音；
 * 探测失败时只记日志、保持 Zotero 原生行为。
 */
Zotero.CreatorPinyinSort = {
  COLUMN_KEY: "creatorPinyin",
  PREF_EXTRA: "extensions.zotero.creatorPinyinSort.extraCorrections",
  PREF_FIX_ITEM_TREE: "extensions.zotero.creatorPinyinSort.fixItemTreeSorting",
  PREF_FIX_CITEPROC: "extensions.zotero.creatorPinyinSort.fixCiteprocSorting",
  MAX_NAME_KEYS: 20000,

  id: null,
  version: null,
  rootURI: null,
  registeredKey: null,

  _restores: [],
  _nameKeys: null,
  _namePrefixes: null,
  _patchedCSL: null,
  _patchedProviderProto: null,
  _retryTimer: null,
  _pendingCiteproc: false,
  _pendingItemTree: false,

  log: function (msg) {
    try {
      Zotero.debug("CreatorPinyinSort: " + msg);
    }
    catch (e) {}
  },

  prefEnabled: function (name) {
    try {
      var value = Zotero.Prefs.get(name);
      return value === undefined || value === null ? true : !!value;
    }
    catch (e) {
      return true;
    }
  },

  init: async function ({ id, version, rootURI }) {
    this.id = id;
    this.version = version;
    this.rootURI = rootURI;
    this._restores = [];

    try {
      CreatorPinyin.setExtraCorrections(Zotero.Prefs.get(this.PREF_EXTRA));
    }
    catch (e) {
      this.log("读取补充修正表失败：" + e);
    }

    if (this.prefEnabled(this.PREF_FIX_ITEM_TREE)) {
      if (!this.patchItemTreeCompare()) {
        this._pendingItemTree = true;
        try {
          this.scheduleItemTreeRetry();
        }
        catch (e) {
          this.log("启动排序重试失败：" + e);
        }
      }
    }
    if (this.prefEnabled(this.PREF_FIX_CITEPROC)) {
      if (!this.patchCiteprocSort()) {
        this._pendingCiteproc = true;
      }
    }

    this.warnAboutPrefs();

    if (Zotero.uiReadyPromise) {
      await Zotero.uiReadyPromise;
    }
    if (this._pendingCiteproc) {
      this._pendingCiteproc = false;
      this.patchCiteprocSort();
    }
    if (this._pendingItemTree) {
      this._pendingItemTree = false;
      if (!this.patchItemTreeCompare()) {
        this.log("界面已就绪但仍未定位到条目列表排序函数，稍后继续重试");
      }
    }
    this.register();
  },

  // 定时重试定位条目列表（UI 未就绪时用），最多 20 秒
  scheduleItemTreeRetry: function () {
    var self = this;
    var attempts = 0;
    if (typeof setInterval !== "function") {
      return;
    }
    if (this._retryTimer) {
      return;
    }
    try {
      this._retryTimer = setInterval(function () {
        attempts++;
        var ok = self.patchItemTreeCompare();
        if (ok || attempts >= 40) {
          clearInterval(self._retryTimer);
          self._retryTimer = null;
          if (!ok) {
            self.log("未能定位条目列表排序函数，本次启动未接管“创建者”列排序");
          }
        }
      }, 500);
    }
    catch (e) {
      this._retryTimer = null;
      this.log("无法启动排序重试定时器：" + e);
    }
  },

  warnAboutPrefs: function () {
    // sortCreatorAsString=true 时比较的是显示名，本插件同样生效，无需提示
    try {
      if (Zotero.Prefs.get("cite.useCiteprocRs")) {
        this.log("检测到 cite.useCiteprocRs=true（使用 citeproc-rs 引擎），文档排序修复不会生效");
      }
    }
    catch (e) {}
  },

  // ---------- 1) “作者拼音”列 ----------

  register: function () {
    var self = this;
    try {
      this.registeredKey = Zotero.ItemTreeManager.registerColumn({
        dataKey: this.COLUMN_KEY,
        label: (Zotero.locale && Zotero.locale.indexOf("zh") === 0) ? "作者拼音" : "Creator Pinyin",
        pluginID: this.id,
        enabledTreeIDs: ["main"],
        showInColumnPicker: true,
        width: "130",
        zoteroPersist: ["width", "hidden", "sortDirection"],
        dataProvider: function (item) {
          return self.getSortKey(item);
        },
      });
    }
    catch (e) {
      Zotero.logError(e);
      this.log("注册列失败：" + e);
    }
  },

  getName: function (item) {
    if (!item || !item.isRegularItem || !item.isRegularItem()) {
      return "";
    }
    var name = "";
    try {
      name = item.sortCreator || "";
    }
    catch (e) {
      name = "";
    }
    if (!name) {
      try {
        name = item.getField("firstCreator") || "";
      }
      catch (e) {
        name = "";
      }
    }
    if (!name) {
      try {
        var creators = item.getCreators();
        if (creators && creators.length) {
          name = [creators[0].lastName, creators[0].firstName]
            .filter(function (part) { return !!part; }).join(" ");
        }
      }
      catch (e) {
        name = "";
      }
    }
    return name;
  },

  getSortKey: function (item) {
    try {
      var raw = this.getName(item);
      if (!raw) {
        return "";
      }
      return CreatorPinyin.toSortKey(Zotero.Items.getSortTitle(raw));
    }
    catch (e) {
      this.log("转换失败：" + e);
      return "";
    }
  },

  // ---------- 2) 条目列表内置“创建者”列 ----------

  // 找到条目列表的行提供者（排序逻辑所在对象）
  findRowProviderProto: function () {
    var provider = null;
    try {
      var zp = Zotero.getActiveZoteroPane && Zotero.getActiveZoteroPane();
      provider = zp && zp.itemsView && zp.itemsView.rowProvider;
    }
    catch (e) {
      provider = null;
    }
    if (!provider && Zotero.getMainWindows) {
      var windows = Zotero.getMainWindows();
      for (var i = 0; i < windows.length; i++) {
        try {
          var pane = windows[i] && windows[i].ZoteroPane;
          if (pane && pane.itemsView && pane.itemsView.rowProvider) {
            provider = pane.itemsView.rowProvider;
            break;
          }
        }
        catch (e) {}
      }
    }
    if (!provider) {
      return null;
    }
    // 沿原型链找“自己拥有 _compareField”的那个原型
    var proto = Object.getPrototypeOf(provider);
    while (proto && proto !== Object.prototype) {
      if (Object.prototype.hasOwnProperty.call(proto, "_compareField")) {
        return proto;
      }
      proto = Object.getPrototypeOf(proto);
    }
    return null;
  },

  // 与原实现保持一致的取值方式：sortCreator（或 sortCreatorAsString 时的 firstCreator）
  creatorSortKey: function (tree, row) {
    var prop = tree && tree._sortCreatorAsString ? "firstCreator" : "sortCreator";
    var ref = row && row.ref;
    if (!ref) {
      return "";
    }
    var value = ref[prop];
    if (!value && ref.getField) {
      value = ref.getField("firstCreator");
    }
    return Zotero.Items.getSortTitle(value || "");
  },

  patchItemTreeCompare: function () {
    try {
      if (this._patchedProviderProto && Object.prototype.hasOwnProperty.call(this._patchedProviderProto, "_compareField")) {
        return true;
      }
      var proto = this.findRowProviderProto();
      if (!proto || typeof proto._compareField !== "function") {
        return false;
      }
      var self = this;
      var originalCompareField = proto._compareField;
      var patched = function (a, b, sortField) {
        if (sortField === "firstCreator") {
          try {
            var keyA = self.creatorSortKey(this, a);
            var keyB = self.creatorSortKey(this, b);
            // 只有“两条都是中文姓名”时才介入；其余一律走原生，保证中文条目聚成一堆
            if (CreatorPinyin.hasHan(keyA) && CreatorPinyin.hasHan(keyB)) {
              var cmp = this._sortCollation.compareString(
                1,
                CreatorPinyin.toSortKey(keyA),
                CreatorPinyin.toSortKey(keyB)
              );
              if (cmp !== 0) {
                return cmp;
              }
            }
          }
          catch (e) {}
        }
        return originalCompareField.call(this, a, b, sortField);
      };
      proto._compareField = patched;
      this._patchedProviderProto = proto;
      this._restores.push(function () {
        try {
          if (proto._compareField === patched) {
            proto._compareField = originalCompareField;
          }
        }
        catch (e) {}
        self._patchedProviderProto = null;
      });
      this.log("已接管条目列表“创建者”列排序（仅中文姓名内部按拼音）");
      return true;
    }
    catch (e) {
      this.log("条目列表排序修复失败：" + e);
      return false;
    }
  },

  onMainWindowLoad: function (window) {
    try {
      if (window && window.ZoteroPane && window.ZoteroPane.itemsView) {
        this.patchItemTreeCompare();
      }
    }
    catch (e) {}
  },

  // ---------- 3) citeproc 排序（文档刷新 / 参考文献） ----------

  isChineseLocale: function (locale) {
    return /^zh(\b|[-_])/i.test(String(locale || ""));
  },

  patchCiteprocSort: function () {
    try {
      var CSL = Zotero.CiteProc && Zotero.CiteProc.CSL;
      if (!CSL || typeof CSL.getSortKeys !== "function" || typeof CSL.getSortCompare !== "function") {
        this.log("未找到 Zotero.CiteProc.CSL 的排序函数，暂不修复文档排序");
        return false;
      }
      if (this._patchedCSL === CSL) {
        return true;
      }
      var self = this;
      this._nameKeys = new Set();
      this._namePrefixes = new Set();
      var originalGetSortKeys = CSL.getSortKeys;
      var originalGetSortCompare = CSL.getSortCompare;

      // 记录“哪些排序键来自作者姓名”，供比较器识别
      CSL.getSortKeys = function (Item, key_type) {
        var keys = originalGetSortKeys.call(this, Item, key_type);
        try {
          self.registerNameKeys(Item, keys);
        }
        catch (e) {}
        return keys;
      };

      /*
       * 只在中式排序语言下接管比较。
       * 注意：citeproc 在“样式构建”阶段就会创建引文排序比较器，那时
       * state.opt["default-locale-sort"] 还没配置（传入 undefined），
       * 所以 locale 未定时要延迟到首次比较时再解析。
       */
      CSL.getSortCompare = function (default_locale) {
        var state = this;
        if (self.isChineseLocale(default_locale)) {
          var base = originalGetSortCompare.call(state, default_locale);
          return function (a, b) {
            return self.compareKeys(a, b, base);
          };
        }
        if (typeof default_locale === "string" && default_locale) {
          // 已明确是非中文排序语言 → 完全不介入
          return originalGetSortCompare.call(state, default_locale);
        }
        var baseComparator = null;
        var engage = false;
        return function (a, b) {
          if (baseComparator === null) {
            var locale = (state && state.opt && state.opt["default-locale-sort"]) || default_locale;
            baseComparator = originalGetSortCompare.call(state, locale);
            engage = self.isChineseLocale(locale);
          }
          if (!engage) {
            return baseComparator(a, b);
          }
          return self.compareKeys(a, b, baseComparator);
        };
      };

      this._patchedCSL = CSL;
      this._restores.push(function () {
        try {
          CSL.getSortKeys = originalGetSortKeys;
          CSL.getSortCompare = originalGetSortCompare;
        }
        catch (e) {}
        self._patchedCSL = null;
        self._nameKeys = null;
        self._namePrefixes = null;
      });
      this.log("已接管文档（WPS/Word 刷新）参考文献排序");
      return true;
    }
    catch (e) {
      this.log("文档排序修复失败：" + e);
      return false;
    }
  },

  // 从 CSL 条目里取“可能出现在排序键里的姓名字符串”
  candidateNames: function (item) {
    var CSL = Zotero.CiteProc && Zotero.CiteProc.CSL;
    var vars = (CSL && CSL.NAME_VARIABLES) || [
      "author", "editor", "translator", "director", "contributor",
      "composer", "illustrator", "interviewer", "recipient",
      "container-author", "collection-editor", "original-author",
    ];
    var out = [];
    for (var i = 0; i < vars.length; i++) {
      var list = item[vars[i]];
      if (!list) {
        continue;
      }
      if (!Array.isArray(list)) {
        list = [list];
      }
      for (var j = 0; j < list.length; j++) {
        var name = list[j];
        if (!name) {
          continue;
        }
        if (name.literal) {
          out.push(String(name.literal).trim());
        }
        var family = name.family ? String(name.family).trim() : "";
        var given = name.given ? String(name.given).trim() : "";
        if (family) {
          out.push(family);
          if (given) {
            out.push(family + " " + given);
            out.push(given + " " + family);
          }
        }
        else if (given) {
          out.push(given);
        }
      }
    }
    return out.filter(function (s) { return !!s; });
  },

  // 去掉 citeproc 追加在排序键尾部的分隔符（"|" 或 "@"）
  normalizeKey: function (str) {
    return String(str || "").replace(/[\s|@]+$/, "");
  },

  // 某个排序键是否来自作者姓名
  isNameKeyString: function (str) {
    if (typeof str !== "string" || !str) {
      return false;
    }
    var key = this.normalizeKey(str);
    if (!key) {
      return false;
    }
    if (this._nameKeys && this._nameKeys.has(key)) {
      return true;
    }
    // 引文里还会用到 authorstring（如“曾向红, 陈明霞”），以姓名开头的也认作姓名键
    if (this._namePrefixes) {
      var max = Math.min(key.length, 24);
      for (var len = max; len >= 1; len--) {
        if (this._namePrefixes.has(key.slice(0, len))) {
          return true;
        }
      }
    }
    return false;
  },

  registerNameKeys: function (item, keys) {
    if (!item || !keys || !keys.length || !this._nameKeys) {
      return;
    }
    var names = this.candidateNames(item);
    if (!names.length) {
      return;
    }
    if (this._namePrefixes.size < this.MAX_NAME_KEYS) {
      for (var n = 0; n < names.length; n++) {
        this._namePrefixes.add(names[n]);
      }
    }
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (typeof key !== "string" || !key || !CreatorPinyin.hasHan(key)) {
        continue;
      }
      for (var j = 0; j < names.length; j++) {
        if (key.indexOf(names[j]) === 0) {
          if (this._nameKeys.size >= this.MAX_NAME_KEYS) {
            this._nameKeys.clear();
          }
          this._nameKeys.add(this.normalizeKey(key));
          break;
        }
      }
    }
  },

  // 自定义比较器：只影响“双方都是姓名键”的情况，其余一律交给原比较器
  compareKeys: function (a, b, base) {
    try {
      if (!this._nameKeys) {
        return base(a, b);
      }
      var aName = this.isNameKeyString(a);
      var bName = this.isNameKeyString(b);
      if (!aName || !bName) {
        return base(a, b);
      }
      var aHan = CreatorPinyin.hasHan(a);
      var bHan = CreatorPinyin.hasHan(b);
      if (aHan !== bHan) {
        // 中文作者整体排在西文作者之前（与 Zotero 原生观感一致）
        return aHan ? -1 : 1;
      }
      if (!aHan) {
        return base(a, b);
      }
      return base(CreatorPinyin.toSortKey(a), CreatorPinyin.toSortKey(b));
    }
    catch (e) {
      return base(a, b);
    }
  },

  // ---------- 生命周期 ----------

  onMainWindowUnload: function (window) {
  },

  shutdown: function () {
    if (this._retryTimer) {
      clearInterval(this._retryTimer);
      this._retryTimer = null;
    }
    for (var i = this._restores.length - 1; i >= 0; i--) {
      try {
        this._restores[i]();
      }
      catch (e) {}
    }
    this._restores = [];
    try {
      if (this.registeredKey) {
        Zotero.ItemTreeManager.unregisterColumn(this.registeredKey);
      }
    }
    catch (e) {
      this.log("注销列失败：" + e);
    }
    this.registeredKey = null;
    delete Zotero.CreatorPinyinSort;
  },
};
