var fVideoVersion = false;
var fSearchIsOn = false;

function GetFileExtension(ob) {
    var ext = ["flv", "mp4", "3g", "wmv", "mpg", "m4p", "m4v"];
    for (var j = 0; j < ext.length; j++) {
        if (ob.mime.indexOf(ext[j]) >= 0) {
            return ext[j];
        }
    }

    for (var j = 0; j < ext.length; j++) {
        if (ob.url & ob.url.toLowerCase().indexOf(ext[j]) >= 0) {
            return ext[j];
        }
    }
    return "flv";
}

function OnDownloadVideo(ev) {
    var i = parseInt(ev.srcElement.id.slice(4));
    if (i < videoUrls.length) {
        //window.close();
        var s = getFilename(videoUrls[i]);
        chrome.extension.sendMessage({
            msg: "OnDownloadVideo",
            url: videoUrls[i].url,
            filename: s
        }, function(response) {
        });
    }
}
function sendphone(ev) {
    var i = parseInt(ev.srcElement.id.slice(9));
    /*var plugin = document.getElementById("pluginId");
    if (plugin.NP_IsAppToolsInstalled()){
        plugin.NP_DownloadFile(0, videoUrls[i].url);
    } else {
        alert('您尚未安装手机助手');
    }*/
}

function OnSP24NavigateAddVideo() {
    window.close();
    chrome.extension.sendMessage({
        msg: "OnSP24AddVideo",
        tabId: curTabId
    }, function(response) {
    });
}

function OnSP24NavigateAddVideo2() // add and Play
{
    window.close();
    chrome.extension.sendMessage({
        msg: "OnSP24AddVideo2",
        tabId: curTabId
    }, function(response) {
    });
}

function OnSP24NavigateVideo() {
    var url = window.location.href;
    url = url.replace("popup.html", "showlist/index.html?page=video");

    window.close();
    chrome.extension.sendMessage({
        msg: "OnSP24Navigate",
        url: url
    }, function(response) {});
}

function getFilename(d) {
    var s = "";
    for (var j = 0; j < d.title.length; j++) {
        var c = d.title.charAt(j);
        if (c >= 'A' && c <= 'Z')
            s += c;
        else if (c >= 'a' && c <= 'z')
            s += c;
        else if (c >= '0' && c <= '9')
            s += c;
        else if ("- _()".indexOf(c) >= 0)
            s += c;
    }
    s += "." + GetFileExtension(d);
    return s;
}

var curTabId = 0;
var videoUrls = 0;
var showYoutubeMsg = false;

function hideControl(id) {
    var o = document.getElementById(id);
    if (o)
        o.style.display = "none";
}

function showVideoUrls() {
    var sInner = "";
    if (showYoutubeMsg) {
        sInner += "<div class='sep'></div><div class='ytbnote'><a id='note' href='#'>" + getI18nMsg("YTBNote") + "</a></div>";

    } else if (!videoUrls) {
        var o = document.getElementById("idNoVideo");
        if (o) {
            o.innerHTML = getI18nMsg("idnovideo") + "<a id='idNoVideoLink' style='margin-left:10px' href='#'>" + getI18nMsg("idwhy") + "</a>";
            o.style.display = "block";

            var o = document.getElementById("idNoVideoLink");
            o.addEventListener('click', function(e) {
                e.stopPropagation();
                var w = 500;
                var h = 220;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);

                chrome.tabs.get(curTabId, function(tab) {
                    if (tab) {
                        var url = "./novideo.html?url=" + tab.url;
                        window.open(url, "_blank", 'resizable=no, scrollbars=no, titlebar=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
                        window.close();
                    }
                });
                return true;
            });
        }
    }
    if (videoUrls) {
        for (var i = 0; i < videoUrls.length; i++) {
            var ob = videoUrls[i];
            var url = ob.url;
            var ext = GetFileExtension(ob);
            if (!i)
                sInner += "<div class='sep'></div><div class='clHeader'>" + getI18nMsg("idVDL") + "</div>";
            else
                sInner += "<div class='sep2'></div>";
            var color = "#aaa";
            if (ext == "flv")
                color = "#73AAFF";
            else if (ext == "mp4" || ext == "mp4" || ext == "m4v")
                color = "#58d2fd";
            else if (ext == "3g")
                color = "#faa";
            else if (ext == "wmv")
                color = "#aff";

            sInner += "<div class='wrap'><div class='clFileExt' style='background-color:" + color + "'>" + ext + "</div>";
            sInner += "<div title='" + url + "' class='clDownloadVideo' id='idv_" + i + "'>" + getFilename(ob) + "</div>"

            if (ob.bytes) {
                var mb = Math.floor(ob.bytes * 100 / 1024 / 1024) / 100;
                sInner += "<div class='clDownloadButton' id='idd_" + i + "'>Download " + mb + "MB</div><div class='sendButton' id='phoneidd_" + i + "'>Send to phone</div></div>";
            } else {
                sInner += "<div class='clDownloadButton' title='Waiting for the video server is answering' id='idd_" + i + "'>Waiting for Server</div>";
                //发版本注掉
                //sInner += "<div class='clDownloadButton' title='Waiting for the video server is answering' id='idd_" + i + "'>Waiting for Server</div><div class='sendButton' id='phoneidd_" + i + "'>Send to phone</div></div>";
            }
            if (!ob.bytes) {
                var client = new XMLHttpRequest();
                client.idControl = "idd_" + i;
                client.ob = ob;
                client.sendphoneid = "phoneidd_" + i;
                client.onreadystatechange = function() {
                    if (this.readyState == 2) {
                        var o = document.getElementById(this.idControl);
                        if (o) {
                            var bytes = this.getResponseHeader("Content-Length");

                            this.ob.bytes = bytes;

                            var mb = Math.floor(bytes * 100 / 1024 / 1024) / 100;
                            o.innerHTML = "Download " + mb + "MB";
                            o.title = "";
                            //发版本注掉
                            /*var phoneObj = document.getElementById(this.sendphoneid);
                            if (phoneObj){
                                phoneObj.style.display = 'block';
                            }*/
                        }
                    }
                }
                client.open("HEAD", url);
                client.send();
            }
        }
    }
    var o = document.getElementById("idVideos");
    if (o){
        o.innerHTML = sInner;
        if (document.getElementById("note")){
            var YTBNote = document.getElementById("note");
            YTBNote.addEventListener('click', function(e) {
                e.stopPropagation();
                var w = 500;
                var h = 220;
                var left = (screen.width / 2) - (w / 2);
                var top = (screen.height / 2) - (h / 2);

                chrome.tabs.get(curTabId, function(tab) {
                    if (tab) {
                        var url = "./ytbnote.html?url=" + tab.url;
                        window.open(url, "_blank", 'resizable=no, scrollbars=no, titlebar=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);
                        window.close();
                    }
                });
                return true;
            });
        }
    }
        
    var o = document.getElementById("idAdd");
    if (o)
        o.addEventListener('click', OnSP24NavigateAddVideo2);

    if (videoUrls)
        for (var i = 0; i < videoUrls.length; i++) {
            var o = document.getElementById("idd_" + i);
            if (o)
                o.addEventListener('click', OnDownloadVideo);
            var phoneObj = document.getElementById("phoneidd_" + i);
            if (phoneObj){
                phoneObj.addEventListener('click', sendphone);
            }
        }
}

document.addEventListener('DOMContentLoaded', function() {
    var query = window.location.search.substring(1);

    var popupText = ["idvideo", "idaddvideo"];
    for (i = 0; i < popupText.length; i++) {
        var ob = document.getElementById(popupText[i]);
        if (ob)
            ob.innerHTML = getI18nMsg(popupText[i]);
    }

    if (query.indexOf("canaddvideo=1") != -1)
        if (query.indexOf("mode=isyoutube") != -1) {
            showYoutubeMsg = true;
        }
    if (query.indexOf("version=video") != -1)
        fVideoVersion = true;

    if (fVideoVersion) {
        hideControl("idSep2");
    }
    if (query.indexOf("canaddvideo=1") < 0) {
        hideControl("idaddvideo");
        hideControl("idSep");
    }
    var j = query.indexOf("&tabid=");
    if (j >= 0)
        curTabId = parseInt(query.slice(j + 7));
    chrome.extension.sendMessage({
        msg: "OnSP24GetVideoUrls",
        tabId: curTabId
    }, function(response) {
        videoUrls = response.videoUrls;
        showVideoUrls();
    });

    var divs = document.querySelectorAll('div');
    for (var i = 0; i < divs.length; i++) {
        if (divs[i].className == "vdlButton") {
            //Add video to video list
            if (divs[i].id == "idaddvideo")
                divs[i].addEventListener('click', OnSP24NavigateAddVideo);
        } else if (divs[i].className == "idvideo") {
            //Show video list
            if (divs[i].id == "idvideo")
                divs[i].addEventListener('click', OnSP24NavigateVideo);
        }
    }
});

function getI18nMsg(msgname) {
    try {
        return chrome.i18n.getMessage(msgname)
    } catch(err) {
        return msgname
    }
};


var picobjtitle = {
    "en": "Sexy picture",
    "pt": "Imagem sexy",
    "tr": "Seksi resim",
    "pl": "Sexy zdjęcia",
    "es": "Sexy picture"
}
var gameobjtitle = {
    "en": "Hot games",
    "pt": "Jogos quentes",
    "tr": "Sıcak oyunlar",
    "pl": "Hot gry",
    "es": "Juegos calientes",
    "fr": "Jeux chauds"
}
var pictitle="Sexy pictures";
var gametitle="Hot games";
var _lang=window.navigator.language;
for(var i in picobjtitle){
    if(_lang.indexOf(i)>=0){
        pictitle=picobjtitle[i];
    }
}
for(var i in gameobjtitle){
    if(_lang.indexOf(i)>=0){
        gametitle=gameobjtitle[i];
    }
}
document.getElementById("hot_games").innerHTML=gametitle;
document.getElementById("hot_pics").innerHTML=pictitle;