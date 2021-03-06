/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function (window) {

  window.br = window.br || {};

  window.br.isNumber = function(value) {
    return (
             !isNaN(parseFloat(value)) &&
             isFinite(value)
           );
  }

  window.br.isNull = function(value) {
    return (
             (value === undefined) ||
             (value === null)
           );
  }

  window.br.isEmpty = function(value) {
    return (
             br.isNull(value) ||
             ((typeof value.length != 'undefined') && (value.length === 0)) // Array, String
           );
  }

  window.br.isArray = function (value) {
    return (
             !br.isNull(value) &&
             (Object.prototype.toString.call(value) === '[object Array]')
           );
  }

  window.br.isObject = function (value) {
    return (!br.isEmpty(value) && (typeof value === 'object'));
  }

  window.br.isBoolean = function (value) {
    return (typeof value === 'boolean');
  }

  window.br.isString = function (value) {
    return (typeof value === 'string');
  }

  window.br.isNumber = function (value) {
    return (typeof value === 'number');
  }

  window.br.isFunction = function (value) {
    return (typeof value === 'function');
  }

  window.br.toString = function (value) {
    if (br.isNull(value)) {
      return '';
    } else {
      return value.toString();
    }
  }

  window.br.split = function (value, delimiter) {
    if (br.isEmpty(value)) {
      return [];
    } else
    if (br.isString(value)) {
      return value.split(delimiter);
    }
  }

  window.br.toInt = function(value) {
    if (br.isString(value)) {
      if (value.length > 0) {
        return parseInt(value, 10);
      }
    } else
    if (br.isNumber(value)) {
      return value;
    }
  };

  window.br.toReal = function(value) {
    if (br.isString(value)) {
      if (value.length > 0) {
        return parseFloat(value);
      }
    } else
    if (br.isNumber(value)) {
      return value;
    }
  };

})(window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function (window) {

  var _helper = {

    pack: function(data) {
      return JSON.stringify(data);
    },

    unpack: function(data) {
      try {
        return JSON.parse(data);
      } catch(ex) {
        return null;
      }
    }

  }

  function BrStorage(storage) {

    var _storage = storage;
    var _this = this;

    this.get = function(key, defaultValue) {
      var result;
      if (br.isArray(key)) {
        result = {};
        for(var i in key) {
          result[key[i]] = this.get(key[i]);
        }
      } else {
        result = _helper.unpack(_storage.getItem(key));
      }
      return br.isEmpty(result) ? (br.isNull(defaultValue) ? result : defaultValue) : result;
    }

    this.set = function(key, value) {
      if (br.isObject(key)) {
        for(var name in key) {
          this.set(name, key[name]);
        }
      } else {
        _storage.setItem(key, _helper.pack(value));
      }
      return this;
    }

    this.inc = function(key, increment, glue) {
      var value = this.get(key);
      if (br.isNumber(value)) {
        increment = (br.isNumber(increment) ? increment : 1);
        this.set(key, value + increment);
      } else
      if (br.isString(value)) {
        if (!br.isEmpty(increment)) {
          if (glue === undefined) {
            glue = ', ';
          }
          if (!br.isEmpty(value)) {
            value = value + glue + increment;
          } else {
            value = increment;
          }
          this.set(key, value);
        }
      } else {
        increment = (br.isNumber(increment) ? increment : 1);
        this.set(key, increment);
      }
      return this;
    }

    this.dec = function(key, increment) {
      var value = this.get(key);
      increment = (br.isNumber(increment) ? increment : 1);
      this.set(key, br.isNumber(value) ? (value - increment) : increment);
      return this;
    }

    this.append = function(key, newValue, limit) {
      if (!br.isEmpty(newValue)) {
        var value = this.get(key);
        if (!br.isArray(value)) {
          value = [];
        }
        if (br.isArray(newValue)) {
          for(var i in newValue) {
            this.append(key, newValue[i], limit);
          }
        } else {
          if (br.isNumber(limit)) {
            while(value.length >= limit) {
              value.shift();
            }
          }
          value.push(newValue);
          this.set(key, value);
        }
      }
      return this;
    }

    this.appendUnique = function(key, newValue, limit) {
      if (!br.isEmpty(newValue)) {
        this.remove(key, newValue);
        this.append(key, newValue, limit);
      }
      return this;
    }

    this.prepend = function(key, newValue, limit) {
      if (!br.isEmpty(newValue)) {
        var value = this.get(key);
        if (!br.isArray(value)) {
          value = [];
        }
        if (br.isArray(newValue)) {
          for(var i in newValue) {
            this.prepend(key, newValue[i], limit);
          }
        } else {
          if (br.isNumber(limit)) {
            while(value.length >= limit) {
              value.pop();
            }
          }
          value.unshift(newValue);
          this.set(key, value);
        }
      }
      return this;
    }

    this.prependUnique = function(key, newValue, limit) {
      if (!br.isEmpty(newValue)) {
        this.remove(key, newValue);
        this.prepend(key, newValue, limit);
      }
      return this;
    }

    this.each = function(key, fn) {
      var value = this.get(key);
      if (!br.isArray(value)) {
        value = [];
      }
      for(var i=0; i < value.length; i++) {
        fn.call(this, value[i]);
      }
      return this;
    }

    function _getLast(key, defaultValue, remove) {
      var result = null;
      var value = _this.get(key, defaultValue);
      if (br.isArray(value)) {
        if (value.length > 0) {
          result = value.pop();
          if (remove) {
            _this.set(key, value);
          }
        }
      }
      return br.isEmpty(result) ? (br.isNull(defaultValue) ? result : defaultValue) : result;
   }

    this.getLast = function(key, defaultValue) {
      return _getLast(key, defaultValue, false);
    }

    this.takeLast = function(key, defaultValue) {
      return _getLast(key, defaultValue, true);
    }

    function _getFirst(key, defaultValue, remove) {
      var result = null;
      var value = _this.get(key, defaultValue);
      if (br.isArray(value)) {
        if (value.length > 0) {
          result = value.shift();
          if (remove) {
            _this.set(key, value);
          }
        }
      }
      return br.isEmpty(result) ? (br.isEmpty(defaultValue) ? result : defaultValue) : result;
    }

    this.getFirst = function(key, defaultValue) {
      return _getFirst(key, defaultValue, false);
    }

    this.takeFirst = function(key, defaultValue) {
      return _getFirst(key, defaultValue, true);
    }

    this.extend = function(key, newValue) {
      if (!br.isEmpty(newValue)) {
        var value = this.get(key);
        if (!br.isObject(value)) {
          value = {};
        }
        if (br.isObject(newValue)) {
          for(var i in newValue) {
            value[i] = newValue[i];
          }
          this.set(key, value);
        }
      }
      return this;
    }

    this.not = function(key) {
      var value = this.get(key);
      if (!br.isBoolean(value)) {
        value = false;
      }
      this.set(key, !value);
      return this;
    }

    this.clear = function() {
      _storage.clear();
      return this;
    }

    this.all = function() {
      var result = {};
      for(var name in _storage) {
        result[name] = this.get(name);
      }
      return result;
    }

    this.remove = function(key, arrayValue) {
      var value = this.get(key);
      if (!br.isEmpty(arrayValue) && br.isArray(value)) {
        var idx = value.indexOf(arrayValue)
        if (idx != -1) {
          value.splice(idx, 1);
        }
        this.set(key, value);
      } else {
        _storage.removeItem(key);
      }
      return this;
    }

    this.indexOf = function(key, arrayValue) {
      var value = this.get(key);
      if (br.isArray(value)) {
        return value.indexOf(arrayValue)
      }
      return -1;
    }

  }

  window.br = window.br || {};

  window.br.storage = new BrStorage(window.localStorage);
  window.br.session = new BrStorage(window.sessionStorage);

})(window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function (window) {

  function BrEvents(obj) {

    var _this = this;

    this.subscribers = {};
    this.obj = obj || this;

    this.before = function(event, callback) {
      _this.subscribers[event] = _this.subscribers[event] || { on: [], before: [], after: [] };
      _this.subscribers[event].before.push(callback);
    }

    this.on = function(event, callback) {
      _this.subscribers[event] = _this.subscribers[event] || { on: [], before: [], after: [] };
      _this.subscribers[event].on.push(callback);
    }

    this.after = function(event, callback) {
      _this.subscribers[event] = _this.subscribers[event] || { on: [], before: [], after: [] };
      _this.subscribers[event].after.push(callback);
    }

    function trigger(event, pos, args) {

      var result = null;
      var eventSubscribers = _this.subscribers[event];
      var i;

      if (eventSubscribers) {
        switch(pos) {
          case 'before':
            for (var i in eventSubscribers.before) {
              eventSubscribers.before[i].apply(_this.obj, args);
            }
            break;
          case 'on':
            for (var i in eventSubscribers.on) {
              result = eventSubscribers.on[i].apply(_this.obj, args);
            }
            break;
          case 'after':
            for (var i in eventSubscribers.after) {
              eventSubscribers.after[i].apply(_this.obj, args);
            }
            break;
        }
      }

      return result;

    }

    function triggerEx(event, pos, largs) {

      var args = [];
      for(var i = 0; i < largs.length; i++) {
        args.push(largs[i]);
      }

      if (event != '*') {
        trigger('*', pos, args);
      }

      args.splice(0,1);

      return trigger(event, pos, args);

    }

    this.triggerBefore = function(event) {
      return triggerEx(event, 'before', arguments);
    }
    this.trigger = function(event) {
      return triggerEx(event, 'on',     arguments);
    }
    this.triggerAfter = function(event) {
      return triggerEx(event, 'after',  arguments);
    }

  }

  window.br = window.br || {};

  window.br.eventQueue = function(obj) {
    return new BrEvents(obj);
  }

})(window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function (window) {

  window.br = window.br || {};

  window.br.request = new BrRequest();

  function BrRequest() {

    this.continueRoute = true;
    this.get = function(name, defaultValue) {
      var vars = document.location.search.replace('?', '').split('&');
      var vals = {};
      for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0].indexOf('[') != -1) {
          var n = pair[0].substr(0, pair[0].indexOf('['));
          vals[n] = vals[n] || [];
          vals[n].push(unescape(pair[1]));
        } else {
          vals[pair[0]] = unescape(pair[1]);
        }
      }
      if (name) {
        for (var i in vals) {
          if (i == name) {
            return vals[i];
          }
        }
        return defaultValue;
      } else {
        return vals;
      }
    };
    this.anchor = function(defaultValue) {
      var value = document.location.hash.replace('#', '');
      if (value.length === 0) {
        value = defaultValue;
      }
      return value;
    };
    this.route = function(path, func) {
      if (this.continueRoute) {
        var l = document.location.toString();
        l = l.replace(/[?].*/, '');
        if (l.search(path) != -1) {
          this.continueRoute = false;
          func.call();
        }
      }
      return this;
    }

  }

})(window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  window.br = window.br || {};

  var baseUrl = '';
  var lookFor = ['vendor/jagermesh/bright/js/bright.min.js', 'vendor/jagermesh/bright/js/bright.js', 'bright/js/bright.min.js', 'bright/js/bright.js'];
  $('script').each(function() {
    if (baseUrl == '') {
      var src = $(this).attr('src');
      if (!br.isEmpty(src)) {
        for(var i in lookFor) {
          var idx = src.indexOf(lookFor[i]);
          if (idx != -1) {
            baseUrl = src.substring(0, idx);
          }
        }
      }
    }
  });

  window.br.baseUrl = baseUrl;

  var logStarted = false;

  window.br.log = function(msg) {
    if (typeof(console) != 'undefined') {
      if (!logStarted) {
        console.log('*********************** LOG STARTED ***********************');
        logStarted = true;
      }
      for(var i in arguments) {
        console.log(arguments[i]);
      }
    }
  };

  window.br.isTouchScreen = function() {
    var ua = navigator.userAgent;
    return ((/iPad/i.test(ua)) || (/iPhone/i.test(ua)) || (/Android/i.test(ua)));
  };

  window.br.isiOS = function() {
    var ua = navigator.userAgent;
    return ((/iPad/i.test(ua)) || (/iPhone/i.test(ua)));
  };

  window.br.isAndroid = function() {
    var ua = navigator.userAgent;
    return (/android/i.test(ua));
  };

  window.br.redirect = function(url) {
    if ((url.search(/^\//) == -1) && (url.search(/^http[s]?:\/\//) == -1)) {
      url = this.baseUrl + url;
    }
    document.location = url;
  };

  window.br.refresh = function() {
    location.reload();
  };

  window.br.preloadImages = function(images) {
    try {
      var div = document.createElement("div");
      var s = div.style;
      s.position = "absolute";
      s.top = s.left = 0;
      s.visibility = "hidden";
      document.body.appendChild(div);
      div.innerHTML = "<img src=\"" + images.join("\" /><img src=\"") + "\" />";
    } catch(e) {
        // Error. Do nothing.
    }
  };

  window.br.randomInt = function(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  window.br.forHtml = function(text) {
    if (text) {
      text = text.split('<').join('&lt;').split('>').join('&gt;');
    }
    return text;
  };

  window.br.extend = function(Child, Parent) {
    var F = function() { };
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
  };

  window.br.openPopup = function(url, w, h) {

    if (w === null) {
      if (screen.width) {
        if (screen.width >= 1280) {
          w = 1000;
        } else
        if (screen.width >= 1024) {
          w = 800;
        } else {
          w = 600;
        }
      }
    }
    if (h === null) {
      if (screen.height) {
        if (screen.height >= 900) {
          h = 700;
        } else
        if (screen.height >= 800) {
          h = 600;
        } else {
          h = 500;
        }
      }
    }
    var left = (screen.width) ? (screen.width-w)/2 : 0;
    var settings = 'height='+h+',width='+w+',top=20,left='+left+',menubar=0,scrollbars=1,resizable=1';
    var win = window.open(url, '_blank', settings);
    if (win) {
      win.focus();
    }

  };

  function handleModified(element, deferred) {
    if (deferred) {
      window.clearTimeout(element.data('BrModified_Timeout'));
      var listName1 = 'BrModified_Callbacks1';
      var listName2 = 'BrModified_LastCahange1';
    } else {
      var listName1 = 'BrModified_Callbacks2';
      var listName2 = 'BrModified_LastCahange2';
    }
    if (element.data(listName2) != element.val()) {
      element.data(listName2, element.val());
      var callbacks = element.data(listName1);
      if (callbacks) {
        for(var i in callbacks) {
          callbacks[i].call(element);
        }
      }
    }
  }

  function handleModified1(element) {
    handleModified(element, false);
    if (element.data('BrModified_Callbacks1')) {
      window.clearTimeout(element.data('BrModified_Timeout'));
      element.data('BrModified_Timeout', window.setTimeout(function() {
        handleModified(element, true);
      }, 1000));
    }
  }

  function setupModified(selector, callback, deferred) {
    $(selector).each(function() {
      if (!$(this).data('br-data-change-callbacks')) {
        $(this).data('br-data-change-callbacks', []);
      }
      if (deferred) {
        var listName = 'BrModified_Callbacks1';
      } else {
        var listName = 'BrModified_Callbacks2';
      }
      var callbacks = $(this).data(listName);
      if (callbacks) {

      } else {
        callbacks = [];
      }
      callbacks.push(callback);
      $(this).data(listName, callbacks);
    });
    $(document).on('change', selector, function() {
      handleModified1($(this));
    });
    $(document).on('keyup', selector, function(e) {
      if (e.keyCode == 13) {
        handleModified($(this), false);
        handleModified($(this), true);
      } else
      if ((e.keyCode == 8) || (e.keyCode == 32)  || (e.keyCode == 91) || (e.keyCode == 93) || ((e.keyCode >= 48) && (e.keyCode <= 90)) || ((e.keyCode >= 96) && (e.keyCode <= 111)) || ((e.keyCode >= 186) && (e.keyCode <= 222))) {
        handleModified1($(this));
      }
    });
  }

  window.br.modifiedDeferred = function(selector, callback) {
    setupModified(selector, callback, true);
  }

  window.br.modified = function(selector, callback) {
    setupModified(selector, callback, false);
  }

  window.br.closeConfirmationMessage = 'Some changes have been made. Are you sure you want to close current window?';

  var closeConfirmationRequired = false;
  var windowUnloading = false;

  function brightConfirmClose() {
    if (closeConfirmationRequired) {
      return br.closeConfirmationMessage;
    } else {
      windowUnloading = true;
    }
  }

  $(window).on('beforeunload', function(){
    return brightConfirmClose();
  });

  window.br.isUnloading = function(value) {
    if (typeof value == 'undefined') {
      return windowUnloading;
    } else {
      windowUnloading = value;
    }
  }

  window.br.confirmClose = function(message) {
    if (message) {
      br.closeConfirmationMessage = message;
    }
    closeConfirmationRequired = true;
  }

  window.br.resetCloseConfirmation = function(message) {
    closeConfirmationRequired = false;
  }

  window.br.events = br.eventQueue();

  window.br.backToCaller = function(href, refresh) {

    var inPopup = (self.opener !== null);

    // check opener
    if (inPopup) {
      // is opener still exists?
      if (self.opener) {
        if (!self.opener.closed) {
          self.opener.focus();
          try {
            if (refresh) {
              if (self.opener.document) {
                self.opener.document.location.reload();
              }
            }
          } catch (e) {

          }
        }
      }
      self.close();
    } else
    if (br.request.get('caller')) {
      document.location = br.request.get('caller');
    } else {
      document.location = href;
    }

  }

  window.br.load = window.br.resourceLoader = function(j){function p(c,a){var g=j.createElement(c),b;for(b in a)a.hasOwnProperty(b)&&g.setAttribute(b,a[b]);return g}function m(c){var a=k[c],b,e;if(a)b=a.callback,e=a.urls,e.shift(),h=0,e.length||(b&&b.call(a.context,a.obj),k[c]=null,n[c].length&&i(c))}function u(){if(!b){var c=navigator.userAgent;b={async:j.createElement("script").async===!0};(b.webkit=/AppleWebKit\//.test(c))||(b.ie=/MSIE/.test(c))||(b.opera=/Opera/.test(c))||(b.gecko=/Gecko\//.test(c))||(b.unknown=!0)}}function i(c,
    a,g,e,h){var i=function(){m(c)},o=c==="css",f,l,d,q;u();if(a)if(a=typeof a==="string"?[a]:a.concat(),o||b.async||b.gecko||b.opera)n[c].push({urls:a,callback:g,obj:e,context:h});else{f=0;for(l=a.length;f<l;++f)n[c].push({urls:[a[f]],callback:f===l-1?g:null,obj:e,context:h})}if(!k[c]&&(q=k[c]=n[c].shift())){r||(r=j.head||j.getElementsByTagName("head")[0]);a=q.urls;f=0;for(l=a.length;f<l;++f)g=a[f],o?d=b.gecko?p("style"):p("link",{href:g,rel:"stylesheet"}):(d=p("script",{src:g}),d.async=!1),d.className=
    "lazyload",d.setAttribute("charset","utf-8"),b.ie&&!o?d.onreadystatechange=function(){if(/loaded|complete/.test(d.readyState))d.onreadystatechange=null,i()}:o&&(b.gecko||b.webkit)?b.webkit?(q.urls[f]=d.href,s()):(d.innerHTML='@import "'+g+'";',m("css")):d.onload=d.onerror=i,r.appendChild(d)}}function s(){var c=k.css,a;if(c){for(a=t.length;--a>=0;)if(t[a].href===c.urls[0]){m("css");break}h+=1;c&&(h<200?setTimeout(s,50):m("css"))}}var b,r,k={},h=0,n={css:[],js:[]},t=j.styleSheets;return{css:function(c,
    a,b,e){i("css",c,a,b,e)},js:function(c,a,b,e){i("js",c,a,b,e)}}}(document);

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function (window) {

  function BrFlagsHolder(permanent, name) {

    var flags = [];

    this.append = function(id) {
      if (permanent) {
        br.storage.appendUnique(name, id);
      } else
      if (this.isFlagged(id)) {
      } else {
        flags.push(id);
      }
    }

    this.isFlagged = function(id) {
      if (permanent) {
        return (br.storage.indexOf(name, id) != -1);
      } else {
        return (flags.indexOf(id) != -1);
      }
    }

    this.remove = function(id) {
      if (permanent) {
        br.storage.remove(name, id);
      } else {
        var idx = flags.indexOf(id);
        if (idx != -1) {
          flags.splice(idx, 1);
        }
      }
    }

    this.clear = function() {
      this.replace([]);
    }

    this.replace = function(values) {
      if (permanent) {
        return br.storage.set(name, values);
      } else {
        flags = values;
        return flags;
      }
    }

    this.get = function() {
      if (permanent) {
        return br.storage.get(name, []);
      } else {
        return flags;
      }
    }

  }

  window.br = window.br || {};

  window.br.flagsHolder = function (permanent, name) {
    return new BrFlagsHolder(permanent, name);
  }

})(window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  function BrDataSource(restServiceUrl, options) {

    var _this = this;

    this.ajaxRequest = null;
    this.name = '-';
    this.options = options || {};
    this.options.restServiceUrl = restServiceUrl;
    this.options.refreshDelay = this.options.refreshDelay || 500;
    if (this.options.restServiceUrl.charAt(this.options.restServiceUrl.length-1) != '/') {
      this.options.restServiceUrl = this.options.restServiceUrl + '/';
    }

    if (this.options.offlineMode) {
      this.db = TAFFY();
      this.db.store('taffy-db-' + name);
    }

    this.events = br.eventQueue(this);
    this.before = function(event, callback) { this.events.before(event, callback); }
    this.on     = function(event, callback) { this.events.on(event, callback); }
    this.after  = function(event, callback) { this.events.after(event, callback); }

    this.insert = function(item, callback) {

      function returnInsert(data) {

        var result;

        if (_this.options.crossdomain) {
          if (typeof data == 'string') {
            result = false;
            _this.events.trigger('error', 'insert', data.length > 0 ? data : 'Empty response. Was expecting new created records with ROWID.');
          } else {
            result = true;
            _this.events.trigger('insert', data);
          }
        } else {
          if (data) {
            result = true;
            _this.events.trigger('insert', data);
          } else {
            result = false;
            _this.events.trigger('error', 'insert', 'Empty response. Was expecting new created records with ROWID.');
          }
        }
        _this.events.triggerAfter('insert', result, data, request);
        if (result) {
          _this.events.trigger('change', 'insert', data);
        }
        if (typeof callback == 'function') { callback.call(_this, result, data, request); }

      }

      var request = item;

      try {

        _this.events.triggerBefore('insert', request);

        if (this.options.crossdomain) {
          request.crossdomain = 'put';
        }

        if (_this.options.offlineMode) {
          _this.db.insert(request);
          request.rowid = request.___id;
          request.syncState = 'n';
          returnInsert(request);
        } else {
          $.ajax({ type: this.options.crossdomain ? 'GET' : 'PUT'
                 , data: request
                 , dataType: this.options.crossdomain ? 'jsonp' : 'json'
                 , url: this.options.restServiceUrl + (this.options.authToken ? '?token=' + this.options.authToken : '')
                 , success: function(response) {
                     returnInsert(response);
                   }
                 , error: function(jqXHR, textStatus, errorThrown) {
                     if (br.isUnloading()) {

                     } else {
                       var errorMessage = (br.isEmpty(jqXHR.responseText) ? jqXHR.statusText : jqXHR.responseText);
                       _this.events.trigger('error', 'insert', errorMessage);
                       _this.events.triggerAfter('insert', false, errorMessage, request);
                       if (typeof callback == 'function') { callback.call(_this, false, errorMessage, request); }
                     }
                   }
                 });
        }

      } catch (error) {
        _this.events.trigger('error', 'insert', error);
        _this.events.triggerAfter('insert', false, error, request);
        if (typeof callback == 'function') { callback.call(_this, false, error, request); }
      }

    }

    this.update = function(rowid, item, callback) {

      function returnUpdate(data) {
        var operation = 'update';
        if (data) {
          var res = _this.events.trigger('removeAfterUpdate', item, data);
          if ((res !== null) && res) {
            operation = 'remove';
            _this.events.trigger('remove', rowid);
          } else {
            _this.events.trigger('update', data, rowid);
          }
        }
        _this.events.triggerAfter(operation, true, data, request);
        _this.events.trigger('change', operation, data);
        if (typeof callback == 'function') { callback.call(_this, true, data, request); }
      }

      var request = item;

      _this.events.triggerBefore('update', rowid, request);

      if (_this.options.offlineMode) {
        _this.db({rowid: rowid}).update(request);
        returnUpdate(request);
      } else {
        $.ajax({ type: 'POST'
               , data: request
               , dataType: 'json'
               , url: this.options.restServiceUrl + rowid + (this.options.authToken ? '?token=' + this.options.authToken : '')
               , success: function(response) {
                   returnUpdate(response);
                 }
               , error: function(jqXHR, textStatus, errorThrown) {
                   if (br.isUnloading()) {

                   } else {
                     var errorMessage = (br.isEmpty(jqXHR.responseText) ? jqXHR.statusText : jqXHR.responseText);
                     _this.events.trigger('error', 'update', errorMessage);
                     _this.events.triggerAfter('update', false, errorMessage, request);
                     if (typeof callback == 'function') { callback.call(_this, false, errorMessage, request); }
                   }
                 }
               });
      }

    }

    this.remove = function(rowid, callback) {

      function returnRemove(data) {
        _this.events.trigger('remove', rowid);
        _this.events.triggerAfter('remove', true, data, request);
        _this.events.trigger('change', 'remove', data);
        if (typeof callback == 'function') { callback.call(_this, true, data, request); }
      }

      var request = {};

      _this.events.triggerBefore('remove', null, rowid);

      if (_this.options.offlineMode) {
        var data = _this.db({rowid: rowid}).get();
        _this.db({rowid: rowid}).remove();
        returnRemove(data);
      } else {
        $.ajax({ type: 'DELETE'
               , data: request
               , dataType: 'json'
               , url: this.options.restServiceUrl + rowid + (this.options.authToken ? '?token=' + this.options.authToken : '')
               , success: function(response) {
                   returnRemove(response);
                 }
               , error: function(jqXHR, textStatus, errorThrown) {
                   if (br.isUnloading()) {

                   } else {
                     var errorMessage = (br.isEmpty(jqXHR.responseText) ? jqXHR.statusText : jqXHR.responseText);
                     _this.events.trigger('error', 'remove', errorMessage);
                     _this.events.triggerAfter('remove', false, errorMessage, request);
                     if (typeof callback == 'function') { callback.call(_this, false, errorMessage, request); }
                   }
                 }
               });
      }

    }

    this.selectCount = function(filter, callback, options) {

      if (typeof filter == 'function') {
        options = callback;
        callback = filter;
      }

      var newFilter = {};
      for(var i in filter) {
        newFilter[i] = filter[i];
      }
      newFilter.__result = 'count';

      options = options || {};
      options.result = 'count';

      this.select(newFilter, callback, options);

    }

    this.selectOne = function(rowid, callback, options) {

      return this.select({ rowid: rowid ? rowid : '-' }, callback, options);

    }

    this.select = function(filter, callback, options) {

      function handleSuccess(data) {
        if (!disableEvents) {
          _this.events.trigger('select', data);
          _this.events.triggerAfter('select', true, data, request);
        }
        if (typeof callback == 'function') { callback.call(_this, true, data, request); }
      }

      function handleError(error, response) {
        if (!disableEvents) {
          _this.events.trigger('error', 'select', error);
          _this.events.triggerAfter('select', false, error, request);
        }
        if (typeof callback == 'function') { callback.call(_this, false, error, request); }
      }

      var disableEvents = options && options.disableEvents;

      var request = { };
      var requestRowid;

      if (typeof filter == 'function') {
        options = callback;
        callback = filter;
      } else
      if (filter) {
        for(var i in filter) {
          if (i != 'rowid') {
            request[i] = filter[i];
          } else {
            requestRowid = filter[i];
          }
        }
      }

      options = options || { };

      var url = this.options.restServiceUrl;
      if (requestRowid) {
        url = url + requestRowid;
      }

      var proceed = true;

      if (!disableEvents) {
        try {
          _this.events.triggerBefore('select', request, options);
        } catch(e) {
          proceed = false;
        }
      }

      if (proceed) {
        if (this.options.limit) {
          request.__limit = this.options.limit;
        }

        if (options && options.skip) {
          request.__skip = options.skip;
        }

        if (options && options.limit) {
          request.__limit = options.limit;
        }

        if (options && options.fields) {
          request.__fields = options.fields;
        }

        if (options && options.order) {
          request.__order = options.order;
        }

        if (this.options.crossdomain) {
          request.crossdomain = 'get';
        }

        if (_this.options.offlineMode) {
          handleSuccess(_this.db(request).get());
        } else {
          this.ajaxRequest = $.ajax({ type: 'GET'
                                    , data: request
                                    , dataType: this.options.crossdomain ? 'jsonp' : 'json'
                                    , url: url + (this.options.authToken ? '?token=' + this.options.authToken : '')
                                    , success: function(response) {
                                        _this.ajaxRequest = null;
                                        if (_this.options.crossdomain && (typeof response == 'string')) {
                                          handleError('', response);
                                        } else
                                        if (response) {
                                          handleSuccess(response);
                                        } else {
                                          handleError('', response);
                                        }
                                      }
                                    , error: function(jqXHR, textStatus, errorThrown) {
                                        if (br.isUnloading()) {

                                        } else {
                                          _this.ajaxRequest = null;
                                          var errorMessage = (br.isEmpty(jqXHR.responseText) ? jqXHR.statusText : jqXHR.responseText);
                                          handleError(errorMessage, jqXHR);
                                        }
                                      }
                                    });
        }
      } else {

      }

    }

    this.requestInProgress = function() {
      return (this.ajaxRequest !== null);
    }

    this.abortRequest = function() {
      if (this.ajaxRequest !== null) {
        this.ajaxRequest.abort();
      }
    }

    this.invoke = function(method, params, callback) {

      var request = { };

      if (typeof params == 'function') {
        callback = params;
      } else {
        request = params;
      }

      _this.events.triggerBefore('' + method, request);

      if (this.options.crossdomain) {
        request.crossdomain = 'post';
      }

      $.ajax({ type: this.options.crossdomain ? 'GET' : 'POST'
             , data: request
             , dataType: this.options.crossdomain ? 'jsonp' : 'json'
             , url: this.options.restServiceUrl + method + (this.options.authToken ? '?token=' + this.options.authToken : '')
             , success: function(response) {
                 if (_this.options.crossdomain && (typeof response == 'string')) {
                   _this.events.trigger('error', method, response);
                   _this.events.triggerAfter('' + method, false, response, request);
                   if (typeof callback == 'function') { callback.call(_this, false, response, request); }
                 } else {
                   _this.events.trigger(method, response, params);
                   _this.events.triggerAfter('' + method, true, response, request);
                   if (typeof callback == 'function') { callback.call(_this, true, response, request); }
                 }
               }
             , error: function(jqXHR, textStatus, errorThrown) {
                 if (br.isUnloading()) {

                 } else {
                   var errorMessage = (br.isEmpty(jqXHR.responseText) ? jqXHR.statusText : jqXHR.responseText);
                   _this.events.trigger('error', method, errorMessage);
                   _this.events.triggerAfter('' + method, false, errorMessage, request);
                   if (typeof callback == 'function') { callback.call(_this, false, errorMessage, request); }
                 }
               }
             });

    }

    this.fillCombo = function(selector, data, options) {

      options = options || { };

      var valueField = options.valueField || 'rowid';
      var nameField = options.nameField || 'name';
      var hideEmptyValue = options.hideEmptyValue || false;
      var emptyValue = options.emptyValue || '--any--';
      var selectedValue = options.selectedValue || null;
      var selectedValueField = options.selectedValueField || null;

      $(selector).each(function() {
        var val = $(this).val();
        if (br.isEmpty(val)) {
          val = $(this).attr('data-value');
          $(this).removeAttr('data-value');
        }
        $(this).html('');
        var s = '';
        if (!hideEmptyValue) {
          s = s + '<option value="">' + emptyValue + '</option>';
        }
        for(var i in data) {
          if (!selectedValue && selectedValueField) {
            if (data[i][selectedValueField] == '1') {
              selectedValue = data[i][valueField];
            }
          }
          s = s + '<option value="' + data[i][valueField] + '">' + data[i][nameField] + '</option>';
        }
        $(this).html(s);
        if (!br.isEmpty(selectedValue)) {
          val = selectedValue;
        }
        if (!br.isEmpty(val)) {
          $(this).find('option[value=' + val +']').attr('selected', 'selected');
        }
      });

    }

    var refreshTimeout;

    this.deferredSelect = function(filter, callback, msec) {

      msec = msec || this.options.refreshDelay;
      var savedFilter = {}
      for(var i in filter) {
        savedFilter[i] = filter[i];
      }
      window.clearTimeout(refreshTimeout);
      refreshTimeout = window.setTimeout(function() {
        _this.select(savedFilter, callback);
      }, msec);

    }

  }

  window.br = window.br || {};

  window.br.dataSource = function (restServiceUrl, options) {
    return new BrDataSource(restServiceUrl, options);
  }

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  function BrDataGrid(selector, rowTemplate, dataSource, options) {

    var _this = this;

    this.selector = $(selector);
    this.options = options || {};
    this.options.templates = this.options.templates || {};
    this.options.templates.row = $(rowTemplate).html();
    this.options.templates.groupRow = this.options.templates.groupRow ? $(this.options.templates.groupRow).html() : '';
    this.options.templates.header = this.options.templates.header ? $(this.options.templates.header).html() : '';
    this.options.templates.footer = this.options.templates.footer ? $(this.options.templates.footer).html() : '';
    this.options.templates.noData = this.options.templates.noData ? $(this.options.templates.noData).html() : '';
    this.options.dataSource = dataSource;
    this.options.selectors = this.options.selectors || {};
    this.options.selectors.header = this.options.selectors.header || this.options.headersSelector || this.selector;
    this.options.selectors.footer = this.options.selectors.footer || this.options.footersSelector || this.selector;
    this.options.selectors.remove = this.options.selectors.remove || this.options.deleteSelector  || '.action-delete';

    this.dataSource = this.options.dataSource;
    this.storageTag = document.location.pathname + this.dataSource.options.restServiceUrl;

    this.events = br.eventQueue(this);
    this.before = function(event, callback) { this.events.before(event, callback); }
    this.on     = function(event, callback) { this.events.on(event, callback); }
    this.after  = function(event, callback) { this.events.after(event, callback); }

    var loadingMoreData = false;
    var noMoreData = false;

    this.after('insert', function(data) {
      _this.events.trigger('change', data, 'insert');
      _this.events.triggerAfter('change', data, 'insert');
    });

    this.after('update', function(data) {
      _this.events.trigger('change', data, 'update');
      _this.events.triggerAfter('change', data, 'update');
    });

    this.after('remove', function(data) {
      _this.events.trigger('change', data, 'remove');
      _this.events.triggerAfter('change', data, 'remove');
    });

    this.renderHeader = function(data) {
      data = _this.events.trigger('renderHeader', data) || data;
      return $(br.fetch(_this.options.templates.header, data));
    }

    this.renderFooter = function(data) {
      data = _this.events.trigger('renderFooter', data) || data;
      return $(br.fetch(_this.options.templates.footer, data));
    }

    this.renderRow = function(data) {
      data = _this.events.trigger('renderRow', data) || data;
      var result = $(br.fetch(_this.options.templates.row, data));
      result.data('data-row', data);
      return result;
    }

    this.renderGroupRow = function(data) {
      data = _this.events.trigger('renderGroupRow', data) || data;
      var result = $(br.fetch(_this.options.templates.groupRow, data));
      result.data('data-row', data);
      return result;
    }

    this.prepend = function(row) {
      return _this.selector.prepend(row);
    }

    this.append = function(row) {
      return _this.selector.append(row);
    }

    this.addDataRow = function(row) {
      _this.events.triggerBefore('insert', row);
      var tableRow = _this.renderRow(row);
      _this.events.trigger('insert', row, tableRow);
      if (_this.options.appendInInsert) {
        _this.append(tableRow);
      } else {
        _this.prepend(tableRow);
      }
      _this.events.triggerAfter('insert', row, tableRow);
      return tableRow;
    }

    this.reloadRow = function(rowid) {
      _this.dataSource.selectOne(rowid, function(result, response) {
        if (result) {
          if (_this.refreshRow(response)) {

          } else {

          }
        }
      }, {disableEvents: true});
    }

    this.refreshRow = function(data) {
      var row = _this.selector.find('[data-rowid=' + data.rowid + ']');
      if (row.length == 1) {
        var ctrl = _this.renderRow(data);
        var s = ctrl.html();
        ctrl.remove();
        if (s.length > 0) {
          _this.events.triggerBefore('update', data);
          var $row0 = $(row[0]);
          _this.events.trigger('update', data, $row0);
          $(row[0]).html(s);
          _this.events.triggerAfter('update', data, $row0);
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }

    this.getOrder = function() {
      var order = _this.getOrderAndGroup();
      var result = {};
      if (br.isArray(order)) {
        for(var i = 0; i < order.length; i++) {
          if (order[i].asc) {
            result[order[i].fieldName] = 1;
          } else {
            result[order[i].fieldName] = -1;
          }
        }
      }
      return result;
    }
    this.setOrderAndGroup = function(order) {
      br.storage.set(this.storageTag + 'orderAndGroup', order);
    }
    this.getOrderAndGroup = function() {
      return br.storage.get(this.storageTag + 'orderAndGroup', []);
    }

    this.loadMore = function() {
      if (noMoreData || loadingMoreData) {

      } else {
        loadingMoreData = true;
        _this.dataSource.select(function(result, response) {
          loadingMoreData = false;
        });
      }
    }

    this.init = function() {

      function isGridEmpty() {
        return (_this.selector.find('[data-rowid]').length === 0);
      }

      function checkForEmptyGrid() {
        if (isGridEmpty()) {
          _this.events.triggerBefore('nodata');
          _this.selector.html(_this.options.templates.noData);
          _this.events.trigger('nodata');
          _this.events.triggerAfter('nodata');
        }
      }

      var order = _this.getOrderAndGroup();
      if (br.isArray(order)) {
        for(i = 0; i < order.length; i++) {
          $('.sortable[data-field="' + order[i].fieldName + '"].' + (order[i].asc ? 'order-asc' : 'order-desc'), $(this.options.selectors.header)).addClass('icon-white').addClass('icon-border');
        }
      }

      $('.sortable', $(_this.options.selectors.header)).each(function() {
        if ($(this).attr('data-sort-order')) {
        } else {
          $(this).attr('data-no-sort-order', true);
        }
      });

      $(this.options.selectors.header).on('click', '.sortable', function() {
        var sorted = ($(this).hasClass('icon-white') || $(this).hasClass('icon-border'));
        if (br.isEmpty($(this).attr('data-sort-order'))) {
          $('.sortable', $(_this.options.selectors.header)).removeClass('icon-white').removeClass('icon-border');
        } else {
          $('.sortable[data-no-sort-order]', $(_this.options.selectors.header)).removeClass('icon-white').removeClass('icon-border');
        }
        if (sorted) {
          $(this).removeClass('icon-white').removeClass('icon-border');
        } else {
          $(this).siblings('i').removeClass('icon-white').removeClass('icon-border');
          $(this).addClass('icon-white').addClass('icon-border');
        }
        var tmp = [];
        var maxIndex = 0;
        $('.sortable', $(_this.options.selectors.header)).each(function() {
          if ($(this).hasClass('icon-white') || $(this).hasClass('icon-border')) {
            var index = br.isEmpty($(this).attr('data-order-index')) ? maxIndex : br.toInt($(this).attr('data-order-index'));
            maxIndex = index + 1;
            tmp.push({ fieldName: $(this).attr('data-field'), asc: $(this).hasClass('order-asc'), group: $(this).hasClass('group-by'), index: index });
          }
        });
        tmp.sort(function(a, b) {
          if (a.index < b.index) {
            return -1;
          } else
          if (a.index < b.index) {
            return 1;
          } else {
            return 0;
          }
        });
        _this.setOrderAndGroup(tmp);
        _this.dataSource.select();
      });


      if (_this.dataSource) {

        _this.dataSource.before('select', function(request, options) {
          options.order = _this.getOrder();
          if (!loadingMoreData) {
            _this.selector.html('');
            _this.selector.addClass('progress-big');
          }
        });

        _this.dataSource.after('select', function(result, response, request) {
          _this.selector.removeClass('progress-big');
          if (result) {
            noMoreData = (response.length == 0);
            _this.render(response, loadingMoreData);
          }
        });

        _this.dataSource.after('insert', function(success, response) {
          if (success) {
            if (isGridEmpty()) {
              _this.selector.html(''); // to remove No-Data box
            }
            _this.addDataRow(response);
          }
        });

        _this.dataSource.on('update', function(data) {
          if (_this.refreshRow(data)) {

          } else {
            _this.dataSource.select();
          }
        });

        _this.dataSource.on('remove', function(rowid) {
          var row = _this.selector.find('[data-rowid=' + rowid + ']');
          if (row.length > 0) {
            if (br.isTouchScreen()) {
              _this.events.triggerBefore('remove', rowid);
              _this.events.trigger('remove', rowid, row);
              row.remove();
              checkForEmptyGrid();
              _this.events.triggerAfter('remove', rowid, row);
            } else {
              _this.events.triggerBefore('remove', rowid);
              row.fadeOut(function() {
                _this.events.trigger('remove', rowid, $(this));
                $(this).remove();
                _this.events.triggerAfter('remove', rowid, $(this));
                checkForEmptyGrid();
              });
            }
          } else {
            _this.dataSource.select();
          }
        });

        if (this.options.selectors.remove) {
          _this.selector.on('click', this.options.selectors.remove, function() {
            var row = $(this).closest('[data-rowid]');
            if (row.length > 0) {
              var rowid = $(row).attr('data-rowid');
              if (!br.isEmpty(rowid)) {
                br.confirm( 'Delete confirmation'
                          , 'Are you sure you want delete this record?'
                          , function() {
                              _this.dataSource.remove(rowid);
                            }
                          );
              }
            }
          });
        }

      }

    }

    this.render = function(data, loadingMoreData) {
      _this.events.triggerBefore('change', data, 'render');
      if (data) {
        var i;
        if (!loadingMoreData) {
          _this.selector.html('');
        }
        if (_this.options.freeGrid) {
          if (data.headers) {
            for (var i in data.headers) {
              if (data.headers[i]) {
                $(_this.options.selectors.header).append(_this.renderHeader(data.headers[i]));
              }
            }
          }
          if (data.footers) {
            for (var i in data.footers) {
              if (data.footers[i]) {
                $(_this.options.selectors.footer).append(_this.renderFooter(data.headers[i]));
              }
            }
          }
          $(_this.options.selectors.header).html('');
          $(_this.options.selectors.footer).html('');
          if (data.rows) {
            if (data.rows.length === 0) {
              _this.selector.html(this.options.templates.noData);
            } else {
              for (var i in data.rows) {
                if (data.rows[i]) {
                  if (data.rows[i].row) {
                    _this.selector.append(_this.renderRow(data.rows[i].row));
                  }
                  if (data.rows[i].header) {
                    $(_this.options.selectors.header).append(_this.renderHeader(data.rows[i].header));
                  }
                  if (data.rows[i].footer) {
                    $(_this.options.selectors.footer).append(_this.renderFooter(data.rows[i].footer));
                  }
                }
              }
            }
          } else {
            _this.selector.html(this.options.templates.noData);
          }
        } else {
          if (data && (data.length > 0)) {
            var group = _this.getOrderAndGroup();
            var groupValues = {};
            var groupFieldName = '';
            for (var i in data) {
              if (data[i]) {
                if (br.isArray(group)) {
                  for(var k = 0; k < group.length; k++) {
                    groupFieldName = group[k].fieldName;
                    if (group[k].group && (groupValues[groupFieldName] != data[i][groupFieldName])) {
                      for(var j = k; j < group.length; j++) {
                        groupFieldName = group[j].fieldName;
                        groupValues[groupFieldName] = undefined;
                      }
                      break;
                    }
                  }
                  for(var k = 0; k < group.length; k++) {
                    groupFieldName = group[k].fieldName;
                    if (group[k].group && (groupValues[groupFieldName] != data[i][groupFieldName])) {
                      groupValues[groupFieldName] = data[i][groupFieldName];
                      var tmp = data[i];
                      tmp.__groupBy = {};
                      tmp.__groupBy['__field'] = groupFieldName;
                      tmp.__groupBy['__value'] = data[i][groupFieldName];
                      tmp.__groupBy[groupFieldName] = true;
                      _this.selector.append(_this.renderGroupRow(tmp));
                    }
                  }
                }
                _this.selector.append(_this.renderRow(data[i]));
              }
            }
          } else
          if (!loadingMoreData) {
            _this.selector.html(this.options.templates.noData);
          }
        }
      } else {
        _this.selector.html(this.options.templates.noData);
      }
      _this.events.trigger('change', data, 'render');
      _this.events.triggerAfter('change', data, 'render');
    }

    return this.init();

  }

  window.br = window.br || {};

  window.br.dataGrid = function (selector, rowTemplate, dataSource, options) {
    return new BrDataGrid(selector, rowTemplate, dataSource, options);
  }

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  function BrDataCombo(selector, dataSource, options) {

    var _this = this;

    this.selector = $(selector);
    this.dataSource = dataSource;
    this.options = options || {};
    this.fields = this.options.fields || {};
    this.saveSelection = this.options.saveSelection || false;
    this.selectedValueField = this.options.selectedValueField || null;
    this.noDecoration = this.options.noDecoration || false;

    this.events = br.eventQueue(this);
    this.before = function(event, callback) { this.events.before(event, callback); }
    this.on     = function(event, callback) { this.events.on(event, callback); }
    this.after  = function(event, callback) { this.events.after(event, callback); }

    this.isValid = function() {
      return _this.selector.length > 0;
    }

    function storageTag(c) {
      return document.location.pathname + ':filter-value:' + $(c).attr('name');
    }

    function uiSync() {
      if (_this.isValid() && window.Select2 && !_this.noDecoration) {
        _this.selector.select2();
      }
    }

    this.val = function(value) {
      if (value !== undefined) {
        if (_this.saveSelection) {
          br.storage.set(storageTag(_this.selector), value);
        }
        if (_this.isValid()) {
          _this.selector.val(value);
          uiSync();
        }
      }
      if (_this.isValid()) {
        return _this.selector.val();
      } else {
        return undefined;
      }
    }

    this.valOrNull = function() {
      var val = this.val();
      return br.isEmpty(val) ? null : val;
    }

    this.reset = function(triggerChange) {
      br.storage.remove(storageTag(this.selector));
      if (_this.isValid()) {
        this.selector.val('');
        if (triggerChange) {
          _this.selector.trigger('change');
        } else {
          uiSync();
        }
      }
    }

    this.selector.on('reset', function() {
      _this.reset();
    });

    function render(data) {

      if (_this.isValid()) {
        var options = _this.options;

        if (_this.saveSelection) {
          options.selectedValue = br.storage.get(storageTag(_this.selector));
        }

        var valueField = options.valueField || 'rowid';
        var nameField = options.nameField || 'name';
        var hideEmptyValue = options.hideEmptyValue || (_this.selector.attr('multiple') == 'multiple');
        var levelField = options.levelField || null;
        var emptyName = (typeof options.emptyName == 'undefined' ? '--any--' : options.emptyName);
        var emptyValue = (typeof options.emptyValue == 'undefined' ? '' : options.emptyValue);
        var selectedValue = options.selectedValue || null;
        var selectedValueField = options.selectedValueField || null;

        _this.selector.each(function() {
          var val = $(this).val();
          if (br.isEmpty(val)) {
            val = $(this).attr('data-value');
            $(this).removeAttr('data-value');
          }
          $(this).html('');
          var s = '';
          if (!hideEmptyValue) {
            s = s + '<option value="' + emptyValue + '">' + emptyName + '</option>';
          }
          for(var i in data) {
            if (!selectedValue && selectedValueField) {
              if (data[i][selectedValueField] == '1') {
                selectedValue = data[i][valueField];
              }
            }
            s = s + '<option value="' + data[i][valueField] + '">';
            if (levelField !== null) {
              var margin = (br.toInt(data[i][levelField]) - 1) * 4;
              for(var k = 0; k < margin; k++) {
                s = s + '&nbsp;';
              }
            }
            s = s + data[i][nameField];
            s = s + '</option>';
          }
          $(this).html(s);
          if (!br.isEmpty(selectedValue)) {
            val = selectedValue;
          }
          if (!br.isEmpty(val)) {
            $(this).find('option[value=' + val +']').attr('selected', 'selected');
          }

        });

        uiSync();
      }

      _this.events.trigger('load', data);

    }

    _this.load = _this.reload = function(filter, callback) {
      if (typeof filter == 'function') {
        callback = filter;
        filter = {};
      }
      _this.dataSource.select(filter, function(result, response) {
        if (result) {
          if (callback) {
            callback.call(_this.selector, result, response);
          }
          uiSync();
        }
      }, { fields: _this.fields });
    }

    _this.dataSource.on('select', function(data) {
      render(data);
    });

    _this.dataSource.on('insert', function(data) {

    });

    _this.dataSource.on('update', function(data) {

    });

    _this.dataSource.on('remove', function(rowid) {
      if (_this.isValid()) {
        _this.selector.find('option[value=' + rowid +']').remove();
      }
      _this.events.trigger('change');
    });

    _this.selector.change(function() {
      if (_this.saveSelection) {
        br.storage.set(storageTag(this), $(this).val());
      }
      _this.events.trigger('change');
      uiSync();
    });

  }

  window.br = window.br || {};

  window.br.dataCombo = function (selector, dataSource, options) {
    return new BrDataCombo(selector, dataSource, options);
  }

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  function BrEditable(ctrl, saveCallback) {

    var _this = this;
    _this.ctrl = $(ctrl);
    _this.saveCallback = saveCallback;
    _this.editor = null;
    _this.tooltip = null;
    _this.savedWidth = '';
    _this.click = function(element, e) {
      if (!_this.activated()) {
        var content = _this.ctrl.text();
        _this.ctrl.data('original-content', content);
        _this.ctrl.data('original-width', _this.ctrl.css('width'));
        var width = _this.ctrl.innerWidth();
        var height = _this.ctrl.innerHeight();
        _this.ctrl.text('');
        _this.editor = $('<input type="text" />');
        _this.editor.css('width', '100%');
        _this.editor.css('height', '100%');
        _this.editor.css('min-height', '30px');
        _this.editor.css('font-size', _this.ctrl.css('font-size'));
        _this.editor.css('font-weight', _this.ctrl.css('font-weight'));
        _this.editor.css('box-sizing', '100%');
        _this.editor.css('-webkit-box-sizing', 'border-box');
        _this.editor.css('-moz-box-sizing', 'border-box');
        _this.editor.css('-ms-box-sizing', 'border-box');
        _this.editor.css('margin-top', '2px');
        _this.editor.css('margin-bottom', '2px');
        _this.editor.val(content);
        _this.ctrl.append(_this.editor);
        _this.ctrl.css('width', width - 10);
        _this.editor.focus();
        _this.editor.attr('data-original-title', 'Press [Enter] to save changes, [Esc] to cancel changes.');
        _this.editor.tooltip({placement: 'bottom', trigger: 'focus'});
        _this.editor.tooltip('show');
        _this.tooltip = _this.editor.data('tooltip');
        $(_this.editor).keyup(function(e) {
          if (e.keyCode == 13) {
            var content = $(this).val();
            if (typeof _this.saveCallback == 'function') {
              _this.editor.tooltip('hide');
              _this.saveCallback.call(_this.ctrl, content);
            } else {
              _this.apply(content);
            }
          }
          if (e.keyCode == 27) {
            _this.cancel();
          }
        });
      }
    }
    _this.activated = function() {
      return _this.editor !== null;
    }
    _this.apply = function(content) {
      _this.tooltip.hide();
      _this.editor.remove();
      _this.editor = null;
      _this.ctrl.text(content);
      _this.ctrl.css('width', '');
    }
    _this.cancel = function() {
      _this.tooltip.hide();
      _this.editor.remove();
      _this.editor = null;
      _this.ctrl.text(_this.ctrl.data('original-content'));
      _this.ctrl.css('width', '');
    }

  }

  window.br = window.br || {};

  window.br.editable = function(selector, callback, value) {
    if (typeof callback == 'string') {
      var data = $(selector).data('editable');
      if (data) {
        data[callback](value);
      }
    } else {
      $(selector).live('click', function(e) {
        var $this = $(this)
          , data = $this.data('editable');
        if (!data) {
          $this.data('editable', (data = new BrEditable(this, callback)));
        }
        data.click(e);
      });
    }
  }

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  window.br = window.br || {};

  window.br.showError = function(s) {
    alert(s);
  };

  window.br.growlError = function(s, image) {
    if (!br.isEmpty(s)) {
      if (typeof $.gritter != 'undefined') {
        $.gritter.add({
            title: 'Error'
          , text: s
          , class_name: 'gritter-red'
          , image: image
        });
      } else
      if (typeof window.humane != 'undefined') {
        humane.log(s, { addnCls     : 'humane-jackedup-error humane-original-error'
                      //, clickToClose: true
                      , timeout     : 5000
                      });
      } else {
        alert(s);
      }
    }
  };

  window.br.showMessage = function(s) {
    if (!br.isEmpty(s)) {
      alert(s);
    }
  };

  window.br.growlMessage = function(s, title, image) {
    if (!br.isEmpty(s)) {
      if (typeof $.gritter != 'undefined') {
        if (br.isEmpty(title)) {
          title = ' ';
        }
        $.gritter.add({
            title: title
          , text: s
          , class_name: 'gritter-light'
          , image: image
        });
      } else
      if (typeof window.humane != 'undefined') {
        humane.log(s);
      } else {
        alert(s);
      }
    }
  };

  window.br.panic = function(s) {
    $('.container').html('<div class="row"><div class="span12"><div class="alert alert-error"><h4>Error!</h4><p>' + s + '</p></div></div></div>');
    throw '';
  }

  window.br.confirm = function(title, message, buttons, callback, params) {
    if (typeof buttons == 'function') {
      params   = callback;
      callback = buttons;
      buttons  = null;
    }
    params = params || {};
    var s = '<div class="modal';
    if (params.cssClass) {
      s = s + ' ' + params.cssClass;
    }

    s = s + '">'+
            '<div class="modal-header"><h3>' + title + '</h3></div>' +
            '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer">';
    if (params.showDontAskMeAgain) {
      var dontAskMeAgainTitle = (params.dontAskMeAgainTitle) ? params.dontAskMeAgainTitle : "Don't ask me again";
      s = s + ' <label style="text-align: left; float: left;" class="checkbox">' +
                '<input name="showDontAskMeAgain" type="checkbox" value="1"> ' + dontAskMeAgainTitle +
                '</label>';
    }
    if (br.isEmpty(buttons)) {
      s = s + '<a href="javascript:;" class="btn btn-primary action-confirm-close" rel="confirm">Yes</a>';
    } else {
      for(var i in buttons) {
        s = s + '<a href="javascript:;" class="btn action-confirm-close" rel="' + i + '">' + buttons[i] + '</a>';
      }
    }
    s = s + '<a href="javascript:;" class="btn action-confirm-cancel">&nbsp;Cancel&nbsp;</a>';
    s = s + '</div></div>';
    var dialog = $(s);
    $(dialog)
      .on('show', function(e) {
        $(this).find('.action-confirm-close').click(function() {
          if (params.showDontAskMeAgain) {
            callback.call(dialog, $(this).attr('rel'), $('input[name=showDontAskMeAgain]', $(dialog)).is(':checked'));
          } else {
            callback.call(dialog, $(this).attr('rel'));
          }
          $(dialog).modal('hide');
        });
        $(this).find('.action-confirm-cancel').click(function() {
          if (params.onCancel) {
            params.onCancel.call(dialog);
          }
          $(dialog).modal('hide');
        });
      })
      .on('hide', function(e) {
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.error = function(title, message, callback) {
    var s = '<div class="modal">';
    if (title !== '') {
      s = s + '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>';
    }
    s = s + '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer" style="background-color:red;"><a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Dismiss&nbsp;</a></div></div>';
    var dialog = $(s);
    $(dialog)
      .on('hide', function(e) {
        if (callback) {
          callback.call(this);
        }
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.inform = function(title, message, callback) {
    var s = '<div class="modal">';
    if (title !== '') {
      s = s + '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>';
    }
    s = s + '<div class="modal-body">' + message + '</div>' +
            '<div class="modal-footer"><a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Dismiss&nbsp;</a></div></div>';
    var dialog = $(s);
    $(dialog)
      .on('hide', function(e) {
        if (callback) {
          callback.call(this);
        }
        dialog.remove();
      });
    $(dialog).modal();
  }

  window.br.prompt = function(title, fields, callback, options) {

    options = options || {};
    var s = '<div class="modal">'+
            '<div class="modal-header"><a class="close" data-dismiss="modal">×</a><h3>' + title + '</h3></div>' +
            '<div class="modal-body">';

    var inputs = {}

    if (br.isObject(fields)) {
      inputs = fields;
    } else {
      inputs[fields] = '';
    }

    for(var i in inputs) {
      if (br.isObject(inputs[i])) {
        s = s + '<label>' + i + '</label>'
              + '<input type="text" '
              + (inputs[i].id ? 'id="'+inputs[i].id+'"' : '')
              + ' class="span4 ' + (br.isEmpty(inputs[i]['class']) ? '' : inputs[i]['class']) + '"'
              + ' value="' + inputs[i].value + '"'
              + ' data-click-on-enter=".action-confirm-close" />';
      } else {
        s = s + '<label>' + i + '</label>' +
                '<input type="text" class="span4" value="' + inputs[i] + '" data-click-on-enter=".action-confirm-close" />';
      }
    }

    s = s + '</div>' +
            '<div class="modal-footer">';
    s = s + '<a href="javascript:;" class="btn btn-primary action-confirm-close" rel="confirm" >Ok</a>';
    s = s + '<a href="javascript:;" class="btn" data-dismiss="modal">&nbsp;Cancel&nbsp;</a>';
    s = s + '</div></div>';
    var dialog = $(s);
    $(dialog)
      .on('shown', function(e) {
        $(this).find('input[type=text]')[0].focus();
      })
      .on('show', function(e) {
        $(this).find('.action-confirm-close').click(function() {
          $(dialog).modal('hide');
          var results = [];
          $(this).closest('div.modal').find('input[type=text]').each(function() {
            results.push($(this).val());
          });
          callback.call(this, results);
        });
      })
      .on('hide', function(e) {
        dialog.remove();
        if (options.onhide) {
          options.onhide.call(this);
        }
      });
    $(dialog).modal();
  }

  var noTemplateEngine = false;

  window.br.fetch = function(template, data, tags) {
    data = data || {};
    if (template) {
      if (typeof window.Mustache == 'undefined') {
        if (typeof window.Handlebars == 'undefined') {
          if (!noTemplateEngine) {
            noTemplateEngine = true;
            this.showError('Template engine not found. Please link bright/3rdparty/mustache.js or bright/3rdparty/handlebars.js.');
          }
        } else {
          var t = Handlebars.compile(template);
          return t(data);
        }
      } else {
        return Mustache.render(template, data);
      }
    } else {
      return '';
    }
  };

  var progressCounter = 0;

  window.br.showAJAXProgress = function() {
    progressCounter++;
    $('.ajax-in-progress').css('visibility', 'visible');
  }

  window.br.hideAJAXProgress = function() {
    progressCounter--;
    if (progressCounter <= 0) {
      $('.ajax-in-progress').css('visibility', 'hidden');
      progressCounter = 0;
    }
  }

  window.br.jsonEncode = function(data) {
    return JSON.stringify(data);
  }
  window.br.jsonDecode = function(data) {
    try {
      return JSON.parse(data);
    } catch(ex) {
      return null;
    }
  }

  $(document).ready(function() {

    var notAuthorized = false;

    $('body').ajaxStart(function() {
      br.showAJAXProgress();
    });

    $('body').ajaxStop(function() {
      br.hideAJAXProgress();
    });

    $('body').ajaxError(function(event, jqXHR, ajaxSettings, thrownError) {
      if (jqXHR.status == 401) {
        if (!notAuthorized) {
          notAuthorized = true;
          br.growlError('You are trying to run operation which require authorization.');
        }
      }
    });

    $(document).on('keypress', 'input[data-click-on-enter]', function(e) {
      if (e.keyCode == 13) { $($(this).attr('data-click-on-enter')).trigger('click'); }
    });

    if ($('.focused').length > 0) {
      try { $('.focused')[0].focus(); } catch (ex) { }
    }

  });

})(jQuery, window);
/*!
 * Bright 0.0.5
 *
 * Copyright 2012, Sergiy Lavryk (jagermesh@gmail.com)
 * Dual licensed under the MIT or GPL Version 2 licenses.
  * http://brightfw.com
 *
 */

;(function ($, window) {

  window.br = window.br || {};

  window.br.onPaste = function(callback) {

    $(document).ready(function() {
      $('body').on('paste', function(evt) {
        var result = { data: { }, dataType: '', dataSubType: '' };
        evt = evt.originalEvent;
        if (evt.clipboardData) {
          var filesFound = -1;
          for(var i = 0; i < evt.clipboardData.types.length; i++) {
            var dataType = evt.clipboardData.types[i];
            if (dataType == 'Files') {
              filesFound = i;
            } else {
              var data = evt.clipboardData.getData(dataType);
              var parts = /^(.+?)\/(.+?)$/.exec(dataType);
              if (parts) {
                result['dataType'] = parts[1];
                result['dataSubType'] = parts[2];
              } else {
                result['dataType'] = 'text';
                result['dataSubType'] = 'generic';
              }
              result['data'][result['dataType']] = result['data'][result['dataType']] || { };
              result['data'][result['dataType']][result['dataSubType']] = data;
            }
          }
          if (filesFound == -1) {
            return callback(result);
          } else {
            var file, reader;
            var loaded = false;
            file = evt.clipboardData.items[filesFound].getAsFile();
            reader = new FileReader();
            reader.onload = function(evt) {
              var data = evt.target.result;
              var parts = /^data[:](.+?)\/(.+?);/.exec(data);
              if (parts) {
                result['dataType'] = parts[1];
                result['dataSubType'] = parts[2];
              } else {
                result['dataType'] = 'binary';
                result['dataSubType'] = 'generic';
              }
              result['data'][result['dataType']] = result['data'][result['dataType']] || { };
              result['data'][result['dataType']][result['dataSubType']] = data;
              callback(result);
            };
            reader.readAsDataURL(file);
          }
        }
      });
    });

  }

})(jQuery, window);
