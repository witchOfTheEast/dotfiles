function loadJS() {
  if (!document.getElementById('suspendBar')) {
    var suspendBar = document.createElement('div');
    suspendBar.id = "suspendBar";
    suspendBar.className = "vdsuspendBar";
    suspendBar.innerHTML = '<ul class="statusbar" id="statusbar">' 
                              + '<li><a href="javascript:;" id="download" title="Download"><span class="icon-img icon-suspend-download icon-span"></span></a></li>' 
                              + '<li id="addlistli" style="display:none;"><a href="javascript:;" id="addlist" title="Add to Favorites "><span class="icon-img icon-suspend-addlist icon-span"></span></a></li>'
                              + '<li><a href="javascript:;" id="turnlight" title="turn off the light"><span class="icon-img icon-suspend-light icon-span"></span></a></li>' 
                              + '<li><a href="javascript:;" id="vdclose" title="Close" style="display:none;"><span class="icon-img icon-suspend-close icon-span"></span></a></li>' 
                          + '</ul>';
    $('body').append(suspendBar);
    $('body').append('<div id="vdplayshow-mask"></div>');
  }

  var href = window.location.href;
  var $suspendBar = $('#suspendBar');

  function cm(_this) {
    if(!_this) return;
    _thisOffset = _this.offset();
    if(!_thisOffset) return;
    $suspendBar.offset({
      top: _thisOffset.top,
      left: _thisOffset.left
    });
    setInterval(function(){
      _thisOffset = _this.offset();
      $suspendBar.offset({
        top: _thisOffset.top,
        left: _thisOffset.left
      });
    }, 2000)
    $('#turnlight').off('click').on('click', function() {
      var state = $('#vdplayshow-mask').css('display');
      _this.css({"overflow": 'visible', 'z-index': 999, 'visibility': 'visible', 'position': 'relative'});
      if (state == 'none') {
        $('#turnlight').attr('title', 'turn on the light');
        $('.icon-suspend-light').css('background-position', '0 -166px');
        $('#vdplayshow-mask').show();
      } else {
        $('#turnlight').attr('title', 'turn off the light');
        $('.icon-suspend-light').css('background-position', '0 -186px');
        $('#vdplayshow-mask').hide();
      }
    })

    $('#vdplayshow-mask').on('click', function() {
      $(this).hide();
    })
  }
  if (href.indexOf("youtube.com") >= 0) {
    $("#download").hide();
    cm($('#player-api'));
    $("#addlistli").show();
  } else if (href.indexOf("break.com") >= 0) {
    cm($('#video-player'));
    $('#turnlight').closest('li').hide();
  } else if (href.indexOf("collegehumor.com") >= 0) {
    cm($('article .stage'));
  } else if (href.indexOf("vimeo.com") >= 0) {
    cm($('.player_container'));
  } else if (href.indexOf("youku.com") >= 0) {
    cm($('#playBox'));
  } else if (href.indexOf("dailymotion.com") >= 0) {
    cm($('#container_player_main'));
  } else if (href.indexOf("sevenload.com") >= 0) {
    cm($('#sevenload_player'));
  } else if (href.indexOf('gametrailers.com') >= 0) {
    cm($('#player_wrap'));
  }
  
  $('#suspendBar').hover(function() {
    $('#vdclose').show();
  }, function() {
    $('#vdclose').hide();
  })

  $('#download').on('click', function() {
    chrome.extension.sendMessage({
      msg: "SuspendGetVideoUrls"
    }, function(response) {
      var videoUrls = response.videoUrls;
      if (Object.prototype.toString.call(videoUrls) === '[object Array]') {
        var CurrentVideo = videoUrls[0];
        suspendDownloadVideo(CurrentVideo);
      } else if (videoUrls == false) {
          //no video download
          //$("#download").hide();
      }
    });
  })

  function suspendDownloadVideo(obj) {
    var s = getFilename(obj);
    chrome.extension.sendMessage({
      msg: "OnDownloadVideo",
      url: obj.url,
      filename: s
    }, function(response) {});
  }

  $('#addlist').on('click', function() {
    chrome.extension.sendMessage({
      msg: "OnSP24AddVideo"
    }, function(response) {});
  });

  $('#vdclose').on('click', function() {
    $suspendBar.hide();
  })

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
}

chrome.extension.sendMessage({
  msg: "VideoPlaying"
}, function(response) {
  if (response) {
    setTimeout(function() {
      loadJS();
    }, 1000)
  }
});