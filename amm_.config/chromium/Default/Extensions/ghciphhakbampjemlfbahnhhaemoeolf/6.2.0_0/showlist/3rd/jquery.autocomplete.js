(function(A) {
    if (typeof define === "function" && define.amd) {
        define(["jquery"], A)
    } else {
        A(jQuery)
    }
} (function(D) {
    var A = (function() {
        return {
            extend: function(F, E) {
                return D.extend(F, E)
            },
            addEvent: function(F, E, G) {
                if (F.addEventListener) {
                    F.addEventListener(E, G, false)
                } else {
                    if (F.attachEvent) {
                        F.attachEvent("on" + E, G)
                    } else {
                        throw new Error("Browser doesn't support addEventListener or attachEvent")
                    }
                }
            },
            removeEvent: function(F, E, G) {
                if (F.removeEventListener) {
                    F.removeEventListener(E, G, false)
                } else {
                    if (F.detachEvent) {
                        F.detachEvent("on" + E, G)
                    }
                }
            },
            createNode: function(E) {
                var F = document.createElement("div");
                F.innerHTML = E;
                return F.firstChild
            }
        }
    } ()),
    C = {
        ESC: 27,
        TAB: 9,
        RETURN: 13,
        UP: 38,
        DOWN: 40
    };
    function B(F, E) {
        var H = function() {},
        G = this,
        I = {
            autoSelectFirst: false,
            appendTo: "body",
            serviceUrl: null,
            lookup: null,
            onSelect: null,
            width: "auto",
            minChars: 1,
            maxHeight: 300,
            deferRequestBy: 0,
            params: {},
            formatResult: B.formatResult,
            delimiter: null,
            zIndex: 9999,
            type: "GET",
            noCache: false,
            onSearchStart: H,
            onSearchComplete: H,
            containerClass: "autocomplete-suggestions",
            tabDisabled: false,
            dataType: "text",
            lookupFilter: function(K, J, L) {
                return K.value.toLowerCase().indexOf(L) !== -1
            },
            paramName: "query",
            transformResult: function(J) {
                return J
            }
        };
        G.element = F;
        G.el = D(F);
        G.suggestions = [];
        G.badQueries = [];
        G.selectedIndex = -1;
        G.currentValue = G.element.value;
        G.intervalId = 0;
        G.cachedResponse = [];
        G.onChangeInterval = null;
        G.onChange = null;
        G.ignoreValueChange = false;
        G.isLocal = false;
        G.suggestionsContainer = null;
        G.options = D.extend({},
        I, E);
        G.classes = {
            selected: "autocomplete-selected",
            suggestion: "autocomplete-suggestion"
        };
        G.initialize();
        G.setOptions(E)
    }
    B.utils = A;
    D.Autocomplete = B;
    B.formatResult = function(E, G) {
        var F = new RegExp("(\\" + ["/", ".", "*", "+", "?", "|", "(", ")", "[", "]", "{", "}", "\\"].join("|\\") + ")", "g"),
        H = "(" + G.toString().replace(F, "\\$1") + ")";
        return E.value.toString().replace(new RegExp(H, "gi"), "<strong>$1</strong>")
    };
    B.prototype = {
        killerFn: null,
        initialize: function() {
            var H = this,
            I = "." + H.classes.suggestion,
            G = H.classes.selected,
            F = H.options,
            E;
            H.element.setAttribute("autocomplete", "off");
            H.killerFn = function(J) {
                if (D(J.target).closest("." + H.options.containerClass).length === 0) {
                    H.killSuggestions();
                    H.disableKillerFn()
                }
            };
            if (!F.width || F.width === "auto") {
                F.width = H.el.outerWidth()
            }
            H.suggestionsContainer = B.utils.createNode('<div class="' + F.containerClass + '" style="position: absolute; display: none;"></div>');
            E = D(H.suggestionsContainer);
            E.appendTo(F.appendTo).width(F.width);
            E.on("mouseover", I, 
            function() {
                H.activate(D(this).data("index"))
            });
            E.on("mouseout", 
            function() {
                H.selectedIndex = -1;
                E.children("." + G).removeClass(G)
            });
            E.on("click", I, 
            function() {
                H.select(D(this).data("index"), false)
            });
            H.fixPosition();
            if (window.opera) {
                H.el.on("keypress", 
                function(J) {
                    H.onKeyPress(J)
                })
            } else {
                H.el.on("keydown", 
                function(J) {
                    H.onKeyPress(J)
                })
            }
            H.el.on("keyup", 
            function(J) {
                H.onKeyUp(J)
            });
            H.el.on("blur", 
            function() {
                H.onBlur()
            });
            H.el.on("focus", 
            function() {
                H.fixPosition()
            })
        },
        onBlur: function() {
            this.enableKillerFn()
        },
        setOptions: function(G) {
            var F = this,
            E = F.options;
            A.extend(E, G);
            F.isLocal = D.isArray(E.lookup);
            if (F.isLocal) {
                E.lookup = F.verifySuggestionsFormat(E.lookup)
            }
            D(F.suggestionsContainer).css({
                "max-height": E.maxHeight + "px",
                width: E.width + "px",
                "z-index": E.zIndex
            })
        },
        clearCache: function() {
            this.cachedResponse = [];
            this.badQueries = []
        },
        disable: function() {
            this.disabled = true
        },
        enable: function() {
            this.disabled = false
        },
        fixPosition: function() {
            var E = this,
            F;
            if (E.options.appendTo !== "body") {
                return
            }
            F = E.el.offset();
            D(E.suggestionsContainer).css({
                top: (F.top + E.el.outerHeight()) + "px",
                left: (F.left - 1) + "px"
            })
        },
        enableKillerFn: function() {
            var E = this;
            D(document).on("click", E.killerFn)
        },
        disableKillerFn: function() {
            var E = this;
            D(document).off("click", E.killerFn)
        },
        killSuggestions: function() {
            var E = this;
            E.stopKillSuggestions();
            E.intervalId = window.setInterval(function() {
                E.hide();
                E.stopKillSuggestions()
            },
            100)
        },
        stopKillSuggestions: function() {
            window.clearInterval(this.intervalId)
        },
        onKeyPress: function(F) {
            var E = this;
            if (!E.disabled && !E.visible && F.keyCode === C.DOWN && E.currentValue) {
                E.suggest();
                return
            }
            if (E.disabled || !E.visible) {
                return
            }
            switch (F.keyCode) {
            case C.ESC:
                E.el.val(E.currentValue);
                E.hide();
                break;
            case C.TAB:
            case C.RETURN:
                if (E.selectedIndex === -1) {
                    E.hide();
                    return
                }
                E.select(E.selectedIndex, F.keyCode === C.RETURN);
                if (F.keyCode === C.TAB && this.options.tabDisabled === false) {
                    return
                }
                return;
                break;
            case C.UP:
                E.moveUp();
                break;
            case C.DOWN:
                E.moveDown();
                break;
            default:
                return
            }
            F.stopImmediatePropagation();
            F.preventDefault()
        },
        onKeyUp: function(F) {
            var E = this;
            if (E.disabled) {
                return
            }
            switch (F.keyCode) {
            case C.UP:
            case C.DOWN:
                return
            }
            clearInterval(E.onChangeInterval);
            if (E.currentValue !== E.el.val()) {
                if (E.options.deferRequestBy > 0) {
                    E.onChangeInterval = setInterval(function() {
                        E.onValueChange()
                    },
                    E.options.deferRequestBy)
                } else {
                    E.onValueChange()
                }
            }
        },
        onValueChange: function() {
            var E = this,
            F;
            clearInterval(E.onChangeInterval);
            E.currentValue = E.element.value;
            F = E.getQuery(E.currentValue);
            E.selectedIndex = -1;
            if (E.ignoreValueChange) {
                E.ignoreValueChange = false;
                return
            }
            if (F.length < E.options.minChars) {
                E.hide()
            } else {
                E.getSuggestions(F)
            }
        },
        getQuery: function(F) {
            var E = this.options.delimiter,
            G;
            if (!E) {
                return D.trim(F)
            }
            G = F.split(E);
            return D.trim(G[G.length - 1])
        },
        getSuggestionsLocal: function(H) {
            var G = this,
            E = H.toLowerCase(),
            F = G.options.lookupFilter;
            return {
                suggestions: D.grep(G.options.lookup, 
                function(I) {
                    return F(I, H, E)
                })
            }
        },
        getSuggestions: function(H) {
            var E,
            G = this,
            F = G.options;
            E = G.isLocal ? G.getSuggestionsLocal(H) : G.cachedResponse[H];
            if (E && D.isArray(E.suggestions)) {
                G.suggestions = E.suggestions;
                G.suggest()
            } else {
                if (!G.isBadQuery(H)) {
                    F.params[F.paramName] = H;
                    F.onSearchStart.call(G.element, F.params);
                    D.ajax({
                        url: F.serviceUrl,
                        data: F.params,
                        type: F.type,
                        dataType: F.dataType
                    }).done(function(I) {
                        G.processResponse(I);
                        F.onSearchComplete.call(G.element, H)
                    })
                }
            }
        },
        isBadQuery: function(F) {
            var G = this.badQueries,
            E = G.length;
            while (E--) {
                if (F.indexOf(G[E]) === 0) {
                    return true
                }
            }
            return false
        },
        hide: function() {
            var E = this;
            E.visible = false;
            E.selectedIndex = -1;
            D(E.suggestionsContainer).hide()
        },
        suggest: function() {
            if (this.suggestions.length === 0) {
                this.hide();
                return
            }
            var I = this,
            K = I.options.formatResult,
            J = I.getQuery(I.currentValue),
            H = I.classes.suggestion,
            G = I.classes.selected,
            E = D(I.suggestionsContainer),
            F = "";
            D.each(I.suggestions, 
            function(M, L) {
                F += '<div class="' + H + '" data-index="' + M + '">' + K(L, J) + "</div>"
            });
            E.html(F).show();
            I.visible = true;
            if (I.options.autoSelectFirst) {
                I.selectedIndex = 0;
                E.children().first().addClass(G)
            }
        },
        verifySuggestionsFormat: function(E) {
            if (E.length && typeof E[0] === "string") {
                return D.map(E, 
                function(F) {
                    return {
                        value: F,
                        data: null
                    }
                })
            }
            return E
        },
        processResponse: function(G) {            
            var F = this,
            E = typeof G == "string" ? G.split("(")[1].split(")")[0]: G;
            E = F.options.transformResult(E);
            E.suggestions = F.verifySuggestionsFormat(E.suggestions);
            if (!F.options.noCache) {
                F.cachedResponse[E[F.options.paramName]] = E;
                if (E.suggestions.length === 0) {
                    F.badQueries.push(E[F.options.paramName])
                }
            }
            if (E[F.options.paramName] === F.getQuery(F.currentValue)) {
                F.suggestions = E.suggestions;
                F.suggest()
            }
        },
        activate: function(F) {
            var I = this,
            J,
            H = I.classes.selected,
            E = D(I.suggestionsContainer),
            G = E.children();
            E.children("." + H).removeClass(H);
            I.selectedIndex = F;
            if (I.selectedIndex !== -1 && G.length > I.selectedIndex) {
                J = G.get(I.selectedIndex);
                D(J).addClass(H);
                return J
            }
            return null
        },
        select: function(G, E) {
            var H = this,
            F = H.suggestions[G];            
            if (F) {
                H.el.val(F);
                H.ignoreValueChange = E;
                H.hide();
                H.onSelect(G, H.ignoreValueChange)
            }
        },
        moveUp: function() {
            var E = this;
            if (E.selectedIndex === -1) {
                return
            }
            if (E.selectedIndex === 0) {
                D(E.suggestionsContainer).children().first().removeClass(E.classes.selected);
                E.selectedIndex = -1;
                E.el.val(E.currentValue);
                return
            }
            E.adjustScroll(E.selectedIndex - 1)
        },
        moveDown: function() {
            var E = this;
            if (E.selectedIndex === (E.suggestions.length - 1)) {
                return
            }
            E.adjustScroll(E.selectedIndex + 1)
        },
        adjustScroll: function(E) {
            var G = this,
            K = G.activate(E),
            F,
            I,
            J,
            H = 25;
            if (!K) {
                return
            }
            F = K.offsetTop;
            I = D(G.suggestionsContainer).scrollTop();
            J = I + G.options.maxHeight - H;
            if (F < I) {
                D(G.suggestionsContainer).scrollTop(F)
            } else {
                if (F > J) {
                    D(G.suggestionsContainer).scrollTop(F - G.options.maxHeight + H)
                }
            }
            var _reg=/(?:<b.*?>)((\n|\r|.)*?)(?:<\/b>)/g;
            var result=G.getValue(G.suggestions[E].value).replace(_reg,"$1");
            G.el.val(result)
        },
        onSelect: function(F, I) {
            var H = this,
            G = H.options.onSelect,
            E = H.suggestions[F];
            var _reg=/(?:<b.*?>)((\n|\r|.)*?)(?:<\/b>)/g;
            var result=H.getValue(E.value).replace(_reg,"$1");
            H.el.val(result);
            if (D.isFunction(G)) {
                G.call(H.element, E, I)
            }
        },
        getValue: function(H) {
            var G = this,
            E = G.options.delimiter,
            F,
            I;
            if (!E) {
                return H
            }
            F = G.currentValue;
            I = F.split(E);
            if (I.length === 1) {
                return H
            }
            return F.substr(0, F.length - I[I.length - 1].length) + H
        }
    };
    D.fn.autocomplete = function(F, E) {
        return this.each(function() {
            var I = "autocomplete",
            H = D(this),
            G;
            if (typeof F === "string") {
                G = H.data(I);
                if (typeof G[F] === "function") {
                    G[F](E)
                }
            } else {
                G = new B(this, F);
                H.data(I, G)
            }
        })
    }
}));