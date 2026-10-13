/* 插件入口：Zotero 7+ 的 bootstrap 式插件 */

function install(data, reason) {}

async function startup({ id, version, rootURI }, reason) {
  // 三个脚本共用同一个全局对象（ctx），加载顺序不能调换。
  // 这是 Zotero 7 官方示例（make-it-red）使用的写法。
  const ctx = { rootURI, Zotero, Services };
  ctx._globalThis = ctx;
  Services.scriptloader.loadSubScript(rootURI + "content/data.js", ctx);
  Services.scriptloader.loadSubScript(rootURI + "content/pinyin.js", ctx);
  Services.scriptloader.loadSubScript(rootURI + "content/main.js", ctx);

  await Zotero.CreatorPinyinSort.init({ id, version, rootURI });
}

function onMainWindowLoad({ window }, reason) {
  Zotero.CreatorPinyinSort?.onMainWindowLoad(window);
}

function onMainWindowUnload({ window }, reason) {
  Zotero.CreatorPinyinSort?.onMainWindowUnload(window);
}

async function shutdown(data, reason) {
  if (reason === APP_SHUTDOWN) {
    return;
  }
  Zotero.CreatorPinyinSort?.shutdown();
}

function uninstall(data, reason) {}
