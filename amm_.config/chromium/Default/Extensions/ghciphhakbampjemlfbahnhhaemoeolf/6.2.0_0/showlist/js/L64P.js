//	Global L64P object
var L64P = {
	vars: {},
	util: {
		_crctable: "00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D",
		_crc32: function(str, crc) {
			if (crc == window.undefined) crc = 0;
			var n = 0;
			var x = 0;
			crc = crc ^ (-1);
			for (var i = 0, iTop = str.length; i < iTop; i++) {
				n = (crc ^ str.charCodeAt(i)) & 0xFF;
				x = "0x" + L64P.util._crctable.substr(n * 9, 8);
				crc = (crc >>> 8) ^ x;
			}
			return crc ^ (-1);
		}
	},
	video: {
		saveItems: function(details) {
			L64P._db.set({
				id: 'video_items',
				data: JSON.stringify(details.id),
				type: 'sync'
			});
			return;
		},
		getWatchedItems: function(details, callback) {
			/// get te cache first
			var cacheItems = false;
			var sCacheItems = L64P._db._locStorage.getItem("video_cacheItems");
			if ((sCacheItems == null) || (typeof(sCacheItems) == 'undefined'))
				cacheItems = new Array();
			else
				cacheItems = JSON.parse(sCacheItems);
			console.log(cacheItems);
			L64P._db.get({
				id: 'video_items',
				type: 'sync'
			}, function(data) {
				var sitems = data;
				if ((sitems == null) || (typeof(sitems) == 'undefined'))
					items = new Array();
				else
					items = JSON.parse(sitems);
				var aValues = [];
				var objs = new Object();
				for (var i = 0; i < items.length; i++) {
					if (items[i] != null) {
						var crc = L64P.util._crc32(items[i]); // Don't show duplicates
						if (objs[crc])
							continue;
						objs[crc] = true;
						aValues.push("video_item_" + crc);
					}
				}
				L64P._db.getMulti({
					ids: aValues
				}, function(data) {
					console.log(data);
					var retval = [];
					if ((data !== false)) {
						//for(var propertyName in data) 
						//	retval.push(data[propertyName]); 
						for (var j in aValues) // Keep the same order like aValues ( not the database order)
						{
							var s = data[aValues[j]];
							if (s) {
								if (fFirefox)
									retval.push(JSON.parse(s));
								else
									retval.push(s); // Check+++
							}
						}
					}
					L64P._db._locStorage.setItem("video_cacheItems", JSON.stringify(retval));
					console.log(retval);
					if (typeof(callback) == "function")
						callback({
							items: retval
						});
				});
			});
		}
	},
	browser: {
		getMostVisited: function(details, callback) {
			return false;
		},
		getApps: function(details, callback) {
			return false;
		},
		showSettings: function(details) {
			return false;
		},
		navigateChromeURL: function(details) {
			window.location.replace(details.url);
			return false;
		}
	},
	events: {
		onTopLinkChanged: function(details) {},
		onTopNewSearchURL: function(details) {},
		onNewVideo: function(details) {},
	},
	settings: {
		set: function(details) {
			details.id = 'settings_' + details.id;

			if (typeof(details.data.sync) != 'undefined') {
				L64P._db.doSync = details.data.sync;
				L64P._db.set({
					type: 'loc',
					id: 'dbsync',
					data: details.data.sync
				});
				L64P._db.setSync();
			}

			if (typeof(details.data) == 'object')
				details.data = "L64O_" + JSON.stringify(details.data);
			return L64P._db.set(details);
		},
		get: function(details, callback) {
			var info = {
				call: callback
			};
			L64P._db.get({
				id: 'settings_' + details.id
			}, function(data) {
				if (typeof(data) == 'string') {
					if (data.indexOf("L64O_") == 0)
						data = JSON.parse(data.slice(5));
				}
				if (typeof(callback) == 'function')
					callback(data);
			});
		},
	},
	toplinks: {
		_retree: function(data, all) {
			if (data == null)
				return data;
			for (var i = 0; i < data.length; i++) {
				var toplinks = false;
				if (typeof(data[i].Toplinks) != 'undefined') {
					toplinks = L64P.toplinks._retree(data[i].Toplinks, all);
				}
				if (typeof(all["tls_id_" + data[i].huId]) != 'undefined') {
					var id = "tls_id_" + data[i].huId;
					var tl = JSON.parse(all[id]);
					data[i] = tl;
					//data[i].id = control.sId++	
					if (toplinks)
						data[i].Toplinks = toplinks;
					if (all.nextID < data[i].id)
						all.nextID = data[i].id;
				} else
					console.log("no Item!");
			}
			return data;
		},

		_untree: function(data, details) {
			var treeRoot = new Array();
			var arr = data;

			for (var i = 0; i < arr.length; i++) {
				var obj = arr[i];
				var objTree = new Object();
				var objNew = new Object();
				///// check functions
				if (obj.id > details.sId)
					details.sId = obj.id;
				obj.huId = details.shuId++;
				objTree.huId = obj.huId;
				/// linear list; 

				details.items.push(objNew);
				for (var propertyName in obj) {
					if (propertyName == 'Toplinks') {
						//alert("toplinks");
						objTree[propertyName] = L64P.toplinks._untree(obj[propertyName], details);
						//delete obj[propertyName];
					} else
						objNew[propertyName] = obj[propertyName];
				}
				treeRoot.push(objTree);
			}

			return treeRoot;
		},
		getLocal: function(details, callback) {
			//alert("Pause");
			L64P._db.get({
				id: 'tls_count'
			}, function(data) {
				if (typeof(data) == 'undefined') {
					if (typeof(callback) == 'function') {
						//alert("false");
						callback({
							toplinks: false,
							nextid: 1
						});
					}
					return;
				}

				var geti = new Array("tls_tree", "tls_count", "tls_next");
				for (var x = 0; x < data; x++)
					geti.push("tls_id_" + x);
				L64P._db.getMulti({
					ids: geti
				}, function(data) {

					if ((data !== false) && (data !== null)) {
						data.nextID = 0;
						var tree = JSON.parse(data["tls_tree"]);
						var tlj = L64P.toplinks._retree(tree, data);
						if (typeof(callback) == 'function')
							callback({
								toplinks: tlj,
								nextid: data.nextID * 1 + 1
							});
					} else if (typeof(callback) == 'function')
						callback({
							toplinks: false,
							nextid: 1
						});
				});
			});

		},
		setLocal: function(details) {
			if (!details.type)
				details.type = 'user';
			if (!details.data)
				return false;
			if (typeof(details.data) !== 'object')
				return false;
			var tlj = JSON.stringify(details.data);

			details.sId = 1;
			details.shuId = 0;
			details.items = new Array();
			//details.tree = new Array(); 
			details.tree = L64P.toplinks._untree(details.data, details);

			//L64P._db.set({id:'tls_json', data:tlj, type:'user' }); 

			var set = {
				data: {
					"tls_tree": JSON.stringify(details.tree),
					"tls_count": details.items.length,
					"tls_next": details.sId * 1 + 1
				}
			};
			//alert(details.items.length);
			for (x = 0; x < details.items.length; x++) {
				set.data["tls_id_" + details.items[x].huId] = JSON.stringify(details.items[x]);
			}

			L64P._db.setMulti(set);

			if (details.type == 'user') /// increment userwatch
			{
				L64P._db.get({
					id: 'tls_watchuser'
				}, function(data) {
					var cn = data * 1 + 1;
					L64P._db.set({
						id: 'tls_watchuser',
						data: cn
					});
					L64P._db._curUserWatch = cn;
				});
			}
		}
	},
	_db: {
		_curUserWatch: 0,
		_bindList: new Array(),
		_locStorage: false,
		setSync: function() {},
		setStorage: function() {
			L64P._db._locStorage = localStorage;
		},
		addListener: function(details) {
			L64P._db._bindList.push({
				key: details.key,
				callback: details.callback
			});
		},
		bindStorageChanges: function() {
			window.addEventListener("storage", L64P._db._onLocalStorageStorageChange, true);
		},
		setMulti: function(details) {
			//for details.data
			var obj = details.data;
			if (typeof(obj) != 'object')
				return false;

			for (var propertyName in obj) {
				L64P._db._locStorage.setItem(propertyName, obj[propertyName]);
			}
		},
		getMulti: function(details, callback) {
			var ids = details.ids;
			var data = {};
			for (var i = 0; i < ids.length; i++) {
				data[ids[i]] = L64P._db._locStorage.getItem(ids[i]);
			}
			setTimeout(function() {
				callback(data)
			}, 0);

		},
		_onLocalStorageStorageChange: function(event) {

		},
		onStorageChanged: function(details) {

		},
		set: function(details) {
			//return content.localStorage.wrappedJSObject.setItem(details.id, details.data);
			try {
				return L64P._db._locStorage.setItem(details.id, details.data);
			} catch (err) {}
			return null;

		},
		get: function(details, callback) {
			var data = L64P._db._locStorage.getItem(details.id);
			if (typeof(callback) == 'function')
				setTimeout(function() {
					callback(data)
				}, 0);
			//callback(data);
		},
		initWatch: function() {
			L64P._db.setStorage();
			L64P._db.bindStorageChanges();
			L64P._db.get({
				id: 'tls_watchuser'
			}, function(data) {
				cn = data;
				if (cn == null) {
					cn = 1;
					L64P._db.set({
						id: 'tls_watchuser',
						data: cn
					});
				}
				L64P._db._curUserWatch = cn;
				setTimeout(function() {
					L64P._db.checkWatch();
				}, 2000);
			});

		},
		checkWatch: function() {
			setTimeout(function() {
				L64P._db.checkWatch();
			}, 2000);
			L64P._db.get({
				id: 'tls_watchuser'
			}, function(data) {
				var cn = data;
				if (L64P._db._curUserWatch == cn)
					return;
				L64P._db._curUserWatch = cn;
				L64P.events.onTopLinkChanged({
					type: 'user'
				});
			});
		}
	}
};

//	chrome extension com code
if (typeof(chrome) == 'object') {


	if (typeof(chrome.storage) == 'object') {

		L64P._db.doSync = true;
		L64P._db.storage = chrome.storage.sync;
		L64P._db.backup = chrome.storage.local;
		L64P._db.sync = chrome.storage.sync;


		L64P._db.bindStorageChanges = function() {
			chrome.storage.onChanged.addListener(function(changes, areaName) {
				for (var i = 0; i < L64P._db._bindList.length; i++) {
					if (typeof(changes[L64P._db._bindList[i].key]) != 'undefined') {
						var call = L64P._db._bindList[i].callback;
						var parm = {
							key: L64P._db._bindList[i].key,
							val: changes[L64P._db._bindList[i].key].newValue
						};
						setTimeout(function() {
							call(parm)
						}, 0);
					}
				}
			});
		}

		L64P._db.setSync = function() {
			L64P._db.get({
				type: 'loc',
				id: 'dbsync'
			}, function(data) {
				var sync = (typeof(data) != 'undefined') ? data : true;
				if (sync) {
					L64P._db.doSync = true;
					L64P._db.storage = chrome.storage.sync;
				} else {
					L64P._db.doSync = false;
					L64P._db.storage = chrome.storage.local;
				}

			});
		}

		L64P._db.set = function(details) {
			var data = new Object();
			data[details.id] = details.data;

			var storage = L64P._db.storage;
			if (details.type == "loc")
				storage = L64P._db.backup;
			else if (details.type == "sync")
				storage = L64P._db.sync;

			L64P._db.storage.set(data, function() {});
			if (L64P._db.doSync)
				L64P._db.backup.set(data, function() {});

			L64P._db.storage.getBytesInUse(null, function(data) {
				console.log("Bytes used:" + data);
			});
		};
		L64P._db.get = function(details, callback) {
			var storage = L64P._db.storage;
			if (details.type == "loc")
				storage = L64P._db.backup;
			else if (details.type == "sync")
				storage = L64P._db.sync;

			storage.get(details.id, function(data) {
				callback(data[details.id]);
			});

		};
		L64P._db.setMulti = function(details) {
			L64P._db.storage.set(details.data, function() {});
			if (L64P._db.sync)
				L64P._db.backup.set(details.data, function() {});
		};
		L64P._db.getMulti = function(details, callback) {
			L64P._db.storage.get(details.ids, function(data) {
				callback(data);
			});
		};

		L64P._db.setSync();


	}
	if (typeof(chrome.extension) == 'object') {
		L64P.browser = {
			init: function() {

			},
			onMessage: function(details, sender) {
				if (details.msg == "OnNewTL")
					L64P.events.onTopLinkChanged({
						type: 'system'
					});
				if (details.msg == "__L64_ON_NEW_VIDEO") {
					L64P.events.onNewVideo({
						info: details.videoInfo
					});
				} else if (details.msg == "__L64_ON_NEW_TOPLINK") {
					//alert("angekommen:"+details.url);
					fr.addNewToplinksFromList();
					//L64P.events.onNewVideo({info:details.videoInfo });
				}

			},
			showSettings: function(details) {
				details.type = "__L64_SHOW_CHROME_SETTINGS";
				chrome.extension.sendMessage(details, function(response) {
					console.log(response);
				});
			},
			navigateChromeURL: function(details) {
				if (!fFirefox) {
					details.type = "__L64_NAVIGATE_CHROME_URL";
					chrome.extension.sendMessage(details, function(response) {
						console.log(response);
					});
				}
			}
		}
		// subscribe to the chrome messages	
		chrome.extension.onMessage.addListener(L64P.browser.onMessage);
	}
}

L64P._db.initWatch();