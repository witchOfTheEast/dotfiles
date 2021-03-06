// Generated by CoffeeScript 1.10.0
(function() {
  var Marks, root,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Marks = {
    previousPositionRegisters: ["`", "'"],
    localRegisters: {},
    mode: null,
    exit: function(continuation) {
      var ref;
      if (continuation == null) {
        continuation = null;
      }
      if ((ref = this.mode) != null) {
        ref.exit();
      }
      this.mode = null;
      return typeof continuation === "function" ? continuation() : void 0;
    },
    getLocationKey: function(keyChar) {
      return "vimiumMark|" + (window.location.href.split('#')[0]) + "|" + keyChar;
    },
    getMarkString: function() {
      return JSON.stringify({
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
    },
    setPreviousPosition: function() {
      var i, len, markString, ref, reg, results;
      markString = this.getMarkString();
      ref = this.previousPositionRegisters;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        reg = ref[i];
        results.push(this.localRegisters[reg] = markString);
      }
      return results;
    },
    showMessage: function(message, keyChar) {
      return HUD.showForDuration(message + " \"" + keyChar + "\".", 1000);
    },
    isGlobalMark: function(event, keyChar) {
      return event.shiftKey && indexOf.call(this.previousPositionRegisters, keyChar) < 0;
    },
    activateCreateMode: function() {
      return this.mode = new Mode({
        name: "create-mark",
        indicator: "Create mark...",
        exitOnEscape: true,
        suppressAllKeyboardEvents: true,
        keypress: (function(_this) {
          return function(event) {
            var keyChar;
            keyChar = String.fromCharCode(event.charCode);
            return _this.exit(function() {
              var ref, scrollX, scrollY;
              if (_this.isGlobalMark(event, keyChar)) {
                if (DomUtils.isTopFrame()) {
                  ref = [window.scrollX, window.scrollY], scrollX = ref[0], scrollY = ref[1];
                }
                return chrome.runtime.sendMessage({
                  handler: 'createMark',
                  markName: keyChar,
                  scrollX: scrollX,
                  scrollY: scrollY
                }, function() {
                  return _this.showMessage("Created global mark", keyChar);
                });
              } else {
                localStorage[_this.getLocationKey(keyChar)] = _this.getMarkString();
                return _this.showMessage("Created local mark", keyChar);
              }
            });
          };
        })(this)
      });
    },
    activateGotoMode: function(registryEntry) {
      return this.mode = new Mode({
        name: "goto-mark",
        indicator: "Go to mark...",
        exitOnEscape: true,
        suppressAllKeyboardEvents: true,
        keypress: (function(_this) {
          return function(event) {
            return _this.exit(function() {
              var keyChar, markString, position, ref;
              keyChar = String.fromCharCode(event.charCode);
              if (_this.isGlobalMark(event, keyChar)) {
                return chrome.runtime.sendMessage({
                  handler: 'gotoMark',
                  markName: keyChar
                });
              } else {
                markString = (ref = _this.localRegisters[keyChar]) != null ? ref : localStorage[_this.getLocationKey(keyChar)];
                if (markString != null) {
                  _this.setPreviousPosition();
                  position = JSON.parse(markString);
                  window.scrollTo(position.scrollX, position.scrollY);
                  return _this.showMessage("Jumped to local mark", keyChar);
                } else {
                  return _this.showMessage("Local mark not set", keyChar);
                }
              }
            });
          };
        })(this)
      });
    }
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.Marks = Marks;

}).call(this);
