// Credits and ideas: NotScripts, AdBlock Plus for Chrome, Ghostery, KB SSL Enforcer
var version = (function () {
	var xhr = new XMLHttpRequest();
	xhr.open('GET', chrome.extension.getURL('../manifest.json'), false);
	xhr.send(null);
	return JSON.parse(xhr.responseText).version;
}());
var synctimer;
var popup = [];
var icontype;
var changed = false;
const ITEMS = {};
var experimental = 0;
var storageapi = false;
function refreshRequestTypes() {
	requestTypes = ['main_frame'];
	if (localStorage['iframe'] == 'true' || localStorage['frame'] == 'true')
		requestTypes.push('sub_frame');
	if (localStorage['object'] == 'true' || localStorage['embed'] == 'true')
		requestTypes.push('object');
	if (localStorage['script'] == 'true')
		requestTypes.push('script');
	if (localStorage['image'] == 'true' || localStorage['webbugs'] == 'true')
		requestTypes.push('image');
	if (localStorage['xml'] == 'true')
		requestTypes.push('xmlhttprequest');
}
if (typeof chrome.storage !== 'undefined') {
	storageapi = true;
}
if (typeof chrome.webRequest !== 'undefined') {
	if (experimental == 0) experimental = 1;
	requestUrls = ["http://*/*", "https://*/*"];
	refreshRequestTypes();
	if (typeof chrome.webRequest !== 'undefined') {
		chrome.webRequest.onBeforeRequest.addListener(ScriptSafe, {"types": requestTypes, "urls": requestUrls}, ['blocking']);
		chrome.webRequest.onBeforeSendHeaders.addListener(mitigate, {"types": requestTypes, "urls": requestUrls}, ['requestHeaders', 'blocking']);
		chrome.webRequest.onHeadersReceived.addListener(inlineblock, {"types": requestTypes, "urls": requestUrls}, ['responseHeaders', 'blocking']);
	}
}
function mitigate(req) {
	//console.log(req);
	if (localStorage["enable"] == "false" || (localStorage['useragentspoof'] == 'off' && localStorage['cookies'] == 'false' && localStorage['referrerspoof'] == 'off')) {
		return;
	}
	for (i = 0; i < req.requestHeaders.length; i++) {
		if (req.requestHeaders[i].name == 'User-Agent' || req.requestHeaders[i].name == 'Referer' || req.requestHeaders[i].name == 'Cookie') {
			switch (req.requestHeaders[i].name) {
				case 'Cookie':
					if (localStorage['cookies'] == 'true' && baddies(req.url, localStorage['annoyancesmode'], localStorage['antisocial'])) 
						req.requestHeaders[i].value = '';
					break;
				case 'Referer':
					if (localStorage['referrerspoof'] == 'same')
						req.requestHeaders[i].value = req.url;
					else if (localStorage['referrerspoof'] == 'domain')
						req.requestHeaders[i].value = req.url.split("//")[0]+'//'+req.url.split("/")[2];
					else if (localStorage['referrerspoof'] != 'off')
						req.requestHeaders[i].value = localStorage['referrerspoof'];
					break;
				case 'User-Agent':
					if (localStorage['useragentspoof'] != 'off' && enabled(req.url) == 'true' && req.url.toLowerCase().indexOf('https://chrome.google.com/webstore') == -1) {
						if (localStorage['useragentspoof_os'] == 'w7') os = 'Windows; U; Windows NT 6.1';
						else if (localStorage['useragentspoof_os'] == 'wv') os = 'Windows; U; Windows NT 6.0';
						else if (localStorage['useragentspoof_os'] == 'w2k3') os = 'Windows; U; Windows NT 5.2';
						else if (localStorage['useragentspoof_os'] == 'wxp') os = 'Windows; U; Windows NT 5.1';
						else if (localStorage['useragentspoof_os'] == 'w98') os = 'Windows; U; Windows 98';
						else if (localStorage['useragentspoof_os'] == 'w95') os = 'Windows; U; Windows 95';
						else if (localStorage['useragentspoof_os'] == 'linux64') os = 'X11; U; Linux x86_64';
						else if (localStorage['useragentspoof_os'] == 'linux32') os = 'X11; U; Linux x86_32';
						else if (localStorage['useragentspoof_os'] == 'macsnow') os = 'Macintosh; U; Intel Mac OS X 10_6_8';
						else if (localStorage['useragentspoof_os'] == 'chromeos') os = 'X11; U; CrOS i686 0.13.507';
						if (localStorage['useragentspoof'] == 'chrome14')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+') AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.94 Safari/535.1';
						else if (localStorage['useragentspoof'] == 'chrome13')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+') AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.43 Safari/535.1';
						else if (localStorage['useragentspoof'] == 'chrome12')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+') AppleWebKit/534.30 (KHTML, like Gecko) Chrome/12.0.750.0 Safari/534.30';
						else if (localStorage['useragentspoof'] == 'opera12')
							req.requestHeaders[i].value = 'Opera/9.80 ('+os+') Presto/2.9.181 Version/12.00';
						else if (localStorage['useragentspoof'] == 'opera11')
							req.requestHeaders[i].value = 'Opera/9.80 ('+os+') Presto/2.9.168 Version/11.50';
						else if (localStorage['useragentspoof'] == 'firefox6')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+'; rv:6.0a2) Gecko/20110613 Firefox/6.0a2';
						else if (localStorage['useragentspoof'] == 'firefox5')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+'; rv:5.0) Gecko/20100101 Firefox/5.0';
						else if (localStorage['useragentspoof'] == 'firefox4')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+'; rv:2.0.1) Gecko/20110606 Firefox/4.0.1';
						else if (localStorage['useragentspoof'] == 'firefox3')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+'; rv:1.9.2.9) Gecko/20100913 Firefox/3.6.9';
						else if (localStorage['useragentspoof'] == 'ie10')
							req.requestHeaders[i].value = 'Mozilla/5.0 (compatible; MSIE 10.0; '+os+'; Trident/6.0)';
						else if (localStorage['useragentspoof'] == 'ie9')
							req.requestHeaders[i].value = 'Mozilla/5.0 (compatible; MSIE 9.0; '+os+')';
						else if (localStorage['useragentspoof'] == 'ie8')
							req.requestHeaders[i].value = 'Mozilla/4.0 (compatible; MSIE 8.0; '+os+')';
						else if (localStorage['useragentspoof'] == 'ie7')
							req.requestHeaders[i].value = 'Mozilla/4.0(compatible; MSIE 7.0; '+os+')';
						else if (localStorage['useragentspoof'] == 'ie61')
							req.requestHeaders[i].value = 'Mozilla/4.0 (compatible; MSIE 6.1; '+os+')';
						else if (localStorage['useragentspoof'] == 'ie60')
							req.requestHeaders[i].value = 'Mozilla/4.0 (compatible; MSIE 6.0; '+os+')';
						else if (localStorage['useragentspoof'] == 'safari5')
							req.requestHeaders[i].value = 'Mozilla/5.0 ('+os+') AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1';
					}
					break;
			}
		}
	}
	return { requestHeaders: req.requestHeaders };
}
function removeParams(str) {
	return str.replace(/#[^#]*$/, "").replace(/\?[^\?]*$/, "");
}
function UrlInList(url, elems) { // thanks vnagarnaik!
	var foundElem = false;
	for (var i = elems.length - 1; i >= 0; i--) {
		if (elems[i].indexOf(url) > -1) {
			foundElem = true;
			break;
		}
	}
	return foundElem;
}
function inlineblock(req) {
	if (req.tabId == -1 || req.url == 'undefined' || localStorage["enable"] == "false") {
		return;
	}
    var headers = req.responseHeaders;
	if (req.type == 'main_frame') {
		requrl = req.url.toLowerCase();
		if (experimental == '1' && localStorage['preservesamedomain'] == 'false' && localStorage['script'] == 'true' && enabled(requrl) == 'true') {
			headers.push({
				'name': 'Content-Security-Policy',
				'value': "script-src 'none'"
			});
		}
	}
    return { responseHeaders: headers };
}
function ScriptSafe(req) {
	if (req.tabId == -1 || req.url == 'undefined' || localStorage["enable"] == "false") {
		return;
	}
	requrl = req.url.toLowerCase();
	if (req.type == 'main_frame') {
		if (typeof ITEMS[req.tabId] === 'undefined') {
			resetTabData(req.tabId, requrl);
		} else {
			ITEMS[req.tabId]['url'] = requrl;
		}
	}
	if (requrl.substr(0,17) != 'chrome-extension:' && requrl.substr(0,4) == 'http') {
		reqtype = req.type;
		if (reqtype == "sub_frame") reqtype = 'frame';
		else if (reqtype == "main_frame") reqtype = 'page';
		else if (reqtype == "image") reqtype = 'webbug';
		if (elementStatus(requrl, localStorage['mode'], ITEMS[req.tabId]['url'])
		&& (
			(
				(((localStorage['annoyances'] == 'true' && (localStorage['annoyancesmode'] == 'strict' || (localStorage['annoyancesmode'] == 'relaxed' && domainCheck(relativeToAbsoluteUrl(requrl), 1) != '0'))) || (localStorage['webbugs'] == 'true' && reqtype == "image")) && baddies(requrl, localStorage['annoyancesmode'], localStorage['antisocial']) == '1')
				|| (localStorage['antisocial'] == 'true' && baddies(requrl, localStorage['annoyancesmode'], localStorage['antisocial']) == '2')
			)
		|| (
			(((reqtype == "frame" && (localStorage['iframe'] == 'true' || localStorage['frame'] == 'true')) || (reqtype == "script" && localStorage['script'] == 'true') || (reqtype == "object" && (localStorage['object'] == 'true' || localStorage['embed'] == 'true')) || (reqtype == "image" && localStorage['image'] == 'true') || (reqtype == "xmlhttprequest" && localStorage['xml'] == 'true' && thirdParty(requrl, extractDomainFromURL(ITEMS[req.tabId]['url']))))) && ((localStorage['preservesamedomain'] == 'true' && thirdParty(requrl, extractDomainFromURL(ITEMS[req.tabId]['url']))) || localStorage['preservesamedomain'] == 'false')
			)
		)) {
			//console.log("BLOCKED: "+reqtype+"|"+requrl);
			if (typeof ITEMS[req.tabId]['blocked'] === 'undefined') ITEMS[req.tabId]['blocked'] = [];
			if (!UrlInList(removeParams(req.url), ITEMS[req.tabId]['blocked'])) {
				//console.log(req.url+"|"+UrlInList(removeParams(req.url), ITEMS[req.tabId]['blocked']));
				ITEMS[req.tabId]['blocked'].push([removeParams(req.url), reqtype.toUpperCase()]);
				updateCount(req.tabId);
			}
			if (reqtype == 'frame') {
				return { redirectUrl: 'about:blank' };
			} else if (reqtype == 'webbug') {
				return { redirectUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==' };
				// https://adblockplus.org/forum/viewtopic.php?t=7422&start=60#p50994
			return { cancel: false };
			}
			return { cancel: true };
		} else {
			if (reqtype != 'webbug' && reqtype != 'page' && reqtype != 'xmlhttprequest') {
				//console.log("ALLOWED: "+reqtype+"|"+requrl);
				if (typeof ITEMS[req.tabId]['allowed'] === 'undefined') ITEMS[req.tabId]['allowed'] = [];
				if (!UrlInList(removeParams(req.url), ITEMS[req.tabId]['allowed'])) {
					ITEMS[req.tabId]['allowed'].push([removeParams(req.url), reqtype.toUpperCase()]);
				}
			}
			return { cancel: false };
		}
	}
	return { cancel: false };
}
function enabled(url) {
	if (localStorage["enable"] == "true" && domainCheck(url) != '0' && (domainCheck(url) == '1' || (localStorage["mode"] == "block" && domainCheck(url)) == '-1') && url.toLowerCase().indexOf('https://chrome.google.com/webstore') == -1) return 'true';
	return 'false';
}
function domainCheck(domain, req) {
	if (req === undefined) {
		if ((localStorage['annoyances'] == 'true' && localStorage['annoyancesmode'] == 'strict' && baddies(domain, localStorage['annoyancesmode'], localStorage['antisocial']) == '1') || (localStorage['antisocial'] == 'true' && baddies(domain, localStorage['annoyancesmode'], localStorage['antisocial']) == '2')) return '1';
	}
	domainname = extractDomainFromURL(domain.toLowerCase());
	var blackList = JSON.parse(localStorage['blackList']);
	var whiteList = JSON.parse(localStorage['whiteList']);
	var blackListSession = JSON.parse(sessionStorage['blackList']);
	var whiteListSession = JSON.parse(sessionStorage['whiteList']);
	if (domainname.substr(0,4) == 'www.') {
		domainname = domainname.substr(4);
	}
	if (localStorage['mode'] == 'allow' && in_array(domainname, blackListSession)) return '1';
	if (localStorage['mode'] == 'block' && in_array(domainname, whiteListSession)) return '0';
	if (in_array(domainname, blackList)) return '1';
	if (in_array(domainname, whiteList)) return '0';
	if (req === undefined) {
		if (localStorage['annoyances'] == 'true' && localStorage['annoyancesmode'] == 'relaxed' && baddies(domain, localStorage['annoyancesmode'], localStorage['antisocial']) == '1') return '1';
	}
	return '-1';
}
function domainSort(hosts) {
	sorted_hosts = new Array();
	split_hosts = new Array();
	multi = 0;
	if (hosts.length > 0) {
		multi = hosts[0].length;
		if (multi == 2) {
			for (h in hosts) {
				split_hosts.push([getDomain(extractDomainFromURL(hosts[h][0])), hosts[h][0], hosts[h][1]]);
			}
			split_hosts.sort();
			for (h in split_hosts) {
				sorted_hosts.push([split_hosts[h][1], split_hosts[h][2]]);
			}
		} else {
			for (h in hosts) {
				split_hosts.push([getDomain(extractDomainFromURL(hosts[h])), hosts[h]]);
			}
			split_hosts.sort();
			for (h in split_hosts) {
				sorted_hosts.push(split_hosts[h][1]);
			}
		}
		return sorted_hosts;
	}
	return hosts;
}
function trustCheck(domain, mode) {
	if (mode == 0) {
		var list = JSON.parse(localStorage['whiteList']);
	} else if (mode == 1) {
		var list = JSON.parse(localStorage['blackList']);
	}
	if (in_array(domain.toLowerCase(), list) == 2) return true;
	return false;
}
function topHandler(domain, mode) {
	if (domain) {
		domainHandler(domain, 2);
		if (!domain.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) domain = '*.'+getDomain(domain);
		domainHandler(domain, mode);
		return true;
	}
	return false;
}
function domainHandler(domain,action,listtype) {
	if (listtype === undefined)
		listtype = 0;
	if (domain) {
		errorflag = false;
		domain = domain.toLowerCase();
		action = parseInt(action);
		// Initialize local storage
		if (listtype == 0) {
			if (typeof(localStorage['whiteList'])=='undefined') localStorage['whiteList'] = JSON.stringify([]);
			if (typeof(localStorage['blackList'])=='undefined') localStorage['blackList'] = JSON.stringify([]);
			var whiteList = JSON.parse(localStorage['whiteList']);
			var blackList = JSON.parse(localStorage['blackList']);
		} else if (listtype == 1) {
			if (typeof(sessionStorage['whiteList'])=='undefined') sessionStorage['whiteList'] = JSON.stringify([]);
			if (typeof(sessionStorage['blackList'])=='undefined') sessionStorage['blackList'] = JSON.stringify([]);
			var whiteList = JSON.parse(sessionStorage['whiteList']);
			var blackList = JSON.parse(sessionStorage['blackList']);
		}
		// Remove domain from whitelist and blacklist
		var pos = whiteList.indexOf(domain);
		if (pos>-1) whiteList.splice(pos,1);
		pos = blackList.indexOf(domain);
		if (pos>-1) blackList.splice(pos,1);
		if (domain.substr(0,4)=='www.') {
			var pos = whiteList.indexOf(domain.substr(4));
			if (pos>-1) whiteList.splice(pos,1);
			pos = blackList.indexOf(domain.substr(4));
			if (pos>-1) blackList.splice(pos,1);
			domain = domain.substr(4);
		}
		if (domain.substr(0,2)=='*.') {
			if (action != '2') {
				var pos = whiteList.indexOf(domain.substr(2));
				if (pos>-1) whiteList.splice(pos,1);
				pos = blackList.indexOf(domain.substr(2));
				if (pos>-1) blackList.splice(pos,1);
				if ((in_array(domain, whiteList) && in_array(domain, whiteList) != 2) || (in_array(domain, blackList) && in_array(domain, blackList) != 2)) {
					if (confirm('Previous entries detected that refer to specific sub-domains on '+domain.substr(2)+'.\r\n\r\nDo you want to delete the previous entries?')) {
						if (action == '0') {
							dinstances = haystackSearch(domain, whiteList);
							for (x=0; x<dinstances.length; x++) {
								whiteList.splice(whiteList.indexOf(dinstances[x]),1);
							}
						} else if (action == '1') {
							dinstances = haystackSearch(domain, blackList);
							for (x=0; x<dinstances.length; x++) {
								blackList.splice(blackList.indexOf(dinstances[x]),1);
							}
						}
					}
				}
			}
		}
		switch(action) {
			case 0:	// Whitelist
				if (in_array(domain, whiteList) != 2) whiteList.push(domain);
				else errorflag = true;
				break;
			case 1:	// Blacklist
				if (in_array(domain, blackList) != 2) blackList.push(domain);
				else errorflag = true;
				break;
			case 2:	// Remove
				break;
		}
		if (errorflag) return false;
		if (listtype == 0) {
			localStorage['whiteList'] = JSON.stringify(whiteList);
			localStorage['blackList'] = JSON.stringify(blackList);
		} else if (listtype == 1) {
			sessionStorage['whiteList'] = JSON.stringify(whiteList);
			sessionStorage['blackList'] = JSON.stringify(blackList);
		}
		return true;
	}
	return false;
}
function haystackSearch(needle, haystack) {
	var keys = [];
	for (key in haystack) {
		if (getDomain(needle) == getDomain(haystack[key])) {
			keys.push(haystack[key]);
		}
	}
	return keys;
}
function optionExists(opt) {
	return (typeof localStorage[opt] != "undefined");
}
function defaultOptionValue(opt, val) {
	if (!optionExists(opt)) localStorage[opt] = val;
}
function setDefaultOptions() {
	defaultOptionValue("version", version);
	defaultOptionValue("sync", "false");
	defaultOptionValue("syncenable", "false");
	defaultOptionValue("syncnotify", "true");
	defaultOptionValue("syncfromnotify", "true");
	defaultOptionValue("updatenotify", "true");
	defaultOptionValue("enable", "true");
	defaultOptionValue("mode", "block");
	defaultOptionValue("refresh", "true");
	defaultOptionValue("script", "true");
	defaultOptionValue("noscript", "false");
	defaultOptionValue("object", "true");
	defaultOptionValue("applet", "true");
	defaultOptionValue("embed", "true");
	defaultOptionValue("iframe", "true");
	defaultOptionValue("frame", "true");
	defaultOptionValue("audio", "true");
	defaultOptionValue("video", "true");
	defaultOptionValue("image", "false");
	defaultOptionValue("xml", "true");
	defaultOptionValue("annoyances", "true");
	defaultOptionValue("annoyancesmode", "relaxed");
	defaultOptionValue("antisocial", "false");
	defaultOptionValue("preservesamedomain", "false");
	defaultOptionValue("webbugs", "true");
	defaultOptionValue("classicoptions", "false");
	defaultOptionValue("rating", "true");
	defaultOptionValue("referrer", "true");
	defaultOptionValue("linktarget", "off");
	defaultOptionValue("domainsort", "true");
	defaultOptionValue("useragentspoof", "off");
	defaultOptionValue("useragentspoof_os", "off");
	defaultOptionValue("referrerspoof", "off");
	defaultOptionValue("cookies", "true");
	if (!optionExists("blackList")) localStorage['blackList'] = JSON.stringify([]);
	if (!optionExists("whiteList")) localStorage['whiteList'] = JSON.stringify(["translate.googleapis.com","talkgadget.google.com","mail.google.com","*.youtube.com","s.ytimg.com","maps.gstatic.com"]);
	if (typeof sessionStorage['blackList'] === "undefined") sessionStorage['blackList'] = JSON.stringify([]);
	if (typeof sessionStorage['whiteList'] === "undefined") sessionStorage['whiteList'] = JSON.stringify([]);
	chrome.browserAction.setBadgeBackgroundColor({color:[208, 0, 24, 255]});
}
function updateCount(tabId) {
	const TAB_ITEMS = ITEMS[tabId] || (ITEMS[tabId] = [0]);
	const TAB_BLOCKED_COUNT = ++TAB_ITEMS[0];
	chrome.browserAction.setBadgeBackgroundColor({ color: [208, 0, 24, 255], tabId: tabId });
	chrome.browserAction.setBadgeText({tabId: tabId, text: TAB_BLOCKED_COUNT + ''});
}
function removeFromArray(arr, value) {
	for (var i = arr.length-1; i >= 0; i--) {
		if (arr[i][0] == value)
			arr.splice(i,1);
	}
}
function removeHash(str) {
	if (str.indexOf("#") != -1) return str.substr(0, str.indexOf("#"));
	return str;
}
function resetTabData(id, url) {
	if (id && url) {
		ITEMS[id] = [0];
		ITEMS[id]['url'] = url;
		ITEMS[id]['blocked'] = [];
		ITEMS[id]['allowed'] = [];
	}
}
function revokeTemp() {
	sessionStorage['blackList'] = JSON.stringify([]);
	sessionStorage['whiteList'] = JSON.stringify([]);
}
function statuschanger() {
	if (localStorage['enable'] == 'true') {
		localStorage['enable'] = 'false';
		chrome.browserAction.setIcon({path: "../img/IconDisabled.png"});
	} else {
		localStorage['enable'] = 'true';
		chrome.browserAction.setIcon({path: "../img/Forbidden.png"});
	}
}
chrome.tabs.onRemoved.addListener(function(tabid) {
	delete ITEMS[tabid];
});
chrome.tabs.onUpdated.addListener(function(tabid, changeinfo, tab) {
	taburl = tab.url.toLowerCase();
	if (localStorage['enable'] == 'true' && taburl.substr(0,4) == 'http') {
		if (changeinfo.status == 'loading') {
			icontype = "Allowed";
			if (enabled(taburl) == "true")
				icontype = "Forbidden";
			if (in_array(extractDomainFromURL(taburl), JSON.parse(sessionStorage["whiteList"])) || (extractDomainFromURL(taburl).substr(0,4) == 'www.' && in_array(extractDomainFromURL(taburl).substr(4), JSON.parse(sessionStorage["whiteList"]))) || in_array(extractDomainFromURL(taburl), JSON.parse(sessionStorage["blackList"])) || (extractDomainFromURL(taburl).substr(0,4) == 'www.' && in_array(extractDomainFromURL(taburl).substr(4), JSON.parse(sessionStorage["blackList"]))))
				icontype = "Temp";
			chrome.browserAction.setIcon({path: "../img/Icon"+icontype+".png", tabId: tabid});
		} else if (changeinfo.status == "complete") {
			if (typeof ITEMS[tabid] !== 'undefined') {
				if (localStorage['referrer'] == 'true') {
					chrome.tabs.executeScript(tabid, {code: 'blockreferrer()', allFrames: true});
				}
				chrome.tabs.executeScript(tabid, {code: 'loaded()', allFrames: true});
				changed = true;
				if (localStorage['mode'] == 'block' && typeof ITEMS[tabid]['allowed'] !== 'undefined') {
					for (i=0; i<ITEMS[tabid]['allowed'].length; i++) {
						if (in_array(extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['allowed'][i][0]).toLowerCase()), JSON.parse(sessionStorage["whiteList"])) || (extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['allowed'][i][0]).toLowerCase()).substr(0,4) == 'www.' && in_array(extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['allowed'][i][0]).toLowerCase()).substr(4), JSON.parse(sessionStorage["whiteList"]))))
							chrome.browserAction.setIcon({path: "../img/IconTemp.png", tabId: tabid});
					}
				} else if (localStorage['mode'] == 'allow' && typeof ITEMS[tabid]['blocked'] !== 'undefined') {
					for (i=0; i<ITEMS[tabid]['blocked'].length; i++) {
						if (in_array(extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['blocked'][i][0]).toLowerCase()), JSON.parse(sessionStorage["blackList"])) || (extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['blocked'][i][0]).toLowerCase()).substr(0,4) == 'www.' && in_array(extractDomainFromURL(relativeToAbsoluteUrl(ITEMS[tabid]['blocked'][i][0]).toLowerCase()).substr(4), JSON.parse(sessionStorage["blackList"]))))
							chrome.browserAction.setIcon({path: "../img/IconTemp.png", tabId: tabid});
					}
				}
			}
		}
	} else chrome.browserAction.setIcon({path: "../img/IconDisabled.png", tabId: tabid});
});
chrome.extension.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(msg) {
		if (port.name == 'popuplifeline') {
			if (msg.url && msg.tid) {
				popup=[msg.url, msg.tid];
			}
		}
	});
	port.onDisconnect.addListener(function(msg) {
		if (popup.length > 0) {
			if (localStorage['refresh'] == 'true') chrome.tabs.update(popup[1], {url: popup[0]});
			popup=[];
		}
	});
});
chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.reqtype == 'get-settings') {
		sendResponse({status: localStorage['enable'], enable: enabled(sender.tab.url), experimental: experimental, mode: localStorage['mode'], annoyancesmode: localStorage['annoyancesmode'], antisocial: localStorage['antisocial'], whitelist: localStorage['whiteList'], blacklist: localStorage['blackList'], whitelistSession: sessionStorage['whiteList'], blackListSession: sessionStorage['blackList'], script: localStorage['script'], noscript: localStorage['noscript'], object: localStorage['object'], applet: localStorage['applet'], embed: localStorage['embed'], iframe: localStorage['iframe'], frame: localStorage['frame'], audio: localStorage['audio'], video: localStorage['video'], image: localStorage['image'], annoyances: localStorage['annoyances'], preservesamedomain: localStorage['preservesamedomain'], webbugs: localStorage['webbugs'], referrer: localStorage['referrer'], linktarget: localStorage['linktarget']});
		if (typeof ITEMS[sender.tab.id] === 'undefined') {
			resetTabData(sender.tab.id, sender.tab.url);
		} else {
			if ((request.iframe != '1' && ((ITEMS[sender.tab.id]['url'].toLowerCase() != sender.tab.url.toLowerCase() && (sender.tab.url.indexOf("#") != -1 || ITEMS[sender.tab.id]['url'].indexOf("#") != -1) && removeHash(sender.tab.url.toLowerCase()) != removeHash(ITEMS[sender.tab.id]['url'].toLowerCase())) || (sender.tab.url.indexOf("#") == -1 && ITEMS[sender.tab.id]['url'].indexOf("#") == -1 && sender.tab.url.toLowerCase() != ITEMS[sender.tab.id]['url'].toLowerCase()) || changed) || sender.tab.url.toLowerCase().indexOf('https://chrome.google.com/webstore') != -1)) {
				resetTabData(sender.tab.id, sender.tab.url);
			}
		}
	} else if (request.reqtype == 'get-list') {
		enableval = domainCheck(request.url);
		if (trustCheck(extractDomainFromURL(request.url), 0)) enableval = 3;
		else if (trustCheck(extractDomainFromURL(request.url), 1)) enableval = 4;
		if (localStorage['mode'] == 'block') sessionlist = sessionStorage['whiteList'];
		else if (localStorage['mode'] == 'allow') sessionlist = sessionStorage['blackList'];
		sendResponse({status: localStorage['enable'], enable: enableval, mode: localStorage['mode'], annoyancesmode: localStorage['annoyancesmode'], antisocial: localStorage['antisocial'], annoyances: localStorage['annoyances'], closepage: localStorage['classicoptions'], rating: localStorage['rating'], temp: sessionlist, blockeditems: ITEMS[request.tid]['blocked'], alloweditems: ITEMS[request.tid]['allowed'], domainsort: localStorage['domainsort']});
		changed = true;
	} else if (request.reqtype == 'update-blocked') {
		if (request.src) {
			if (typeof ITEMS[sender.tab.id]['blocked'] === 'undefined') ITEMS[sender.tab.id]['blocked'] = [];
			if (!UrlInList(removeParams(request.src), ITEMS[sender.tab.id]['blocked'])) {
				ITEMS[sender.tab.id]['blocked'].push([removeParams(request.src), request.node]);
				updateCount(sender.tab.id);
			}
		}
	} else if (request.reqtype == 'update-allowed') {
		if (request.src) {
			if (typeof ITEMS[sender.tab.id]['allowed'] === 'undefined') ITEMS[sender.tab.id]['allowed'] = [];
			if (!UrlInList(removeParams(request.src), ITEMS[sender.tab.id]['allowed'])) {
				ITEMS[sender.tab.id]['allowed'].push([removeParams(request.src), request.node]);
			}
		}
	} else if (request.reqtype == 'save') {
		domainHandler(request.url, 2, 1);
		domainHandler(request.url, request.list);
		freshSync(2);
		changed = true;
	} else if (request.reqtype == 'temp') {
		if (typeof request.url == 'object') {
			for (i=0;i<request.url.length;i++) {
				if (request.url[i][0] != 'no.script' && request.url[i][0] != 'web.bug') {
					requesturl = request.url[i][0];
					if ((localStorage['annoyances'] == 'true' && (localStorage['annoyancesmode'] == 'strict' || (localStorage['annoyancesmode'] == 'relaxed' && domainCheck(requesturl, 1) != '0')) && baddies(requesturl, localStorage['annoyancesmode'], localStorage['antisocial']) == 1) || (localStorage['antisocial'] == 'true' && baddies(requesturl, localStorage['annoyancesmode'], localStorage['antisocial']) == '2')) {
						// do nothing
					} else {
						requesttype = request.url[i][1];
						if (requesttype == '3') {
							requesttype = 0;
							if (!requesturl.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) requesturl = '*.'+getDomain(requesturl);
						}
						if (request.mode == 'block') domainHandler(requesturl, 0, 1);
						else domainHandler(requesturl, 1, 1);
					}
				}
			}
		} else {
			requesturl = request.url;
			if ((localStorage['annoyances'] == 'true' && (localStorage['annoyancesmode'] == 'strict' || (localStorage['annoyancesmode'] == 'relaxed' && domainCheck(requesturl, 1) != '0')) && baddies(requesturl, localStorage['annoyancesmode'], localStorage['antisocial']) == 1) || (localStorage['antisocial'] == 'true' && baddies(requesturl, localStorage['annoyancesmode'], localStorage['antisocial']) == '2')) {
				// do nothing
			} else {
				requesttype = request.oldlist;
				if (requesttype == '3') {
					requesttype = 0;
					if (!requesturl.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) requesturl = '*.'+getDomain(requesturl);
				}
				if (request.mode == 'block') domainHandler(requesturl, 0, 1);
				else domainHandler(requesturl, 1, 1);
			}
		}
		changed = true;
	} else if (request.reqtype == 'remove-temp') {
		if (typeof request.url == 'object') {
			for (i=0;i<request.url.length;i++) {
				requesturl = request.url[i][0];
				requesttype = request.url[i][1];
				if (requesttype == '3') {
					requesttype = 0;
					if (!requesturl.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) requesturl = '*.'+getDomain(requesturl);
				}
				domainHandler(requesturl, 2, 1);
			}
		} else {
			requesturl = request.url;
			requesttype = request.oldlist;
			if (requesttype == '3') {
				requesttype = 0;
				if (!requesturl.match(/^((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){3}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})$/g)) requesturl = '*.'+getDomain(requesturl);
			}
			domainHandler(requesturl, 2, 1);
		}
		changed = true;
	} else if (request.reqtype == 'refresh-page-icon') {
		if (request.type == '0') chrome.browserAction.setIcon({path: "../img/IconAllowed.png", tabId: request.tid});
		else if (request.type == '1') chrome.browserAction.setIcon({path: "../img/IconForbidden.png", tabId: request.tid});
		else if (request.type == '2') chrome.browserAction.setIcon({path: "../img/IconTemp.png", tabId: request.tid});
	} else
		sendResponse({});
});
// Debug Synced Items
/*
chrome.storage.sync.get(null, function(changes) {
	for (key in changes) {
		alert(changes['whiteList'].length);
	}
});
*/
function freshSync(mode, force) {
	if (storageapi && localStorage['syncenable'] == 'true') {
		window.clearTimeout(synctimer);
		var settingssync = {};
		var simplesettings = '';
		if (force) {
		// mode == 0 = all; 1 = settings only; 2 = whitelist/blacklist
		//if (mode == 0 || mode == 1) {
			for (k in localStorage) {
				if (k != "version" && k != "sync" && k != "scriptsafe_settings" && k != "lastSync" && k != "whiteList" && k != "blackList" && k != "whiteListCount" && k != "blackListCount" && k.substr(0, 10) != "whiteList_" && k.substr(0, 10) != "blackList_" && k.substr(0, 2) != "zb" && k.substr(0, 2) != "zw") {
					simplesettings += k+"|"+localStorage[k]+"~";
				}
			}
			simplesettings = simplesettings.slice(0,-1);
			settingssync['scriptsafe_settings'] = simplesettings;
		//}
		//if (mode == 0 || mode == 2) {
			var jsonstr = JSON.parse(localStorage['whiteList']).toString();
			var jsonstrlen = jsonstr.length;
			var limit = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - Math.ceil(jsonstrlen/(chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 4)) - 4);
			var i = 0;
			while(jsonstr.length > 0) {
				var segment = jsonstr.substr(0, limit);
				settingssync["zw" + i] = segment;
				localStorage["zw" + i] = segment;
				jsonstr = jsonstr.substr(limit);
				i++;
			}
			localStorage['whiteListCount'] = i;
			settingssync['whiteListCount'] = i;
			jsonstr = JSON.parse(localStorage['blackList']).toString();
			jsonstrlen = jsonstr.length;
			limit = (chrome.storage.sync.QUOTA_BYTES_PER_ITEM - Math.ceil(jsonstrlen/(chrome.storage.sync.QUOTA_BYTES_PER_ITEM - 4)) - 4);
			i = 0;
			while(jsonstr.length > 0) {
				var segment = jsonstr.substr(0, limit);
				settingssync["zb" + i] = segment;
				localStorage["zb" + i] = segment;
				jsonstr = jsonstr.substr(limit);
				i++;
			}
			localStorage['blackListCount'] = i;
			settingssync['blackListCount'] = i;
		//}
			var milliseconds = (new Date).getTime();
			localStorage['lastSync'] = milliseconds;
			settingssync['lastSync'] = milliseconds;
			chrome.storage.sync.set(settingssync, function() {
				if (chrome.extension.lastError){
					alert(chrome.extension.lastError.message);
				} else {
					if (localStorage['syncnotify'] == 'true') webkitNotifications.createHTMLNotification(chrome.extension.getURL('html/syncnotification.html')).show();
				}
			});
		} else {
			synctimer = window.setTimeout(function() { syncQueue() }, 30000);
		}
		return true;
	} else {
		return false;
	}
}
function syncQueue() {
	freshSync(0, true);
}
function importSyncHandle(mode) {
	if (storageapi) {
		if (mode == '1' || (localStorage['sync'] == 'false' && mode == '0')) {
			chrome.storage.sync.get(null, function(changes) {
				if (typeof changes['lastSync'] !== 'undefined' && typeof changes['scriptsafe_settings'] !== 'undefined' && (typeof changes['zw0'] !== 'undefined' || typeof changes['zb0'] !== 'undefined')) {
					if (changes['zw0'] != '' && changes['zw0'] != 'translate.googleapis.com,talkgadget.google.com,mail.google.com,youtube.com,s.ytimg.com,maps.gstatic.com') { // ensure synced whitelist is not empty and not the default
						if (confirm("ScriptSafe has detected that you have settings synced on your Google account!\r\nClick on 'OK' if you want to import the settings from your Google Account.")) {
							localStorage['syncenable'] = 'true';
							localStorage['sync'] = 'true';
							importSync(changes, 2);
							if (localStorage['syncfromnotify'] == 'true') webkitNotifications.createHTMLNotification(chrome.extension.getURL('html/syncfromnotification.html')).show();
							return true;
						} else {
							localStorage['syncenable'] = 'false';
							alert('Syncing has been disabled to prevent overwriting your already synced data.\r\nFeel free to go to the Options page at any time to sync your settings (make a backup of your settings if necessary).');
							localStorage['sync'] = 'true'; // set to true so user isn't prompted with this message every time they start Chrome; localStorage['sync'] == true does not mean syncing is enabled, it's more like an acknowledgement flag
							return false;
						}
					}
				} else {
					if (confirm("It appears you haven't synced your settings to your Google account yet.\r\nScriptSafe is about to sync your current settings to your Google account.\r\nClick on 'OK' if you want to continue.\r\nIf not, click 'Cancel', and on the other device with your preferred settings, update ScriptSafe and click on OK when you are presented with this message.")) {
						localStorage['syncenable'] = 'true';
						localStorage['sync'] = 'true';
						freshSync(0, true);
						return true;
					} else {
						localStorage['syncenable'] = 'false';
						alert('Syncing is disabled.\r\nFeel free to go to the Options page at any time to sync your settings (make a backup of your settings if necessary).');
						localStorage['sync'] = 'true'; // set to true so user isn't prompted with this message every time they start Chrome; localStorage['sync'] == true does not mean syncing is enabled, it's more like an acknowledgement flag
						return false;
					}
				}
			});
		}
	} else {
		alert('Your current version of Google Chrome does not support settings syncing. Please try updating your Chrome version and try again.');
		return false;
	}
}
function importSync(changes, mode) {
	for (key in changes) {
		if (key != 'scriptsafe_settings') {
			if (mode == '1') localStorage[key] = changes[key].newValue;
			else if (mode == '2') localStorage[key] = changes[key];
		} else if (key == 'scriptsafe_settings') {
			if (mode == '1') var settings = changes[key].newValue.split("~");
			else if (mode == '2') var settings = changes[key].split("~");
			if (settings.length > 0) {
				$.each(settings, function(i, v) {
					if ($.trim(v) != "") {
						settingentry = $.trim(v).split("|");
						if ($.trim(settingentry[1]) != '') {
							localStorage[$.trim(settingentry[0])] = $.trim(settingentry[1]);
						}
					}
				});
			}
		}
	}
	listsSync(mode);
}
function listsSync(mode) {
	if (mode == '1' || mode == '2') {
		var concatlist;
		concatlist = '';
		for (i = 0; i < localStorage['whiteListCount']; i++) {
			concatlist += localStorage['zw'+i];
		}
		concatlistarr = concatlist.split(",");
		if (concatlist == '' || concatlistarr.length == 0) localStorage['whiteList'] = JSON.stringify([]);
		else localStorage['whiteList'] = JSON.stringify(concatlistarr);
		concatlist = '';
		for (i = 0; i < localStorage['blackListCount']; i++) {
			concatlist += localStorage['zb'+i];
		}
		concatlistarr = concatlist.split(",");
		if (concatlist == '' || concatlistarr.length == 0) localStorage['blackList'] = JSON.stringify([]);
		else localStorage['blackList'] = JSON.stringify(concatlistarr);
	} else if (mode == '3') {
		if (localStorage["whiteList_0"] || localStorage["blackList_0"]) {
			if(confirm('My sincere apologies if your whitelist/blacklist appeared to be wiped out!\r\nA backup of your whitelist/blacklist was found.\r\nPlease press OK to restore your lists.\r\nIf you aren\'t ready, you can click on Cancel and start this process from the Options page by clicking on the "Try to Restore Whitelist/Blacklist" button.')) {
				var concatlist;
				concatlist = '';
				for (i = 0; i < 5; i++) {
					if (localStorage['whiteList_'+i]) {
						concatlist += localStorage['whiteList_'+i];
						delete localStorage['whiteList_'+i];
					}
				}
				if (typeof(localStorage["whiteList_0"]) == 'string') {
					concatlistarr = concatlist.split(",");
					if (concatlist == '' || concatlistarr.length == 0) localStorage['whiteList'] = JSON.stringify([]);
					else localStorage['whiteList'] = JSON.stringify(concatlistarr);
				} else {
					localStorage['whiteList'] = concatlist;
				}
				concatlist = '';
				for (i = 0; i < 5; i++) {
					if (localStorage['blackList_'+i]) {
						concatlist += localStorage['blackList_'+i];
						delete localStorage['blackList_'+i];
					}
				}
				if (typeof(localStorage["blackList_0"]) == 'string') {
					concatlistarr = concatlist.split(",");
					if (concatlist == '' || concatlistarr.length == 0) localStorage['blackList'] = JSON.stringify([]);
					else localStorage['blackList'] = JSON.stringify(concatlistarr);
				} else {
					localStorage['blackList'] = concatlist;
				}
				alert('Successfully restored your settings!\r\nThe Options page will now open where you can review your whitelist/blacklist and choose to sync them to your Google Account (and/or sync from your Google Account)');
				chrome.tabs.create({url: chrome.extension.getURL('html/options.html')});
				return true;
			}
		} else {
			return false;
		}
	}
}

//////////////////////////////////////////////////////
if (!optionExists("version") || localStorage["version"] != version) {
	if (optionExists("search")) delete localStorage['search']; // delete obsolete value
	// Attempt to restore whitelist/blacklist if detected.
	listsSync(3);
	localStorage["version"] = version;
	if (localStorage["updatenotify"] == "true") {
		// v1.0.6.18 is a minor update, so temporarily disable the updated notification for it
		//chrome.tabs.create({ url: chrome.extension.getURL('html/updated.html'), selected: true });
	}
}
function tabClean() {
	setInterval(function () {
		for (var key in ITEMS) {
			chrome.tabs.get(parseInt(key), function (tab) {
				if (!tab) deleteTabData;
			});
		}
	}, 600000); // 10 minutes
}
function init() {
	setDefaultOptions();
	tabClean();
}
if (storageapi) {
	chrome.storage.onChanged.addListener(function(changes, namespace) {
		if (namespace == 'sync' && localStorage['syncenable'] == 'true') {
			if (typeof changes['lastSync'] !== 'undefined') {
				if (changes['lastSync'].newValue != localStorage['lastSync']) {
					importSync(changes, 1);
					if (localStorage['syncfromnotify'] == 'true') webkitNotifications.createHTMLNotification(chrome.extension.getURL('html/syncfromnotification.html')).show();
				}
			}
		}
	});
	importSyncHandle(0);
}
init();