var parseVideoTool = {
	isYoutube: function(url) {
        if (url && url.indexOf("youtube.") >= 0)
            return true;
        return false;
    },
    isCollegehumor: function(url) { 
        if (url && url.indexOf("collegehumor") >= 0)
            return true;
        return false;
    },
    isBreak: function(url){
        if (url && url.indexOf("break") >= 0)
            return true;
        return false;
    },
    isYouku: function(url){
        if (url && url.indexOf("youku") >= 0)
            return true;
        return false;
    },
    isDailyMotion: function(url){
        if (url && url.indexOf("dailymotion") >= 0)
            return true;
        return false;
    },
    isMetacafe: function(url){
        if (url && url.indexOf("metacafe") >= 0)
            return true;
        return false;
    },
    isSevenload: function(url){
        if (url && url.indexOf("sevenload") >= 0)
            return true;
        return false;
    },
    isYandex: function(url){
        if (url && url.indexOf("yandex") >= 0)
            return true;
        return false;
    },
    isGametrailers: function(url){
        if (url && url.indexOf("gametrailers") >= 0)
            return true;
        return false;
    },
    yandexId: '',
    URL: function(url) {
        if (typeof url == 'undefined') {
            url = location.href;
        }
        var segment = url.match(/^(\w+\:\/\/)?([\w\d]+(?:\.[\w]+)*)?(?:\:(\d+))?(\/[^?#]*)?(?:\?([^#]*))?(?:#(.*))?$/);
        if (!segment[3]) {
            segment[3] = '80';
        }
        var param = {};
        if (segment[5]) {
            var pse = segment[5].match(/([^=&]+)=([^&]+)/g);
            if (pse) {
                for (var i = 0; i < pse.length; i++) {
                    param[pse[i].split('=')[0]] = pse[i].split('=')[1];
                }
            }
        }
        return {
            url: segment[0],
            sechme: segment[1],
            host: segment[2],
            port: segment[3],
            path: segment[4],
            queryString: segment[5],
            fregment: segment[6],
            param: param
        };
    },
    //获取url参数
    getQueryString: function(url, name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search != '' ? window.location.search.substr(1).match(reg) : url.substr(1).match(reg);
        if (r != null) return unescape(r[2]); return null;
    },
    //生成缩略图
    vedioParsing: function(url, title) {
        //local解析
        var details = {};
        details.msg = "__L64_ON_NEW_VIDEO";
        details.videoInfo = {
            width: 459,
            height: 344,
            thumbnail_width: 480,
            thumbnail_height: 360
        };
        details.videoInfo.video_url = url;
        details.videoInfo.video_id = L64B.utils.crc32(url);
        details.videoInfo.title = title;
        details.videoInfo.html = '"<iframe width="459" height="344" src="' + url + '?feature=oembed" frameborder="0" allowfullscreen></iframe>"';

        //youtube vedio
        if (this.isYoutube(url)) {
            details.videoInfo.thumbnail_url = "http://i1.ytimg.com/vi/" + this.URL(url).queryString.split("=")[1] + "/hqdefault.jpg";
        } else if (this.isSevenload(url)){
            if (url.split('-').length > 0){
                var sevenloadId = url.split('-')[url.split('-').length - 1];
                details.videoInfo.thumbnail_url = "http://ak.cdn.sevenload.net/slcom-production/cdn/" + sevenloadId + "/thumbnail-0-640.jpg";
            }
        } else {
            $.ajax({
                url: url,
                async: false,   //同步执行
                dataType: "html",
                success: function(response){
                    // collegehumor
                    if (parseVideoTool.isCollegehumor(url)) {
                        details.videoInfo.thumbnail_url = $(response).find("#video_html5").attr("poster");
                    } else if (parseVideoTool.isBreak(url)) {
                    // break
                        details.videoInfo.thumbnail_url = $(response).filter("meta[name='embed_video_thumb_url']").attr("content");
                    } else if (parseVideoTool.isYouku(url)) {
                        var youku_id = url.match('id_(.*?)\.html')[1];
                        details.videoInfo.thumbnail_url = $(response).find("#item_" + youku_id).find('img').attr("_src");
                    } else if (parseVideoTool.isDailyMotion(url)) {
                        details.videoInfo.thumbnail_url = "http://www.dailymotion.com" + $(response).filter("link[rel='thumbnail']").attr('href');
                    } else if (parseVideoTool.isMetacafe(url)){
                        details.videoInfo.thumbnail_url = $(response).filter("link[rel='image_src']").attr('href');
                    } /*else if (parseVideoTool.isYandex(url)){
                        var youtubeSrc = $(response).find('.b-player__video iframe').attr('src');
                        parseVideoTool.yandexId = youtubeSrc.match("embed\/([A-Za-z0-9]*)\?",'i')[1];
                        details.videoInfo.thumbnail_url = "http://i1.ytimg.com/vi/" + yandexId + "/hqdefault.jpg";
                    }*/ else if (parseVideoTool.isGametrailers(url)){
                        details.videoInfo.thumbnail_url = $(response).filter("meta[property='og:image']").attr('content');
                    }
                }
            })
        }
        return details;
    },
    //生成视频播放iframe
    videoPlayFrame: function(url){
        var sInner;
        if (this.isYoutube(url)) {
            sInner = "<iframe id='idPV' src='http://www.youtube.com/embed/" + this.URL(url).queryString.split("=")[1] + "'></iframe>";    
        } else if (this.isCollegehumor(url)) {
            sInner = "<iframe id='idPV' src='http://www.collegehumor.com/e/" + url.match(/\d+/) + "'></iframe>";    
        } else if (this.isBreak(url)) {
            sInner = "<iframe id='idPV' src='http://www.break.com/embed/" + url.match(/\d+/) + "'></iframe>";    
        } else if (this.isYouku(url)) {
            var youku_id = url.match('id_(.*?)\.html')[1];
            sInner = "<iframe id='idPV' src='http://player.youku.com/embed/" + youku_id + "'></iframe>";  
        } else if (this.isDailyMotion(url)) {
            sInner = "<iframe id='idPV' src='http://www.dailymotion.com/embed/video/" + url.match('\/video\/(.*?)_')[1] + "'></iframe>"; 
        } else if (this.isMetacafe(url)) {
            sInner = "<iframe id='idPV' src='http://www.dailymotion.com/embed/" + url.match(/\d+/) + "'></iframe>"; 
        } else if (this.isSevenload(url)) {
            if (url.split('-').length > 0){
                var sevenloadId = url.split('-')[url.split('-').length - 1];
                sInner = "<iframe id='idPV' src='http://www.sevenload.com/widgets/single_player/" + sevenloadId + "'></iframe>"; 
            }
        } /*else if (this.isYandex(url)) {
            sInner = "<iframe id='idPV' src='http://www.youtube.com/embed/" + parseVideoTool.yandexId + "'></iframe>";  
        }*/else if (this.isGametrailers(url)) {
            $.ajax({
                url: url,
                async: false,   //同步执行
                dataType: "html",
                success: function(response){
                    var gametrailersUrl = $(response).filter("meta[name='twitter:player']").attr('value');
                    sInner = "<iframe id='idPV' src='" + gametrailersUrl + "'></iframe>"; 
                }
            })
        }
        return sInner;
    }
}