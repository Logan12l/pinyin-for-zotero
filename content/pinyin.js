/*
 * 把中文作者名转成拼音排序键。
 *
 * 读音来自 data.js 中的直查表（数据来源见 data.js 头部注释与 THIRD-PARTY-NOTICES.txt）。
 * 姓名处理规则：
 *   - “姓”的位置优先使用姓氏读音表（解决多音字姓氏，如 曾→Zeng、区→Ou、覃→Qin）；
 *   - 其余部分逐字查表；
 *   - 非中文姓名原样返回，保证与西文姓名在一起排序时顺序正常。
 */
var CreatorPinyin = (function () {
  var cache = Object.create(null);
  var extraCorrections = {};

  function isHanChar(ch) {
    var code = ch.charCodeAt(0);
    return (code >= 0x3400 && code <= 0x9FFF) || (code >= 0xF900 && code <= 0xFAFF);
  }

  // 单字 -> 拼音（小写、无声调）；查不到返回 null
  function singlePinyin(ch) {
    if (Object.prototype.hasOwnProperty.call(extraCorrections, ch)) {
      return extraCorrections[ch];
    }
    if (Object.prototype.hasOwnProperty.call(ZPS_EXCEPTIONS, ch)) {
      return ZPS_EXCEPTIONS[ch];
    }
    var code = ch.charCodeAt(0);
    var table = null;
    var idx = -1;
    if (code >= ZPS_TABLE_A_BASE && code < ZPS_TABLE_A_BASE + ZPS_TABLE_A.length) {
      table = ZPS_TABLE_A;
      idx = code - ZPS_TABLE_A_BASE;
    }
    else if (code >= ZPS_TABLE_B_BASE && code < ZPS_TABLE_B_BASE + ZPS_TABLE_B.length) {
      table = ZPS_TABLE_B;
      idx = code - ZPS_TABLE_B_BASE;
    }
    if (!table) {
      return null;
    }
    var syllableIndex = table.charCodeAt(idx) - ZPS_TABLE_OFFSET;
    if (syllableIndex < 0 || syllableIndex >= ZPS_SYLLABLES.length) {
      return null;
    }
    return ZPS_SYLLABLES[syllableIndex];
  }

  function capitalize(str) {
    if (!str) {
      return str;
    }
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function convertHanRun(run) {
    var out = "";
    for (var i = 0; i < run.length; i++) {
      var ch = run.charAt(i);
      out += isHanChar(ch) ? (singlePinyin(ch) || ch) : ch;
    }
    return out;
  }

  // 姓名 -> "Zeng Xianghong" 这样的排序键
  function convertName(raw) {
    if (!raw) {
      return "";
    }
    // 去掉 Zotero 在姓名里加的隔离符
    var name = String(raw).replace(/[\u2066-\u2069\u200e\u200f]/g, "").trim();
    if (!name) {
      return "";
    }
    if (name in cache) {
      return cache[name];
    }
    var result;
    if (!isHanChar(name.charAt(0))) {
      // 西文姓名：原样返回
      result = name;
    }
    else {
      var surname = null;
      var consumed = 1;
      var two = name.substr(0, 2);
      if (Object.prototype.hasOwnProperty.call(ZPS_COMPOUND_SURNAMES, two)) {
        surname = ZPS_COMPOUND_SURNAMES[two].join("");
        consumed = 2;
      }
      else {
        var firstChar = name.charAt(0);
        surname = extraCorrections[firstChar]
          || ZPS_SURNAME_EXTRA[firstChar]
          || ZPS_SURNAMES[firstChar]
          || singlePinyin(firstChar)
          || firstChar;
      }
      var rest = name.slice(consumed).trim();
      var parts = rest.split(/[\s\u00b7\u2022\u30fb\u2027,;:()\[\]\uff0c\u3001\uff1b\uff1a\uff08\uff09]+/)
        .filter(function (part) {
        return part.length > 0;
      });
      var restPinyin = parts.map(function (part) {
        return capitalize(convertHanRun(part));
      }).join(" ");
      result = capitalize(surname) + (restPinyin ? " " + restPinyin : "");
    }
    cache[name] = result;
    return result;
  }

  return {
    // 传入形如 "曾=zeng,区=ou" 的补充修正表（对所有位置生效）
    setExtraCorrections: function (text) {
      var map = {};
      if (text) {
        String(text).split(/[,;，；\s]+/).forEach(function (pair) {
          var kv = pair.split(/[=:：]/);
          if (kv.length === 2 && kv[0] && kv[1]) {
            map[kv[0].trim()] = kv[1].trim().toLowerCase();
          }
        });
      }
      extraCorrections = map;
      cache = Object.create(null);
    },
    convertName: convertName,
    singlePinyin: singlePinyin,
    isHanChar: isHanChar,
    // 字符串里是否含汉字
    hasHan: function (str) {
      if (!str) {
        return false;
      }
      for (var i = 0; i < str.length; i++) {
        if (isHanChar(str.charAt(i))) {
          return true;
        }
      }
      return false;
    },
    // 排序键：含汉字则转成拼音（首字按姓氏读音修正），否则原样返回
    toSortKey: function (str) {
      if (!str) {
        return str;
      }
      if (!this.hasHan(str)) {
        return str;
      }
      return convertName(str);
    },
    isAvailable: function () {
      return true;
    }
  };
})();
