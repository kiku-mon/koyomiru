// こよみる 通知の受け口（Service Worker）。スマホに届くものは「通知」と呼ぶ（📣お知らせ＝アプリの変更、とは分ける）
// v0.99.98: 【権威】2026-11-25「予定のお知らせ（通知）…やろう」→ C（前の夜のまとめ＋予定ごとの少し前）
//
// 守ること：
//   ・ここは通知を受けて出すだけ。画面やデータの保存（キャッシュ）には触らない。
//     fetch を横取りしないので、古い版の画面が出続けることは起きない。
//   ・送られてくる中身は、Apple の「宣言型プッシュ」の形（web_push: 8030）。
//     iPhone（iOS 18.4〜）はこのファイルを使わずに自分で出す。それ以外の端末は、ここで同じ中身を出す。

self.addEventListener('install', function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function _koyomiParse(event) {
  var d = {};
  try { d = event.data ? event.data.json() : {}; } catch (e) {
    try { d = { notification: { title: 'こよみる', body: event.data.text() } }; } catch (e2) { d = {}; }
  }
  var n = d.notification || d;
  return {
    title: n.title || 'こよみる',
    body: n.body || '',
    url: n.navigate || n.url || '/',
    tag: n.tag || undefined
  };
}

self.addEventListener('push', function (event) {
  var n = _koyomiParse(event);
  event.waitUntil(self.registration.showNotification(n.title, {
    body: n.body,
    tag: n.tag,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: n.url }
  }));
});

// 押したら、開いているこよみるを前に出して、その日へ。無ければ開く
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.indexOf(self.registration.scope) === 0 && 'focus' in c) {
        try { c.postMessage({ type: 'koyomi-open', url: url }); } catch (e) {}
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  }));
});
