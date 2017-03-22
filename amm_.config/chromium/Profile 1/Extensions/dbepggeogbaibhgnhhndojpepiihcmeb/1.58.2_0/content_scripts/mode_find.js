// Generated by CoffeeScript 1.9.3
(function() {
  var FindMode, PostFindMode, SuppressPrintable, getCurrentRange, root,
    extend1 = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  SuppressPrintable = (function(superClass) {
    extend1(SuppressPrintable, superClass);

    function SuppressPrintable(options) {
      var handler, type;
      SuppressPrintable.__super__.constructor.call(this, options);
      handler = (function(_this) {
        return function(event) {
          if (KeyboardUtils.isPrintable(event)) {
            return _this.suppressEvent;
          } else {
            return _this.continueBubbling;
          }
        };
      })(this);
      type = document.getSelection().type;
      this.unshift({
        _name: "mode-" + this.id + "/suppress-printable",
        keydown: handler,
        keypress: handler,
        keyup: (function(_this) {
          return function(event) {
            if (document.getSelection().type !== type) {
              return _this.exit();
            } else {
              return handler(event);
            }
          };
        })(this)
      });
    }

    return SuppressPrintable;

  })(Mode);

  PostFindMode = (function(superClass) {
    extend1(PostFindMode, superClass);

    function PostFindMode() {
      var element;
      if (!(document.activeElement && DomUtils.isEditable(document.activeElement))) {
        return;
      }
      element = document.activeElement;
      PostFindMode.__super__.constructor.call(this, {
        name: "post-find",
        singleton: "post-find-mode/focus-input",
        exitOnBlur: element,
        exitOnClick: true,
        keydown: function(event) {
          return InsertMode.suppressEvent(event);
        },
        keypress: function(event) {
          return InsertMode.suppressEvent(event);
        },
        keyup: function(event) {
          return InsertMode.suppressEvent(event);
        }
      });
      this.push({
        _name: "mode-" + this.id + "/handle-escape",
        keydown: (function(_this) {
          return function(event) {
            if (KeyboardUtils.isEscape(event)) {
              _this.exit();
              return DomUtils.suppressKeyupAfterEscape(handlerStack);
            } else {
              handlerStack.remove();
              return _this.continueBubbling;
            }
          };
        })(this)
      });
    }

    return PostFindMode;

  })(SuppressPrintable);

  FindMode = (function(superClass) {
    extend1(FindMode, superClass);

    FindMode.query = {
      rawQuery: "",
      matchCount: 0,
      hasResults: false
    };

    function FindMode(options) {
      if (options == null) {
        options = {};
      }
      this.initialRange = getCurrentRange();
      FindMode.query = {
        rawQuery: ""
      };
      if (options.returnToViewport) {
        this.scrollX = window.scrollX;
        this.scrollY = window.scrollY;
      }
      FindMode.__super__.constructor.call(this, extend(options, {
        name: "find",
        indicator: false,
        exitOnClick: true,
        exitOnEscape: true,
        suppressAllKeyboardEvents: true
      }));
      HUD.showFindMode(this);
    }

    FindMode.prototype.exit = function(event) {
      FindMode.__super__.exit.call(this);
      if (event) {
        return handleEscapeForFindMode();
      }
    };

    FindMode.prototype.restoreSelection = function() {
      var range, selection;
      range = this.initialRange;
      selection = getSelection();
      selection.removeAllRanges();
      return selection.addRange(range);
    };

    FindMode.prototype.findInPlace = function(query) {
      this.checkReturnToViewPort();
      FindMode.updateQuery(query);
      this.restoreSelection();
      query = FindMode.query.isRegex ? FindMode.getNextQueryFromRegexMatches(0) : FindMode.query.parsedQuery;
      return FindMode.query.hasResults = FindMode.execute(query);
    };

    FindMode.updateQuery = function(query) {
      var error, hasNoIgnoreCaseFlag, pattern, regexMatches, regexPattern, text;
      this.query.rawQuery = query;
      this.query.isRegex = Settings.get('regexFindMode');
      hasNoIgnoreCaseFlag = false;
      this.query.parsedQuery = this.query.rawQuery.replace(/(\\{1,2})([rRI]?)/g, (function(_this) {
        return function(match, slashes, flag) {
          if (flag === "" || slashes.length !== 1) {
            return match;
          }
          switch (flag) {
            case "r":
              _this.query.isRegex = true;
              break;
            case "R":
              _this.query.isRegex = false;
              break;
            case "I":
              hasNoIgnoreCaseFlag = true;
          }
          return "";
        };
      })(this));
      this.query.ignoreCase = !hasNoIgnoreCaseFlag && !Utils.hasUpperCase(this.query.parsedQuery);
      regexPattern = this.query.isRegex ? this.query.parsedQuery : Utils.escapeRegexSpecialCharacters(this.query.parsedQuery);
      try {
        pattern = new RegExp(regexPattern, "g" + (this.query.ignoreCase ? "i" : ""));
      } catch (_error) {
        error = _error;
        return;
      }
      text = document.body.innerText;
      regexMatches = text.match(pattern);
      if (this.query.isRegex) {
        this.query.regexMatches = regexMatches;
      }
      if (this.query.isRegex) {
        this.query.activeRegexIndex = 0;
      }
      return this.query.matchCount = regexMatches != null ? regexMatches.length : void 0;
    };

    FindMode.getNextQueryFromRegexMatches = function(stepSize) {
      var totalMatches;
      if (!this.query.regexMatches) {
        return "";
      }
      totalMatches = this.query.regexMatches.length;
      this.query.activeRegexIndex += stepSize + totalMatches;
      this.query.activeRegexIndex %= totalMatches;
      return this.query.regexMatches[this.query.activeRegexIndex];
    };

    FindMode.getQuery = function(backwards) {
      var mostRecentQuery;
      mostRecentQuery = FindModeHistory.getQuery();
      if (mostRecentQuery !== this.query.rawQuery) {
        this.updateQuery(mostRecentQuery);
      }
      if (this.query.isRegex) {
        return this.getNextQueryFromRegexMatches(backwards ? -1 : 1);
      } else {
        return this.query.parsedQuery;
      }
    };

    FindMode.saveQuery = function() {
      return FindModeHistory.saveQuery(this.query.rawQuery);
    };

    FindMode.execute = function(query, options) {
      var result;
      result = null;
      options = extend({
        backwards: false,
        caseSensitive: !this.query.ignoreCase,
        colorSelection: true
      }, options);
      if (query == null) {
        query = FindMode.getQuery(options.backwards);
      }
      if (options.colorSelection) {
        document.body.classList.add("vimiumFindMode");
        document.removeEventListener("selectionchange", this.restoreDefaultSelectionHighlight, true);
      }
      result = window.find(query, options.caseSensitive, options.backwards, true, false, true, false);
      if (options.colorSelection) {
        setTimeout((function(_this) {
          return function() {
            return document.addEventListener("selectionchange", _this.restoreDefaultSelectionHighlight, true);
          };
        })(this), 0);
      }
      if (document.activeElement && DomUtils.isEditable(document.activeElement)) {
        if (!DomUtils.isSelected(document.activeElement)) {
          document.activeElement.blur();
        }
      }
      return result;
    };

    FindMode.restoreDefaultSelectionHighlight = function() {
      return document.body.classList.remove("vimiumFindMode");
    };

    FindMode.prototype.checkReturnToViewPort = function() {
      if (this.options.returnToViewport) {
        return window.scrollTo(this.scrollX, this.scrollY);
      }
    };

    return FindMode;

  })(Mode);

  getCurrentRange = function() {
    var range, selection;
    selection = getSelection();
    if (selection.type === "None") {
      range = document.createRange();
      range.setStart(document.body, 0);
      range.setEnd(document.body, 0);
      return range;
    } else {
      if (selection.type === "Range") {
        selection.collapseToStart();
      }
      return selection.getRangeAt(0);
    }
  };

  root = typeof exports !== "undefined" && exports !== null ? exports : window;

  root.PostFindMode = PostFindMode;

  root.FindMode = FindMode;

}).call(this);
