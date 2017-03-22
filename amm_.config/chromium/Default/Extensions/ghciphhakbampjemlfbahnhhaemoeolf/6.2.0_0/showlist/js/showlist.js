$.extend({
    strstr: function(b, c, a) {
        var d = 0;
        b += "";
        d = b.indexOf(c);
        if (d == -1) {
            return false
        } else {
            if (a) {
                return b.substr(0, d)
            } else {
                return b.slice(d)
            }
        }
    }
})

var nVersion = 1; // will be replaced
var fFirefox = false;
var fVideoVersion = false;
var fVideo = true;
var defaults = defaults2;
var VideoSites = defaults.VideoSites;

var fr = {
    slastInner: "",
    fEditMode: false,
    nPages: 0,
    nCurPage: 0,
    lpToplinkBottomFolder: 0,
    lpCurFolder: 0,
    nToplinks: 0,
    nToplinksPerPage: 0,
    nCurFolderLevel: 0,
    lpFolderStack: [{
        "page": "",
        "parent": ""
    }, {
        "page": "",
        "parent": ""
    }, {
        "page": "",
        "parent": ""
    }, {
        "page": "",
        "parent": ""
    }, {
        "page": "",
        "parent": ""
    }, {
        "page": "",
        "parent": ""
    }],
    FilterList: new Array(),
    FilterListCount: 0,
    curFilter: "",
    lpOverlayPos: new Array(),
    lpDragTargets: 0,

    SetVideoFilter: function(txt) {
        this.curFilter = txt;
        this.FilterList = new Array();
        this.FilterListCount = 0;

        var videofolder = fr.FindToplinkType(0, "v");
        if (txt == "") {
            fr.doSetFolder(videofolder.id);
        } else {
            var tl = videofolder.Toplinks;
            var count = tl.length;
            var lwr = this.curFilter.toLowerCase();
            for (var j = 0; j < count; j++) {
                if (tl[j].name.toLowerCase().indexOf(lwr) >= 0 ||
                    (tl[j].url && tl[j].url.toLowerCase().indexOf(lwr) >= 0)) {
                    this.FilterList[this.FilterListCount] = tl[j];
                    this.FilterListCount++;
                }
            }
            this.lpCurFolder = new Object();
            this.lpCurFolder.id = 0;
            this.lpCurFolder.type = "v";
            this.lpCurFolder.Toplinks = this.FilterList;
            this.nCurPage = 0;
        }
        this.doResize();
    },

    SetFilter: function(txt) {
        if (fVideoVersion) {
            fr.SetVideoFilter(txt);
            return;
        }
        this.curFilter = txt;
        this.FilterList = new Array();
        this.FilterListCount = 0;
        if (1) {
            if (txt == "") {
                this.nCurPage = 0;
                this.lpCurFolder = 0;
                this.nCurFolderLevel = 0;
            } else {
                this.lpCurFolder = new Object();
                this.lpCurFolder.id = 0;
                this.lpCurFolder.Toplinks = this.FilterList;
                this.nCurPage = 0;
            }
        }
        this.doResize();
    },

    doSetFolder: function(id) {
        if (this.lpCurFolder && id == this.lpCurFolder.id)
            return;
        fr.curTimer++;
        if (id < 0) // one level up
        {
            if (this.nCurFolderLevel > 0)
                this.nCurFolderLevel--;
            this.nCurPage = this.lpFolderStack[this.nCurFolderLevel].page;
            var tl = fr.FindToplink(0, this.lpFolderStack[this.nCurFolderLevel].id);
            if (tl)
                this.lpCurFolder = tl;
            else
                this.lpCurFolder = 0;
            this.doResizeHome();
            return;
        }

        var tl = fr.FindToplink(0, id);

        this.ReloadFolder(tl);
    },

    ReloadFolder: function(folder) {
        if (fVideo && folder.type == "v") {
            fr.lpFolderStack[fr.nCurFolderLevel].page = fr.nCurPage;
            fr.lpFolderStack[fr.nCurFolderLevel].id = fr.lpCurFolder ? fr.lpCurFolder.id : -1;
            fr.nCurFolderLevel++;
            fr.lpCurFolder = folder;
            fr.lpCurFolder.Toplinks = new Array();

            var dataitems = L64P.video.getWatchedItems({}, function(data) {
                fr.ConvertVideoData(data.items);
                fr.doResizeHome();

                if (fr.startvideoid) {
                    var tl = fr.FindToplinkType(0, "v");
                    if (tl)
                        for (var i = 0; i < tl.Toplinks.length; i++) {
                            var o = tl.Toplinks[i];
                            if (o.video_id == fr.startvideoid) {
                                fr.PlayVideo(o);
                                fr.startvideoid = false;
                                break;
                            }
                        }
                }
            });
            if (typeof(dataitems) != 'undefined')
                if (dataitems)
                    fr.ConvertVideoData(dataitems);
            fr.nCurPage = 0;
            fr.doResizeHome();
        }
    },

    ConvertVideoData: function(dataitems) {
        fr.lpCurFolder.Toplinks = new Array();
        for (var i = 0; i < dataitems.length; i++) {
            var item = dataitems[i];

            var o = new Object();
            o.playhtml = item.html;
            o.searchurl = "";
            o.type = "video"
            o.url = item.video_url;
            o.thumb = item.thumbnail_url;
            o.name = item.title;
            o.video_id = item.video_id;

            o.p1x1 = "";
            o.id = fr.nextfreeid++;
            if (fr.lpCurFolder && fr.lpCurFolder.Toplinks && fr.lpCurFolder.type == "v")
                fr.lpCurFolder.Toplinks.push(o);
        }
    },

    resizeIFrame: function() {
        var o1 = document.getElementById("idPlayVideoThumbs");
        var o2 = document.getElementById("idPlayVideoInner");
        var o3 = o2.firstChild;
        if (!o3)
            return;
        var o4 = document.getElementById("idSlideshow");
        if (!o4)
            return;
        if (o4) {
            var dx = o4.offsetWidth;
            var dy = o4.offsetHeight;
            o3.id = "idPV";
            o2.style.left = "260px";
            o2.style.top = "100px";
            o3.width = dx - 300;
            o3.height = dy - 60 - 18;
            o1.style.height = (dy - 36) + "px";
        }
    },
    PlayVideo: function(o) {
        if (!fVideo)
            return;
        if (!o) {
            $("#idPlayVideoInner").html("");
            $("#idPlayVideoThumbs").html("");
            $("#idPlayVideo").hide();
            fr.ShowToplinks(fr.settings.fShowToplinks);
            fr.doResize();
            //fr.doShowHelp();
            document.title = fr.title;
            chrome.extension.sendMessage({
                msg: "OnSP24PlayVideo",
                url: false
            }, function(response) {});
            return;
        }
        document.title = o.name;
        var s = "<a href='" + o.url + "'>" + getI18nMsg("original") + "</a>";
        $("#idVideoTitle").html(s);
        $("#idVideoClose").html(getI18nMsg("close"));
        fr.myBindClick("#idVideoTitle", {}, function(ev) {
            $("#idPlayVideoInner").html("");
            window.location.replace(o.url);
            return false;
        });

        chrome.extension.sendMessage({
            msg: "OnSP24PlayVideo",
            url: o.url,
            title: o.name
        }, function(response) {});
        //fr.scanHtmlForVideos( o.url);

        if (o.playhtml) {
            if (o.playhtml.indexOf("<iframe") == 0)
                $("#idPlayVideoInner").html(o.playhtml);
            else {
                $("#idPlayVideoInner").html(parseVideoTool.videoPlayFrame(o.url));
            }
            fr.resizeIFrame();
        }

        $("#idPlayVideo").show();
        fr.myBindClick("#idVideoClose", {}, function(ev) {
            fr.PlayVideo(0);
            return false;
        });
        fr.myBindClick("#idPlayVideoBg", {}, function(ev) {
            fr.PlayVideo(0);
            return false;
        });
        fr.myBindClick("#idPlayVideoThumbs", {}, function(ev) {
            fr.PlayVideo(0);
            return false;
        });

        $("#idToplinks").hide();

        $("#idPlayVideoThumbs").html("");
        if (!fr.curvideolist)
            return;

        var j = 0;
        var y = 0;

        var a = new Array();
        var m = 0;
        var len = fr.curvideolist.length;
        for (var i = 0; i < len; i++) {
            var cur = fr.curvideolist[i];
            if (cur.url == o.url) {
                if (i > 0)
                    a.push(fr.curvideolist[i - 1]);
                else {
                    len--;
                    a.push(fr.curvideolist[len]);
                }
                for (var j = i + 1; j < len; j++)
                    a.push(fr.curvideolist[j]);
                for (j = 0; j + 1 < i; j++)
                    a.push(fr.curvideolist[j]);
                break;
            }
        }
        for (var i = 0; i < a.length; i++) {
            var cur = a[i];
            if (cur.type != "video")
                continue;

            var sInner = "";
            sInner += '<div style="top:' + y + 'px;background:#000" id="idv_' + j + '" class="clVideo"><a>';
            y += 136;
            var thumb = fr.GetToplinkThumb(cur);
            var si = GetImageSize(thumb);

            sInner += fr.createVideoItemHtml(j, cur, thumb, 224, 126, si);

            sInner += '</a><div id="id4v_' + j + '"  class="clOverlay"><a>' + cur.name + '</a></div>';
            sInner += '</div>';

            $("#idPlayVideoThumbs").append(sInner);

            fr.myBindClick("#idv_" + j, {
                param: cur
            }, function(ev) {
                fr.PlayVideo(ev.data.param);
                return false;
            });
            fr.myBindIn("#idv_" + j, {
                param: 'id4v_' + j
            }, function(ev) {
                $("#" + ev.data.param).css("visibility", "visible");
            });
            fr.myBindOut("#idv_" + j, {
                param: 'id4v_' + j
            }, function(ev) {
                $("#" + ev.data.param).css("visibility", "hidden");
            });
            j++;
        }
    },

    doSetPage: function(p) {
        this.nCurPage = p;
        this.doResizeHome();
    },

    doChangePage: function(d) {
        if (d == -1) {
            if (this.nCurPage > 0)
                this.nCurPage--;
            else
                this.nCurPage = this.nPages - 1;
            fr.doResizeHome();
        } else if (d == 1) {
            if (this.nCurPage + 1 < this.nPages)
                this.nCurPage++;
            else
                this.nCurPage = 0;
            fr.doResizeHome();
        }
    },

    doShowName: function(id) {
        if (fr.drag)
            return;
        if (fr.idCurrentEdit)
            return;
        var o = document.getElementById(id);
        if (o)
            o.style.visibility = "visible";

        if (!fr.idCurrentEdit) {
            $('#' + id.replace("id4_", "idback_")).css("opacity", "1.0"); // Chrome
            $('#' + id.replace("id4_", "idback_")).css("filter", "alpha(opacity = 100)");
        }
    },

    doShowNameHome: function(idText, idToplink, jpg) {
        if (fr.drag)
            return;
        if (fr.idCurrentEdit)
            return;
        if (!jpg)
            return;
        jpg = jpg.replace("_224", "_448");
        fr.curTimer++;
        setTimeout(function(idToplink, url, timer) {
            fr.doShowScreenshot(idToplink, url, timer);
        }, 500, idToplink, jpg, fr.curTimer);
        var o = document.getElementById(idText);
        if (o)
            o.style.visibility = "visible";

        var o = document.getElementById(idText.replace("id4_", "idBlack_"));
        if (o)
            o.style.visibility = "visible";

        if (!fr.idCurrentEdit) {
            $('#' + idText.replace("id4_", "idback_")).css("opacity", "1.0"); 
        }
    },

    doShowScreenshot: function(idToplink, url, timer) {
        if (timer != fr.curTimer)
            return;
        var o2 = document.getElementById("idOverlay");
        var o3 = document.getElementById("id_" + idToplink);
        if (o2 && o3) {
            var x = fr.lpOverlayPos[idToplink].x;
            o2.style.left = x + "px";
            var y = fr.lpOverlayPos[idToplink].y;
            o2.style.top = y + "px";
            var dx = fr.lpOverlayPos[idToplink].dx;
            o2.style.width = dx + "px";
            var dy = fr.lpOverlayPos[idToplink].dy;
            o2.style.height = dy + "px";

            var si = GetImageSize(url);
            if (si)
                o2.innerHTML = fr.createVideoOverlayHtml(url, dx, dy, si);
            else
                o2.innerHTML = "<img width='100%' height='100%' src='" + url + "'></img>";
            o2.style.visibility = "visible";
        }
    },

    doHideName: function(id) {
        fr.curTimer++;
        var o = document.getElementById(id);
        if (o)
            o.style.visibility = "hidden";

        var o = document.getElementById(id.replace("id4_", "idBlack_"));
        if (o)
            o.style.visibility = "hidden";

        if (!fr.idCurrentEdit)
            if (!this.lpCurFolder || this.lpCurFolder.type != "v")
                $('#' + id.replace("id4_", "idback_")).css("opacity", fr.settings.trans); // Chrome

        var o2 = document.getElementById("idOverlay");
        if (o2)
            o2.style.visibility = "hidden";
    },

    doResize: function() {
        fr.resizeIFrame();
        fr.doResizeHome();
    },

    myBind: function(id, what, ob, callback) {
        if (typeof(callback) != "function")
            return;
        $(id).unbind(what); // avoid calling it twice
        $(id).bind(what, ob, function(ev) {
            return callback(ev);
        });
    },

    myBindIn: function(id, ob, callback) {
        fr.myBind(id, "mouseenter", ob, callback);
    },
    myBindOut: function(id, ob, callback) {
        fr.myBind(id, "mouseleave", ob, callback);
    },
    myBindClick: function(id, ob, callback) {
        fr.myBind(id, "click", ob, callback);
    },

    curvideolist: 0,
    transToplinks: 0,
    doResizeHome: function() {
        //-------------------------------- PrepareToplinks for drawing-------------------------------
        o = document.getElementById("toplinks");
        dx = o.offsetWidth;
        dy = o.offsetHeight;

        if (dx < 860)
            $("#langKey_addfolder").hide();
        else
            $("#langKey_addfolder").show();

        /*if (dx < 750)
            $("#langKey_editToplinks-2").hide();
        else*/
            $("#langKey_editToplinks-2").show();

        dy -= 5;
        dy1 = (dy - 20) / 3;
        if (dy1 > 126)
            dy1 = 126;

        dx1 = 224 * dy1 / 126;
        nCols = Math.floor((dx + 10) / (dx1 + 10));

        var bottom2 = this.lpCurFolder ? this.lpCurFolder.Toplinks : fr.lpToplinkBottomFolder;
        var bottom = new Array();

        for (var j = 0; j < bottom2.length; j++) {
            var cur = bottom2[j];
            if (!(fr.settings.folder & 8) && cur.type == "v")
                continue;
            bottom.push(cur);
        }

        fr.curvideolist = 0;
        if (this.lpCurFolder && this.lpCurFolder.type == "v") {
            fr.curvideolist = bottom;
            if (this.fEditMode)
                fr.fVideosChanged = true; // we are in videofolder in edit mode
        }

        this.nToplinks = bottom.length;
        if (!fVideoVersion)
            if (this.nCurFolderLevel > 0)
                this.nToplinks++; // Up-Toplink

        this.nToplinksPerPage = nCols * 3;
        if (this.nToplinksPerPage < 1)
            this.nPages = 0;
        else
            this.nPages = Math.floor((this.nToplinks + this.nToplinksPerPage - 1) / this.nToplinksPerPage);

        if (this.nCurPage + 1 > this.nPages)
            this.nCurPage = this.nPages - 1;
        if (this.nCurPage < 0)
            this.nCurPage = 0;

        ofs = this.nCurPage * this.nToplinksPerPage;

        var nTotal = this.nToplinks;
        count = this.nToplinksPerPage;

        if (count + ofs > nTotal) {
            count = nTotal - ofs;
            nCols = Math.floor((count + 2) / 3);
        }

        var sInner = "";
        for (var j = 0; j < count; j++) {
            i = j + ofs;
            var cur = bottom[i];
            if (!cur)
                continue;
            if (!cur.screenshotURL) {
                this.GetScreenshotUrl(cur, !cur.thumb);
            }
            var thumb = fr.GetToplinkThumb(cur);
            sInner += '<img class="clThumbBase" src="' + thumb + '"></img>';

        }
        $("#idHiddenThumbs").html(sInner);
        fr.transToplinks = new Object();
        //-------------------------------- DrawToplinks --------------------------------    
        for (m = 0; m < 2; m++) {
            sInner = ""
            for (var j = 0; j < count; j++) {
                i = j + ofs;

                var cur = bottom[i];
                if (!cur)
                    continue;

                if (m) {
                    fr.myBindClick("#idback_" + j, {}, function(ev) {
                        return false;
                    });

                    if (!this.fEditMode) {
                        if (cur.type == "video")
                            fr.myBindClick("#id_" + j, {
                                param: cur
                            }, function(ev) {
                                fr.PlayVideo(ev.data.param);
                                return false;
                            });
                    }
                    if (cur.screenshotURL && cur.screenshotURL != "*"  && !this.fEditMode){
                        fr.myBindIn("#id_" + j, {
                                param1: 'id4_' + j,
                                param2: j,
                                param3: cur.screenshotURL
                            },
                            function(ev) {
                                fr.doShowNameHome(ev.data.param1, ev.data.param2, ev.data.param3);
                            });
                    }else{
                        fr.myBindIn("#id_" + j, {
                            param: 'idBlack_' + j
                        }, function(ev) {
                            fr.doShowName(ev.data.param);
                        });
                    }
                    fr.myBindOut("#id_" + j, {
                        param: 'id4_' + j
                    }, function(ev) {
                        fr.doHideName(ev.data.param);
                    });

                    if (this.fEditMode) {
                        fr.myBind("#id_" + j, 'mousedown', {
                            param: "#id_" + j,
                            param2: cur.id
                        }, function(ev) {
                            fr.HandleDrag(1, ev.data.param, ev.data.param2);
                        });
                        fr.myBind("#id_" + j, 'mouseup', {}, function(ev) {
                            fr.HandleDrag(0);
                        });

                        $("#id5_" + j).unbind('click');
                    }
                    fr.myBindClick("#idedit_" + j, {
                        param: cur.id
                    }, function(ev) {
                        return false;
                    });
                    fr.myBindClick("#iddel_" + j, {
                        param: cur.id
                    }, function(ev) {
                        fr.DelToplink(ev.data.param);
                        return false;
                    });

                } else {
                    var thumb = fr.GetToplinkThumb(cur);
                    fr.transToplinks[cur.id] = 'idback_' + j;
                    if (fr.idCurrentEdit == cur.id || cur.type == "video")
                        sInner += '<div id="idback_' + j + '" class="clToplinkBack" >'; 
                    else
                        sInner += '<div id="idback_' + j + '" class="clToplinkBack" style="opacity:' + fr.settings.trans + '">'; 
                    if (fr.drag == 2 && fr.dragToplinkId == cur.id)
                    {
                        fr.dragId = "id_" + j;
                        sInner += '<div style="visibility:hidden;cursor:default" id="id_' + j + '" class="clToplink"></div>';
                    } else {
                        
                            if (cur.type == "video")
                                sInner += '<div id="id_' + j + '" style="background:#000" class="clToplink" ';
                            else
                                sInner += '<div id="id_' + j + '" class="clToplink" ';

                            var si = GetImageSize(thumb);
                            sInner += '><a href="">';

                            if (cur.type == "video") {
                                sInner += fr.createVideoItemHtml(j, cur, thumb, dx1, dy1, si);
                            } else if (si)
                                sInner += '<img draggable=false class="clThumb" style="width:' + si.w * dx1 / 224 + 'px;height:' + si.h * dx1 / 224 + 'px; margin-left:' + (224 - si.w) * dx1 / 224 / 2 + 'px;margin-top:' + (126 - si.h) * dx1 / 224 / 2 + 'px;" src="' + thumb + '"></img>';
                            else
                                sInner += '<img draggable=false class="clThumb" width=100% height=100%  src="' + thumb + '"></img>';
                            sInner += '</a><div id="id4_' + j + '" class="clOverlay"><a href="">' + cur.name + '</a></div>';
                            sInner += '<div id="id5_' + cur.id + '" class="clEditOverlay"></div>';
                            sInner += fr.CreateEditModeButtons(j, cur, dy1);
                        sInner += '</div>';
                    }
                    sInner += '</div>';
                }
            }
            if (!m) {
                sInner += "<div id='idOverlay'></div>";
                if (this.slastInner != sInner) {
                    this.slastInner = sInner;
                    $("#toplinks").html(sInner);
                }
                checkVideo();
            }
        }

        //-------------------------------- Toplink-Positionen berechnen --------------------------------
        x = (dx + 10 - (dx1 + 10) * nCols) / 2;
        y = (dy - dy1 * 3 - 20) / 2;
        row = 0;
        m = 2 + 5 * dy1 / 126;
        var col = 0;

        var oParent = document.getElementById("toplinks");
        var xParent = parseInt(oParent.offsetLeft);
        var yParent = parseInt(oParent.offsetTop);

        fr.lpDragTargets = 0;
        var fdragitem = false;
        for (var j = 0; j < count; j++) {
            var i = j + ofs;
            if (this.nCurFolderLevel > 0 && !fVideoVersion) {
                i--; 
            }

            s = "idback_" + j;
            o2 = document.getElementById(s);
            if (!o2)
                continue;
            o2.style.width = dx1 + "px";
            o2.style.height = dy1 + "px";
            o2.style.left = x + "px";
            o2.style.top = y + "px";
            if (fr.drag) {

                var cur = i >= 0 ? bottom[i] : 0;
                if (!fr.lpDragTargets)
                    fr.lpDragTargets = new Array();
                if (cur) {
                    if (fr.dragToplinkId == cur.id)
                        fdragitem = true;

                    var target = new Object(); // Insert before
                    target.x = xParent + x;
                    target.width = dx1;
                    target.y = yParent + y - dy1 / 3;
                    target.height = dy1 * 2 / 3;
                    target.toplinkId = cur.id;
                    target.divId = "#id_" + j;
                    fr.lpDragTargets.push(target);
                }

                if (row == 2 && i + 1 < bottom.length) {
                    var target = new Object(); // Insert after
                    target.x = xParent + x;
                    target.width = dx1;
                    target.y = yParent + y - dy1 / 3 + dy1 + 10;
                    target.height = dy1 * 2 / 3;
                    target.toplinkId = bottom[i + 1].id;
                    target.divId = "#id_" + (j + 1);
                    fr.lpDragTargets.push(target);
                } else if (i + 1 == bottom.length) {
                    var target = new Object(); // Insert after
                    target.x = xParent + x;
                    target.width = dx1;
                    target.y = yParent + y - dy1 / 3 + dy1 + 10;
                    target.height = dy1 * 2 / 3;
                    target.toplinkId = "end";
                    target.divId = "#id_" + (j);
                    target.mode = 2; // At the end
                    fr.lpDragTargets.push(target);
                }
            }

            if (!this.lpOverlayPos[j])
                this.lpOverlayPos[j] = new Object();

            if (col * 2 + 1 == nCols && nCols < 5) {
                if (row != 1)
                    this.lpOverlayPos[j].x = x;
                else
                    this.lpOverlayPos[j].x = x + dx1 + 10;

                if (row == 0)
                    this.lpOverlayPos[j].y = y + dy1 + 10;
                else if (row == 2)
                    this.lpOverlayPos[j].y = y - 2 * dy1 - 2 * 10;
                else
                    this.lpOverlayPos[j].y = y;
            } else {
                if (col >= nCols / 2)
                    this.lpOverlayPos[j].x = x - 2 * dx1 - 2 * 10;
                else
                    this.lpOverlayPos[j].x = x + dx1 + 10;

                if (j % 3 == 2)
                    this.lpOverlayPos[j].y = y - dy1 - 10;
                else
                    this.lpOverlayPos[j].y = y;
            }
            this.lpOverlayPos[j].dx = 2 * dx1 + 16;
            this.lpOverlayPos[j].dy = 2 * dy1 + 14;

            s = "id3_" + j;
            o2 = document.getElementById(s);
            if (o2) {
                o2.style.width = (dx1 - 10) + "px";
                o2.style.height = 24 + "px";
                o2.style.left = (5) + "px";
                o2.style.top = (dy1 - 30) + "px";
            }

            row++;
            y += dy1 + 10;
            if (row > 2) {
                col++;
                y = (dy - dy1 * 3 - 20) / 2;
                x += dx1 + 10;
                row = 0;
            }
        }

        o3 = document.getElementById("divLeft");
        o3.style.top = (80 + (dy - 38) / 2) + "px";
        if (this.nPages > 1)
            o3.style.display = 'block';
        else
            o3.style.display = 'none';
        o3 = document.getElementById("divRight");
        o3.style.top = (80 + (dy - 38) / 2) + "px";
        if (this.nPages > 1)
            o3.style.display = 'block';
        else
            o3.style.display = 'none';
    },

    drag: 0,
    dragId: 0,
    dragToplinkId: 0,
    dragX: 0,
    dragY: 0,
    dragBefore: 0,
    dragAllowPage: true,
    mousehandleradded: false,
    HandleDrag: function(mode, divId, toplinkId) {
        if (fr.idCurrentEdit)
            return;

        if (fr.lpCurFolder && fr.lpCurFolder.type != "v")
            return;
        if (mode == 1) {
            if (!fr.mousehandleradded) {
                fr.mousehandleradded = true;
                document.addEventListener("mousemove", this.myMouseMove, false);
            }

            this.dragToplinkId = toplinkId;
            this.dragId = divId;
            this.drag = 1;
            this.dragBefore = 0;
            this.dragX = parseInt($("#idDrag").css("left"));
            this.dragY = parseInt($("#idDrag").css("top"));
            fr.dragLastTarget = -1;
        } else if (mode == 0) {
            if (!this.drag)
                return;
            this.drag = 0;
            $("#idDrag").hide();
            $("#idDrag").html("");
            $(this.dragId).css("visibility", "visible");
            if (this.dragBefore) {
                if (fr.dragBefore.toplinkId != fr.dragToplinkId)
                    fr.MoveToplinkBefore(this.dragToplinkId, this.dragBefore, true);
            }
            fr.doResize();
        } else if (this.drag) {
            var x = parseInt($("#idDrag").css("left"));
            var y = parseInt($("#idDrag").css("top"));
            if (this.drag == 1)
            {
                if (Math.abs(x - this.dragX) > 5 || Math.abs(y - this.dragY) > 5) {
                    $("#idDrag").show();
                    fr.doResize();
                    this.drag = 2;
                    $(this.dragId).css("visibility", "hidden");
                    var s = $(this.dragId).html();
                    $(this.dragId).html("");
                    $("#idDrag").html(s);
                }
            } else if (fr.lpDragTargets) {
                x += 224 / 2;
                y += 126 / 2;

                var oParent = document.getElementById("toplinks");
                var xParent = parseInt(oParent.offsetLeft);
                var dxParent = parseInt(oParent.offsetWidth);

                if (x < xParent && this.nCurPage > 0) {
                    if (fr.dragAllowPage) {
                        fr.dragAllowPage = false;
                        this.nCurPage--;
                        fr.doResize();
                    }
                    return;
                } else if (x > dxParent + xParent && this.nCurPage + 1 < this.nPages) {
                    if (fr.dragAllowPage) {
                        fr.dragAllowPage = false;
                        this.nCurPage++;
                        fr.doResize();
                    }
                    return;
                }

                fr.dragAllowPage = true;
                this.dragBefore = 0;
                $(".clToplink").css("border", "1px solid #fff");
                for (var j = 0; j < fr.lpDragTargets.length; j++) {
                    var target = fr.lpDragTargets[j];
                    if (x >= target.x && y >= target.y && x < target.x + target.width && y < target.y + target.height) {
                        this.dragBefore = target;
                        if (1) {
                            if (fr.dragBefore.toplinkId != fr.dragLastTarget) {
                                fr.dragLastTarget = fr.dragBefore.toplinkId;
                                fr.MoveToplinkBefore(fr.dragToplinkId, fr.dragBefore, false);
                                fr.doResize();
                            }
                        }
                        if (target.mode)
                            $(target.divId).css("border", "1px solid #f00");
                        else
                            $(target.divId).css("border", "1px solid #00f");
                        break;
                    }
                }
            }
        }
    },

    CreateEditModeButtons: function(j, tl, dy1) {
        if (fr.drag)
            return "";
        var sInner = '<div id="idBlack_' + j + '" class="clBlackButton"><center>'
        var w = 49 * dy1 / 126 / 2;

        sInner += '<img width=' + w + ' id="iddel_' + j + '" src="./png/del.png" title="' + getI18nMsg('iddel') + '"/>';
        sInner += '</center></div>';
        return sInner;
    },
    createVideoItemHtml: function(j, cur, thumb, dx1, dy1, si) {
        var sInner = "";
        for (var i = 0; i < VideoSites.length; i++) {
            if (cur.url.toLowerCase().indexOf(VideoSites[i].filter) >= 0) {
                if (!si) {
                    si = new Object();
                    si.w = VideoSites[i].w;
                    si.h = VideoSites[i].h;
                }
                if (si) {
                    var w = dx1;
                    var h = w * si.h / si.w;
                    if (h < dy1) {
                        h = dy1;
                        w = h * si.w / si.h;
                    }
                    var mx = (dx1 - w) / 2;
                    var my = (dy1 - h) / 2;

                    sInner += '<div class="clThumb" style="overflow:hidden;padding:0px;height:100%;width:100%;" >';
                    //sInner += '<img draggable=false style="width:' + w + 'px;height:' + h + 'px; margin-left:' + mx + 'px;margin-top:' + my + 'px;" src="' + thumb + '"></img>';
                    sInner += '<img draggable=false style="width:224px;height:168px; margin-left:0px;margin-top:-21px;" src="' + thumb + '"></img>';
                    sInner += '</div>';
                } else
                    sInner += '<img draggable=false class="clThumb" width=100% height=100%  src="' + thumb + '"></img>';
                sInner += '<div style="position:absolute; right:0;top:0;"><img draggable=false class="clVideoStrip"  src="./png/movie.png"></img></div>';
                sInner += '<div style="position:absolute; right:-1px;bottom:0;height:24px;"><img draggable=false class="clVideoLogo"  src="' + VideoSites[i].thumb + '"></img></div>';
                break;
            }
        }
        return sInner;
    },

    createVideoOverlayHtml: function(thumb, dx1, dy1, si) {
        var sInner = "";
        if (!si)
            return "";

        var w = dx1;
        var h = w * si.h / si.w;
        if (h < dy1) {
            h = dy1;
            w = h * si.w / si.h;
        }
        var mx = (dx1 - w) / 2;
        var my = (dy1 - h) / 2;

        sInner += '<div class="clThumb" style="overflow:hidden;padding:0px;height:100%;width:100%;" >';
        sInner += '<img draggable=false style="width:' + w + 'px;height:' + h + 'px; margin-left:' + mx + 'px;margin-top:' + my + 'px;" src="' + thumb + '"></img>';
        sInner += '</div>';
        return sInner;
    },

    GetDefaults: function(callback) {
        if (typeof(chrome) != 'undefined') {
            // Chrome
            var sitems = L64P._db._locStorage.getItem("defaults")

            if ((sitems == null) || (typeof(sitems) == 'undefined')) {
                defaults = defaults2;
                L64P._db._locStorage.setItem("defaults", JSON.stringify(defaults));
            } else {
                defaults = JSON.parse(sitems);
                if (!defaults || !defaults.addOnShops)
                    defaults = defaults2;
            }
            callback();
        }
    },

    ResetTheme: function() {
        if (!confirm(getI18nMsg("resethelp2")))
            return;

        fr.SetDefaultSettings();
        fr.ShowToplinks(fr.settings.fShowToplinks);
        fr.doResize();
        fr.ShowMsgDlg(0);
        fr.ShowMsgDlg(1);
    },

    SetDefaultSettings: function() {
        fr.settings = new Object();
        fr.settings.fShowToplinks = true;
        fr.settings.special = 255;

        fr.settings.trans = userContent.trans ? userContent.trans : "0.9";
        fr.settings.fUseThemeDefaults = true;
        fr.settings.fShowSlideshow = false;
        fr.settings.lastSlide = "";

        fr.settings.sync = true;
        fr.settings.border = userContent.border;

        if (userContent.textcolor)
            fr.settings.color_text = userContent.textcolor;
        else
            fr.settings.color_text = '#fff';

        if (userContent.bordercolor)
            fr.settings.color_border = userContent.bordercolor;
        else
            fr.settings.color_border = '#000';

        if (userContent.backgroundcolor)
            fr.settings.color_background = userContent.backgroundcolor;
        else
            fr.settings.color_background = '#555';
        fr.settings.help = 15;

        fr.SaveSettings();
    },

    FindToplinkType: function(parent, type) {
        var bottom = parent ? parent.Toplinks : fr.lpToplinkBottomFolder;
        for (var i = 0; i < bottom.length; i++) {
            var o = bottom[i];
            if (o.type == type)
                return o;
            if (o.Toplinks) {
                var result = this.FindToplinkType(o, type);
                if (result)
                    return result;
            }
        }
        return 0;
    },

    SetStars: function(count, clicked) {
        if (fr.shadowcolor == "#000")
            var s1 = "./png/star1.png";
        else
            var s1 = "./png/star3.png";
        var s2 = "./png/star2.png";
        if (count < 0)
            count = fr.settings.Stars;

        if (clicked) {
            fr.settings.Stars = count;
            fr.SaveSettings();
        }

        $("#star1").attr("src", count >= 1 ? s1 : s2);
        $("#star2").attr("src", count >= 2 ? s1 : s2);
        $("#star3").attr("src", count >= 3 ? s1 : s2);
        $("#star4").attr("src", count >= 4 ? s1 : s2);
        $("#star5").attr("src", count >= 5 ? s1 : s2);
    },

    _locStorage: false,

    page: 0,
    
    doInit: function() {

        if (window.location.href.indexOf("page=video") >= 0) {
            var i = window.location.href.indexOf("&id=");
            if (i >= 0) {
                fr.startvideoid = window.location.href.substr(i + 4);
                i = fr.startvideoid.indexOf("&");
                if (i >= 0)
                    fr.startvideoid = fr.startvideoid.substr(0, i);
            }
            fr.page = "video";
        }

        // prevent Drag&Drop
        $(document).bind("dragstart", function(e) {
            if (e.target.nodeName.toUpperCase() == "IMG")
                return false;
            else if (e.target.nodeName.toUpperCase() == "A")
                return false;
            else
                alert(e.target.nodeName.toUpperCase());
        });

        fr.SetStars(-1, false);

        fr.myBindIn("#star1", {}, function(ev) {
            fr.SetStars(1, false);
        });
        fr.myBindOut("#star1", {}, function(ev) {
            fr.SetStars(-1, false);
        });
        fr.myBindClick("#star1", {}, function(ev) {
            fr.SetStars(1, true);
        });
        fr.myBindIn("#star2", {}, function(ev) {
            fr.SetStars(2, false);
        });
        fr.myBindOut("#star2", {}, function(ev) {
            fr.SetStars(-1, false);
        });
        fr.myBindClick("#star2", {}, function(ev) {
            fr.SetStars(2, true);
        });
        fr.myBindIn("#star3", {}, function(ev) {
            fr.SetStars(3, false);
        });
        fr.myBindOut("#star3", {}, function(ev) {
            fr.SetStars(-1, false);
        });
        fr.myBindClick("#star3", {}, function(ev) {
            fr.SetStars(3, true);
        });
        fr.myBindIn("#star4", {}, function(ev) {
            fr.SetStars(4, false);
        });
        fr.myBindOut("#star4", {}, function(ev) {
            fr.SetStars(-1, false);
        });
        fr.myBindClick("#star4", {}, function(ev) {
            fr.SetStars(4, true);
        });
        fr.myBindIn("#star5", {}, function(ev) {
            fr.SetStars(5, false);
        });
        fr.myBindOut("#star5", {}, function(ev) {
            fr.SetStars(-1, false);
        });
        fr.myBindClick("#star5", {}, function(ev) {
            fr.SetStars(5, true);
        });

        $(".clTextColor").css("color", fr.GetTextColor());

        if (fVideoVersion) {
            var o = new Object();
            o.searchurl = "";
            o.type = "v"
            o.name = getI18nMsg("videolist");
            o.Toplinks = new Array();
            o.p1x1 = "";
            o.id = fr.nextfreeid++;
            fr.lpToplinkBottomFolder = new Array();
            fr.lpToplinkBottomFolder.splice(0, 0, o);
            fr.doSetFolder(o.id);
            fr.doResize();
        }

        window.addEventListener("resize", this.doResize, false);
        
        fr.InitSearchProvider();

        $("#idInputFilter").keyup(function() {
            fr.SetFilter(this.value)
        });

        $("#idDelAll").click( function() {fr.DelAllToplinks();});
        $("#idSettings").click(function() {
            fr.ShowMsgDlg(1);
            return false;
        });
        //支持的site
        $("#supportSites").click(function() {
            fr.showSitesDlg();
            return false;
        });
        $(".clDlgBack").click(function() {
            $(this).closest('.clDlg').hide();
            return false;
        });

        $(".close").click(function() {
            $(this).closest('.clDlg').hide();
            return false;
        });
        $("#idEditMode").click(function() {
            fr.doEditMode(1);
            return false;
        });
        $("#idEditModeDone").click(function() {
            fr.doEditMode(0);
            return false;
        });
        $("#idEditModeCancel").click(function() {
            fr.doEditMode(-1);
            return false;
        });

        $("#divLeft").click(function() {
            fr.doChangePage(-1);
            return false;
        });
        $("#divRight").click(function() {
            fr.doChangePage(1);
            return false;
        });

        $("#idSlideshow").css("visibility", "hidden");
        $("#body").css("visibility", "visible");
        setTimeout(function() {
            $("#body").css("idSlideshow", "visible");
        }, 100);
        setTimeout(function() {
            $('#idInput').focus().val("").scrollTop();
        }, 150);

        fr.myBind("#idDrag", 'mouseup', {}, function(ev) {
            fr.HandleDrag(0);
            return false;
        });

        fr.ShowToplinks(fr.settings.fShowToplinks);

    },

    iCounter: 0,

    myMouseMove: function(ev) {
        if (!ev)
            ev = window.event;
        var xx = ev.pageX;
        var yy = ev.pageY;

        if (!xx && !yy) {
            xx = ev.x;
            yy = ev.y;
        }
        var x = xx;
        var y = yy;
        x -= 224 / 2;
        y -= 126 / 2;
        var scrY = document.documentElement.scrollTop;
        $("#idDrag").css({
            "left": x + "px"
        });
        $("#idDrag").css({
            "top": y + "px"
        });
        if (fr.drag)
            fr.HandleDrag(2);
    },

    SaveToplinks: function() {
        if (fVideoVersion)
            return;
        var a = fr.CopyArray(fr.lpToplinkBottomFolder, true);
        L64P.toplinks.setLocal({
            data: a
        });
    },

    SaveSettings: function() {
        L64P.settings.set({
            id: 'settings',
            data: fr.settings
        });
    },

    ShowToplinks: function(mode) {
        if (mode == 2)
            fr.settings.fShowToplinks = !fr.settings.fShowToplinks;
        else
            fr.settings.fShowToplinks = mode;
        fr.SaveSettings();
        if (fr.settings.fShowToplinks) {
            $("#idFilterText").show();
            $("#idFilter").show();
            $("#idSlideControls").hide();
            $("#idToplinks").show();
            $("#idEditMode").show();
            this.doResize();
        } else {
            $("#idFilterText").hide();
            $("#idFilter").hide();
            $("#idToplinks").hide();
            $("#idSlideControls").show();
            $("#idEditMode").hide();
        }
    },

    InitSearchProvider: function() {
        var shadowcolor;
        var bkcolor = "";
        var textcolor;
        var bordercolor = fr.GetBorderColor();
        if (fr.curframe) {
            textcolor = fr.curframe.textcolor;
            bkcolor = fr.curframe.bkcolor;
        } else {
            textcolor = fr.GetTextColor();
        }
        var c = textcolor.charAt(1);
        
        if (!fr.curframe && (bordercolor == "#000" || bordercolor == "#000000")) {
            shadowcolor = "#000";
            $("#idLogo").attr("src", "./png/logovideo.png");
        } else if (c < '8') {
            shadowcolor = "#fff";
        } else {
            shadowcolor = "#000";
            $("#idLogo").attr("src", "./png/logovideo.png");
        }

        if (fr.curframe)
            var color = 'style="color:' + textcolor + ';text-shadow: ' + shadowcolor + ' 4px 4px 4px;"';
        else
            var color = 'style="color:' + textcolor + ';text-shadow: none"';

    },

    lastState: 0,
    fVideosChanged: false,
    doEditMode: function(on) {
        if (!fr.settings.fShowToplinks)
            return;
        if (on > 0) {
            $("#idFilterText").hide();
            $("#idFilter").hide();
            $("#idEditMode").hide();
            $("#supportSites").hide();
            $(".clEditMode").show();
            $("#idSettings").hide();
            $("#idTextLinks").css("right", "35px");

            if (fr.curFilter)
                fr.SetFilter("");

            lastState = new Object();
            lastState.folder = this.lpCurFolder ? this.lpCurFolder.id : 0;
            lastState.page = fr.nCurPage;

            fr.fVideosChanged = false;
        } else {
            $("#idFilterText").show();
            $("#idFilter").show();
            $("#idToplinks").show();
            $("#idEditMode").show();
            $("#supportSites").show();
            $("#idEditMode").show();
            $(".clEditMode").hide();
            $("#idSettings").show();
            $("#idTextLinks").css("right", "35px");

            if (on == -1) //Cancel edit mode
            {
                if (!fVideoVersion) {
                    L64P.toplinks.getLocal({}, function(data) {
                        fr.lpToplinkBottomFolder = data.toplinks;
                        fr.nextfreeid = data.nextid;
                        fr.lpCurFolder = 0;
                        fr.nCurFolderLevel = 0;
                        fr.SetFilter("");
                        if (lastState) {
                            fr.nCurPage = lastState.page;
                            if (lastState && lastState.folder)
                                fr.doSetFolder(lastState.folder);
                            else
                                fr.doResize();

                        }
                    });
                }
                on = 0;
            } else {
                if (fVideo && fr.fVideosChanged) {
                    var tl = fr.FindToplinkType(0, "v");
                    if (tl) {
                        var videoItemIds = new Array();
                        for (var i = 0; i < tl.Toplinks.length; i++) {
                            videoItemIds.push(tl.Toplinks[i].url);
                        }
                        L64P.video.saveItems({
                            id: videoItemIds
                        }); //.videoid
                    }
                }
                fr.SaveToplinks();
            }
        }

        this.fEditMode = on;
        this.doResize();
    },

    DelAllToplinks: function() {
        fr.lpToplinkBottomFolder = new Array();
        this.lpCurFolder = 0;
        this.curFilter = "";
        this.nCurFolderLevel = 0;
        fr.SetFilter("");
    },

    GetScreenshotUrl: function(o, frefresh) {
        if (o && o.type == "video") {
            o.screenshotURL = o.thumb;
            return;
        }
        if (!o.url)
            return;
        o.screenshotURL = "*";
        L64P.toplinks.getScreenshotURL({
            data: o
        }, function(data) {
            if (frefresh)
                if (o.screenshotURL != "*")
                    fr.doResize();
        });
        return "";
    },

    idCurrentEdit: 0,

    //拿到视频列表页的缩略图
    GetToplinkThumb: function(tl) {
        if (tl.thumb)
            return tl.thumb;

        if (tl.screenshotURL && tl.screenshotURL != "*" && tl.screenshotURL.indexOf("invalid_224") < 0)
            return tl.screenshotURL;

        if (tl.type == "v")
            return "./png/folder_video.png";

        return "./png/nothumb.png";
    },

    FindToplink: function(parent, id) {
        var bottom = parent ? parent.Toplinks : fr.lpToplinkBottomFolder;
        for (var i = 0; i < bottom.length; i++) {
            var o = bottom[i];
            if (o.id == id)
                return o;
            if (o.Toplinks) {
                var result = this.FindToplink(o, id);
                if (result)
                    return result;
            }
        }
        return 0;
    },

    GetToplinkIndex: function(bottom, toplinkId) {
        for (var j = 0; j < bottom.length; j++) {
            if (bottom[j].id == toplinkId)
                return j;
        }
        return -1;
    },

    MoveToplinkBefore: function(toplinkId, target, fAllowIntoFolder) {
        if (target.mode == 1 && !fAllowIntoFolder) // Not into Folder during D&D
            return;
        var bottom = fr.lpCurFolder ? fr.lpCurFolder.Toplinks : fr.lpToplinkBottomFolder;
        var i = fr.GetToplinkIndex(bottom, toplinkId);
        if (i < 0)
            return;
        var o = bottom[i];

        if (fr.lpCurFolder) {
            if (target.toplinkId < 0 && target.mode == 1 && this.nCurFolderLevel > 0) // Backbutton
            {
                if (fr.lpCurFolder.type == "v") // Videos must not be move in any other folder
                    return;
                bottom.splice(i, 1); // Del 1 Element at i
                fr.lpCurFolder.Toplinks = bottom;
                var parent = fr.FindToplink(0, this.lpFolderStack[this.nCurFolderLevel - 1].id);
                if (parent)
                    parent.Toplinks.push(o);
                else
                    fr.lpToplinkBottomFolder.push(o);
                return;
            }
        }

        if (target.mode == 2) // At the end
        {
            bottom.splice(i, 1); // Del 1 Element at i
            bottom.push(o); // insert 1 element at before
        } else {
            var before = fr.GetToplinkIndex(bottom, target.toplinkId);
            if (before < 0)
                return;
            if (target.mode == 1) {
                alert(14);
                var oFolder = bottom[before];
                if (oFolder && oFolder.type != "f")
                    return;
                bottom.splice(i, 1); // Del 1 Element at i
                if (!oFolder.Toplinks)
                    oFolder.Toplinks = new Array();
                oFolder.Toplinks.push(o);
            } else {
                if (i > before) {
                    bottom.splice(i, 1); // Del 1 Element at i
                    bottom.splice(before, 0, o); // insert 1 element at before

                } else if (i < before) {
                    bottom.splice(before, 0, o); // insert 1 element at before
                    bottom.splice(i, 1); // Del 1 Element at i
                }
            }
        }
        if (fr.lpCurFolder)
            fr.lpCurFolder.Toplinks = bottom;
        else
            fr.lpToplinkBottomFolder = bottom;
    },

    DelDefaultToplinks: function(parent) {
        var bottom = parent ? parent.Toplinks : fr.lpToplinkBottomFolder;
        for (var i = 0; i < bottom.length; i++) {
            var o = bottom[i];
            if (o.def == true) {
                bottom.splice(i, 1);
                if (!parent)
                    fr.lpToplinkBottomFolder = bottom;
                else
                    parent.Toplinks = bottom;
                i--;
                continue;
            }
            if (o.Toplinks)
                this.DelDefaultToplinks(o);
        }
    },

    ModifyToplinkRecur: function(parent, id, mode) {
        var bottom = parent ? parent.Toplinks : fr.lpToplinkBottomFolder;
        for (var i = 0; i < bottom.length; i++) {
            var o = bottom[i];
            if (o.id == id) {
                var a2 = bottom.slice(i + 1);
                var a1 = bottom.slice(0, i);
                bottom = a1.concat(a2);

                if (mode == "begin") {
                    a1 = new Array();
                    a1.push(o);
                    bottom = a1.concat(bottom);
                } else if (mode == "end") {
                    bottom.push(o);
                } else if (mode == "del") {
                    if (o.type == "v")
                        fr.settings.folder &= (255 - 8);
                    else if (o.type == "downloads")
                        fr.settings.special &= (255 - 1);

                    if (parent && parent.type == "v" && !fr.fEditMode) // Video folder
                    {
                        var videoItemIds = new Array();
                        for (var i = 0; i < bottom.length; i++) {
                            videoItemIds.push(bottom[i].url);
                        }
                        L64P.video.saveItems({
                            id: videoItemIds
                        });
                    }
                }
                if (!parent)
                    fr.lpToplinkBottomFolder = bottom;
                else
                    parent.Toplinks = bottom;
                //this.lpCurFolder = bottom;
                return true;
            }
            if (o.Toplinks)
                if (this.ModifyToplinkRecur(o, id, mode))
                    return true;
        }
        return false;
    },

    DelToplink: function(id) {
        this.ModifyToplinkRecur(0, id, "del");
        this.doResize();
        fr.SaveToplinks();
        checkVideo();
    },

    nextfreeid: 1,

    SetIds: function(parent)
    {
        for (var i = 0; i < parent.length; i++) {
            if (!parent[i].id)
                parent[i].id = this.nextfreeid++;
            if (parent[i].Toplinks)
                this.SetIds(parent[i].Toplinks);
        }
    },

    colorclicked: function(id) {
        var i = id.indexOf('_');
        var def = id.slice(i + 1);
        id = id.slice(0, i);
        fr.CreateColorSectors(id, '#' + def);
    },

    dlgbackgroundcolor: -1,
    dlgbordercolor: -1,
    dlgtextcolor: -1,
    CreateColorSectors: function(id, def) {
        if (id == "idbackgroundcolors") {
            fr.dlgbackgroundcolor = def;
            a = ["000", "777", "aaa", "fff", "f00", "f80", "ff0", "8f0", "0f0", "0f8", "0ff", "08f", "00f", "008", "80f", "f0f", "f08"];
        } else if (id == "idbordercolors") {
            fr.dlgbordercolor = def;
            a = ["000", "777", "aaa", "fff", "f00", "f80", "ff0", "8f0", "0f0", "0f8", "0ff", "08f", "00f", "008", "80f", "f0f", "f08"];
        } else {
            fr.dlgtextcolor = def;
            a = ["000", "777", "c0c0c0", "fff", "f00", "f80", "ff0", "8f0", "0f0", "0f8", "0ff", "08f", "00f", "008", "80f", "f0f", "f08"];
        }
        if (def == "#000000")
            def = "#000";
        var sInner = "";
        for (var i = 0; i < a.length; i++) {
            var id2 = id + "_" + a[i];
            sInner += "<div id='" + id2 + "' class='clColorSelect' style='background:#" + a[i] + "'>";
            if (def == ('#' + a[i]))
                sInner += "<img style='position:relative;left:3px;top:3px;' src='./png/radio1.png'/>";
            sInner += "</div>";
        }
        $("#" + id).html(sInner);

        for (var i = 0; i < a.length; i++) {
            var id2 = id + "_" + a[i];
            fr.myBindClick("#" + id2, {
                param: id2
            }, function(ev) {
                fr.colorclicked(ev.data.param);
                return false;
            });
        }
    },

    radioclicked: function() {
        if ($("#idchecknodefaults").attr("checked"))
            $("#idNoDefaults").show();
        else
            $("#idNoDefaults").hide();
    },

    settings: 0,
    ShowMsgDlg: function(mode) {
        if (mode == 1) {

            $("#b1").unbind('click');
            $("#b2").unbind('click');
            $("#b3").unbind('click');

            $("#b1").click(function() {
                fr.ShowMsgDlg(0);
                return false;
            });
            $("#b2").click(function() {
                fr.ShowMsgDlg(2);
                return false;
            });
            $("#b3").click(function() {
                fr.ShowMsgDlg(3);
                return false;
            });

            $("#b1").val(getI18nMsg('cancel'));
            $("#b2").val(getI18nMsg('ok'));
            $("#b3").val(getI18nMsg('apply'));

            if (!fVideo) {
                fr.settings.folder &= (255 - 8);
                $("#idVideoSettings").hide();
            }

            $("#idresettheme").val(getI18nMsg('resettheme'));

            $("#idresettheme").unbind('click');
            $("#idresettheme").click(function() {
                fr.ResetTheme();
                return false;
            });

            $("#idchecknodefaults").attr("checked", !fr.settings.fUseThemeDefaults);

            fr.radioclicked();

            $("#idchecknodefaults").unbind('click');
            $("#idchecknodefaults").click(function() {
                fr.radioclicked();
            });

            fr.CreateColorSectors("idbackgroundcolors", fr.settings.color_background);
            fr.CreateColorSectors("idbordercolors", fr.settings.color_border);
            fr.CreateColorSectors("idtextcolors", fr.settings.color_text);

            $("#idSelectTrans").val(fr.settings.trans);

            if (fFirefox) {
                sInner = "<option value='1'>" + getI18nMsg("langKey_icon1") + "</option>";
                sInner += "<option value='2'>" + getI18nMsg("langKey_icon2") + "</option>";
                sInner += "<option value='-1'>" + getI18nMsg("langKey_icon3") + "</option>";
                $("#idSelectIcon").html(sInner);

                var videoicon = fr._locStorage.getItem('videoicon')
                if (!videoicon)
                    videoicon = 2;
                $("#idSelectIcon").val(videoicon);
            } else {
                $("#langKey_icon").hide();
                $("#idSelectIcon").hide();
            }

            $("#idMsgDlg").show();
        } else if (mode == 0) // cancel
            $("#idMsgDlg").hide();
        else if (mode == 2 || mode == 3) // 2 == ok   3 == apply
        {
            if (mode == 2)
                $("#idMsgDlg").hide();

            fr.settings.fUseThemeDefaults = !$("#idchecknodefaults").attr("checked");

            fr.settings.color_background = fr.dlgbackgroundcolor;
            fr.settings.color_border = fr.dlgbordercolor;
            fr.settings.color_text = fr.dlgtextcolor;
            fr.settings.trans = $("#idSelectTrans").val();

            $(".clTextColor").css("color", fr.GetTextColor());
        }
    },

    showSitesDlg: function(){
        var a = new Array();
        for (var i1 = 0; i1 < VideoSites.length; i1++) {
            a.push(VideoSites[i1]);
        }

        a.sort(function(a, b) {
            return Math.round(Math.random() * 20 - 10);
        });
        var sInner = "";
        for (i1 = 0; i1 < a.length; i1++) {
            sInner += "<a href='" + a[i1].url + "'><img style='margin-left:5px;margin-top:3px; ' src='" + a[i1].thumb + "' height=24px/></a>"
        }
        $("#supportVideoList").html(sInner);
        
        $("#supportSiteDlg").closest(".clDlg").show();
    },

    ShowFirstDlg: function(mode) {
        fr.doInit();
    },

    CopyArray: function(aOld, fSave) {
        var a = new Array();
        for (var i = 0; i < aOld.length; i++) {
            if (fSave) {
                if (aOld[i].type == "video") // save not all
                    continue;
            }
            var o = fr.CopyObject(aOld[i], fSave);
            a.push(o);
        }
        return a;
    },

    CopyObject: function(oOld, fSave) {
        var o = new Object();
        for (var name in oOld) {
            if (name == "Toplinks") {
                o.Toplinks = fr.CopyArray(oOld.Toplinks, fSave);
            } else {
                o[name] = oOld[name];
            }
        }
        return o;
    },

    GetTextColor: function() {
        if (fr.settings.fUseThemeDefaults)
            return userContent.textcolor ? userContent.textcolor : "#fff";
        else
            return fr.settings.color_text;
    },
    GetBorderColor: function() {
        if (fr.settings.fUseThemeDefaults)
            return userContent.bordercolor ? userContent.bordercolor : "#000";
        else
            return fr.settings.color_border;
    },
    needRefresh: false,
    fShowSettingsOnly: false
}

//国际化, 设置语言包
function getI18nMsg(msgname) {
    try {
        return chrome.i18n.getMessage(msgname)
    } catch(err) {
        return msgname
    }
};

function SetLanguage() {
    $.each($(".langKey"), function() {
        id = $(this).attr("id");
        var j = id.indexOf('-');
        if (j >= 0)
            $('#' + id).html(getI18nMsg(id.slice(0, j)));
        else
            $('#' + id).html(getI18nMsg(id));
    });

    $("#idFilterText").html(getI18nMsg('filter'));
    $("#idButtonDone").val(getI18nMsg('done'));
    $("#idButtonCancel").val(getI18nMsg('cancel'));
}

function GetImageSize(url) {
    var o = 0;
    $(".clThumbBase").each(function() {
        if ($(this).attr("src") == url) {
            o = new Object();
            o.w = this.naturalWidth;
            o.h = this.naturalHeight;
            if (!o.w) {
                o = 0;
            } else if (o.w == 224 && o.h == 126)
                o = 0;
            else
                o = o;
        }
    });
    return o;
}

//检测有没收藏视频
function checkVideo(){
    if ($('.clToplinkBack').length == 0){
        $('#nonevideo').show();
    } else {
        $('#nonevideo').hide();
    }
}

$(document).ready(function() {
    fVideoVersion = true;

    fr.title = "Video downloader helper";
    document.title = fr.title;

    chrome.extension.sendMessage({
        msg: "OnSP24SetLang",
        fVideoVersion: fVideoVersion
    }, function(response) {});

    SetLanguage();

    fr.GetDefaults(function() {

        VideoSites = defaults.VideoSites;
        fr.settings = new Object();
        L64P.settings.get({
            id: 'settings'
        }, function(data) {
            var askForCountry = false;
            if (data) {
                fr.settings = data;
                //fr.SetUserContent();
            } else {
                askForCountry = true;
                fr.SetDefaultSettings();
            }

            if (!fVideo)
                fr.settings.folder &= (255 - 8);

            if (!fr.settings.trans) {
                fr.settings.trans = userContent.trans ? userContent.trans : "0.9";
            }
            if (window.location.href.indexOf("options=1") >= 0)
                fr.fShowSettingsOnly = true;
            if (fr.fShowSettingsOnly) {
                fr.doInit();

                fr.ShowMsgDlg(1);
            } else {
                if (!askForCountry)
                    fr.doInit();
                else {
                    $("#body").css("visibility", "visible");
                    fr.ShowFirstDlg();
                }
            }
        });
    }); // GetDefaults
    
    /*搜索切换*/
    $('.logoBox').hover(function(){
        $(".logoContainer").show();
    }, function(){
        $(".logoContainer").hide();
    })
    $('.logoItem').on('click', function(){
        var selImage = $(this).css('background-image');
        $('#J_linkLogo').css('background-image', selImage);
        if (selImage.match(/youtube/)){
            $('#searchGroupForm').attr('action', 'http://www.youtube.com/results');
        } else if (selImage.match(/google/)){
            $('#searchGroupForm').attr('action', 'http://www.google.com/search');
        }
        $(this).css('display','none').siblings().css('display', 'block');
        $('#J_logoContainer').hide();
    })

    /*新手引导*/
    if (!localStorage['guideStatus']){
        $('#walkthrough-wrapper').show();
        $('.body-container .gray-button').on('click', function(){
            $('#walkthrough-wrapper').hide();
            localStorage['guideStatus'] = 'ok';
        })
        $('.close-btn').on('click', function(){
            $('#walkthrough-wrapper').hide();
            localStorage['guideStatus'] = 'ok';
        })
    }
    checkVideo();
});


$(function() {
    $(':checkbox').each(function(e) {
        this.checked = localStorage[this.id] == 'true' ? true : false;
    });
    $(':checkbox').change(function(e) {
        localStorage[this.id] = this.checked;
        $('#tip').fadeIn(300).delay(1000).hide(0);
    });

});
