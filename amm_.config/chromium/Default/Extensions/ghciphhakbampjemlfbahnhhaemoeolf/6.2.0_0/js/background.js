String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		char = this.charCodeAt(i);
		hash = ((hash << 5) - hash) + char;
		hash = hash & hash;
	}
	return hash;
}

var L64B = {
	fVideoVersion: true,
	vars: {},
	startpage: {
		onMessage: function(details, sender, callback) {
			if (details.type == "__L64_SHOW_CHROME_SETTINGS") {
				chrome.tabs.create({
					"url": "chrome://settings",
					"selected": true
				}, function(tab) {});

			} else if (details.type == "__L64_NAVIGATE_CHROME_URL") {
				if (details.where == "newTab")
					chrome.tabs.create({
						"url": details.url,
						"selected": true
					}, function(tab) {});
				else
					chrome.tabs.update(null, {
						"url": details.url,
						"selected": true
					}, function(tab) {});
			}

			if (details.msg == "OnSP24GetVideoUrls") {
				if (callback) {
					chrome.tabs.get(details.tabId, function(tab) {
						//console.log(vdl.urlPlaying, tab, details.tabId, vdl.urllist[details.tabId]);
						if (tab && vdl.urlPlaying[details.tabId]) {
							if (tab.url.indexOf("showlist/index.html?page=video") >= 0) {
								if (L64B.video.scanHtmlForVideos(details.tabId, callback))
									return true;
							}
						}
						callback({
							videoUrls: vdl.urllist[details.tabId]
						})
					});
					return true;
				}
			} else if (details.msg == "OnDownloadVideo") {
				chrome.tabs.getSelected(undefined, function(tab) {
					vdl.downloadlist[details.url] = details.filename;
					var oldurl = tab.url;
					vdl.parentUrls[details.url] = tab.url;
					if (tab.url.indexOf("showlist/index.html?page=video") >= 0)
						chrome.tabs.create({
							"url": details.url,
							"selected": false
						}, function(tab) {});
					else
						chrome.tabs.update(tab.id, {
							"url": details.url,
							"selected": false
						}, function(tab) {});

					chrome.storage.local.get('video_downloads', function(data) {
						var count = parseInt(data["video_downloads"]);
						if (!count)
							count = 0;
						count++;
						chrome.storage.local.set({
							'video_downloads': count
						}, function() {});
						if (count == 12) {
							var t = "You have downloaded multiple videos with Video Downloader Super. Please share your experience with others and make a review for us.";
							if (confirm(t))
								chrome.tabs.create({
									"url": "https://chrome.google.com/webstore/detail/ghciphhakbampjemlfbahnhhaemoeolf",
									"selected": true
								}, function(tab) {});
						}
					});
				});
				return;
			} else if (details.msg == "OnSP24Navigate") {
				chrome.tabs.getSelected(undefined, function(tab) {
					chrome.tabs.update({
						"url": details.url,
						"active": true
					}, function(tab) {});
				});
			} else if (details.msg == "OnSP24AddVideo" || details.msg == "OnSP24AddVideo2") {
				// Add and Play
				chrome.tabs.getSelected(undefined, function(tab) {
					var url = vdl.parentUrls[tab.url];
					if (!url)
						url = tab.url;
					var title = tab.title;
					L64B.video.getInfos(url, false, title);
				});
			} else if (details.msg == "OnSP24SetLang") {
				L64B.fVideoVersion = details.fVideoVersion;
			} else if (details.msg == "OnSP24PlayVideo") {
				chrome.tabs.getSelected(undefined, function(tab) {
					vdl.urllist[tab.id] = false;
					if (!vdl.urlPlaying)
						vdl.urlPlaying = new Object();
					vdl.urlPlaying[tab.id] = new Object();
					vdl.urlPlaying[tab.id].url = details.url;
					vdl.urlPlaying[tab.id].title = details.title;
					L64B.video.onUpdateTab(tab.id, null, tab);
				});
			} else if (details.msg == "VideoPlaying") {
				if (callback) {
					callback(L64B.video.VideoPlayState);
				}
			} else if (details.msg == "SuspendGetVideoUrls") {
				if (callback) {
					chrome.tabs.getSelected(undefined, function(tab) {
						callback({
							videoUrls: vdl.urllist[tab.id]
						});
					})
					return true;
				}
			} else if (details.msg == "currentVideoInfo"){
				if (callback) {
					chrome.tabs.getSelected(undefined, function(tab) {
						callback(tab);
					});
					return true;
				}
			}
		}
	},
	request: {
		lshorthistory: new Object()
	},
	search: {
		lastUrl: false,
		onSearchDetect: function(details) {
			if (L64B.search.lastUrl == details.url)
				return;
			L64B.search.lastUrl = details.url;
			console.log("--- new search url" + details.url);
		}
	}
}
chrome.extension.onMessage.addListener(L64B.startpage.onMessage);



/*google analytics*/
var _gaq = _gaq || [];
_gaq.push(["_setAccount", "UA-53890230-1"]);
_gaq.push(["_trackPageview"]);
(function() {
	var ga = document.createElement("script");
	ga.type = "text/javascript";
	ga.async = true;
	ga.src = "https://ssl.google-analytics.com/ga.js";
	var s = document.getElementsByTagName("script")[0];
	s.parentNode.insertBefore(ga, s)
})();




chrome.notifications.onClicked.addListener(function() {
	chrome.tabs.create({
		url: "/showlist/index.html"
	}, function() {
		_gaq.push(['_trackEvent', 'videolist', 'notifications', 'click']);
	});
})







