/*行云统计组件*/   
(function () {
	if (!window.XA) {
		XA = {
			/*自适应http,https*/
			_url: 'http://xa.xingcloud.com/v4/',
			/* action队列*/
			_actions: [],
			/*update队列*/
			_updates: [],
			/*运行中状态*/
			_sending: false,
			init: function (option) {
				if (!option.app) {
					throw new Error('App is required.');
				}
				XA._app = option.app;
				XA._uid = option.uid || "random";
			}
			,
			setUid: function (uid) {
				XA._uid = uid;
			}
			,
			action: function () {
				for (var i = 0, l = arguments.length; i < l; i++) {
					XA._actions.push(arguments[i]);
				}
				XA._asyncSend();
			}
			,
			update: function () {
				for (var i = 0, l = arguments.length; i < l; i++) {
					XA._updates.push(arguments[i]);
				}
				XA._asyncSend();
			}
			,
			/**
                异步执行,会自动合并相邻请求，节约带宽
            */
			_asyncSend: function () {
				setTimeout(function () {
					var rest = XA._url + XA._app + '/' + XA._uid + '?',
						item = null,
						strItem = '',
						index = 0,
						length = XA._updates.length + XA._actions.length;
					if (length == 0 || XA._sending) {
						return;
					}
					XA._sending = true;
					while (item = XA._updates.shift()) {
						strItem = 'update' + index+++'=' + encodeURIComponent(item) + '&';
						if (rest.length + strItem.length >= 1980) {
							XA._updates.unshift(item);
							break;
						}
						else {
							rest = rest + strItem;
						}
					}
					index = 0;
					while (item = XA._actions.shift()) {
						strItem = 'action' + index+++'=' + encodeURIComponent(item) + '&';
						if (rest.length + strItem.length >= 1980) {
							XA._actions.unshift(item);
							break;
						}
						else {
							rest = rest + strItem;
						}
					}
					(new Image()).src = rest + '_ts=' + new Date().getTime();
					if (XA._updates.length + XA._actions.length > 0) {
						XA._asyncSend();
					}
					XA._sending = false;
				}
						   , 0);
			}
		}
	}
}
)();


(function(){
	/*如果获取不到uid，退出行云统计*/
	if(!$.cookie('uid')){		
		if(localStorage["UID"]&& localStorage["UID"]!=="" ){
			$.cookie("uid",localStorage["UID"],{expires: 1000, path: '/'});				
		}else{
			$.cookie("uid",Date.parse(new Date())+"."+parseInt(Math.random()*1000),{expires: 1000, path: '/'});
		}		
		return;
	}
	if(!XA) return;
    var appid="video-download";
	$(document).ready(function(){
		XA.init({
			app: appid, uid: $.cookie('uid')}
		);		

		//进入收藏页面
    	XA.action('visit.referrer.collect');

	    $(document).on('click', function(e){
	        var me = $(e.target);
	        if(me.prop('tagName').toUpperCase() != 'A' && me.parents('a').length <=0 ){
	            return ;
	        }
	        var base = ['test', 'click'];
	        /*get monkey*/
	        var monkey = me.parents("[monkey]").attr('monkey') || 'other';
	        base.push(monkey.replace('.', '_'));
	        /*get click type*/
	        var link = me.prop('tagName').toUpperCase() == 'A' ? me : $(me.parents('a')[0]);
	        var tp = link.attr('ad-type') || 'normal';
	        base.push(tp.replace('.', '_'));
	        var value = link.attr('ad-val') || '0';
	        window.XA && XA.action(base.join('.') + ',' + value );      
	    });

	    //点击搜索按钮
	    $('#searchGroupBtn').on('click', function(){
	    	XA.action('test.click.searchForm.search');
	    })

	    //filter按钮
	    $('#idInputFilter').on('blur', function(){
	    	XA.action('test.click.inputFilter.filter');
	    })
	});
})();