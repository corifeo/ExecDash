/* Browser storage adapter with a small document API (doc, collection, onSnapshot). */

function localStore() {
  var KEY = 'cyberdash:store',
    subs = [];
  function load() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || '{}');
    } catch (e) {
      return {};
    }
  }
  function save(st) {
    try {
      localStorage.setItem(KEY, JSON.stringify(st));
    } catch (e) {
      var err = new Error('Browser storage is full or unavailable.');
      err.code = 'quota_exceeded';
      throw err;
    }
  }
  function notify() {
    subs.slice().forEach(function (f) {
      f();
    });
  }
  function snap(path, st) {
    var d = st[path];
    return {
      id: path.split('/').pop(),
      exists: !!d,
      data: function () {
        return d ? clone(d) : undefined;
      },
      metadata: { fromCache: false, hasPendingWrites: false }
    };
  }
  function sub(f) {
    subs.push(f);
    setTimeout(f, 0);
    return function () {
      subs = subs.filter(function (x) {
        return x !== f;
      });
    };
  }
  function doc(path) {
    return {
      id: path.split('/').pop(),
      path: path,
      get: function () {
        return Promise.resolve(snap(path, load()));
      },
      set: function (d) {
        try {
          var st = load();
          st[path] = clone(d);
          save(st);
        } catch (e) {
          return Promise.reject(e);
        }
        setTimeout(notify, 0);
        return Promise.resolve();
      },
      delete: function () {
        var st = load();
        delete st[path];
        save(st);
        setTimeout(notify, 0);
        return Promise.resolve();
      },
      onSnapshot: function (next) {
        return sub(function () {
          next(snap(path, load()));
        });
      }
    };
  }
  function collection(c) {
    return {
      path: c,
      doc: function (id) {
        return doc(c + '/' + id);
      },
      onSnapshot: function (next) {
        return sub(function () {
          var st = load(),
            docs = Object.keys(st)
              .filter(function (k) {
                return k.indexOf(c + '/') === 0 && k.split('/').length === 2;
              })
              .sort()
              .map(function (k) {
                return snap(k, st);
              });
          next({
            docs: docs,
            size: docs.length,
            empty: !docs.length,
            docChanges: function () {
              return [];
            },
            metadata: { fromCache: false, hasPendingWrites: false }
          });
        });
      }
    };
  }
  window.addEventListener('storage', function (e) {
    if (e.key === KEY) notify();
  });
  return { doc: doc, collection: collection };
}
