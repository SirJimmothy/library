// noinspection JSUnusedGlobalSymbols,UnreachableCodeJS,DuplicatedCode

let $$ = {

	/**
	 * Add an onload routine, either with supplied code,
	 * or simply supply a function by reference
	 *
	 * @param {function|string} item   Function to add to the onload routine
	 * @param {object|null}     object Object to apply this onload routine to. Defaults to `window` object
	 *
	 * @return {void}
	 */
	onload: (item,object = null) => {
		object = (object || window);
		let load = object.onload;
		if (typeof load != 'function') {
			// If onload is undefined, simply load the supplied data into onload
			object.onload = item;
		} else {
			// If onload is not empty, add the supplied data to the existing onload
			object.onload = () => {
				if (load) { load(null); }
				item(null);
			};
		}
	},

	/**
	 * Load JavaScript files into the document header
	 *
	 * @param {array}  files  Array of files to load
	 * @param {string} prefix Prefix to apply to each file
	 *
	 * @return {void}
	 */
	load_js: (files,prefix = '') => {
		for (let x = 0; x < files.length; x++) {
			document.head.appendChild(Object.assign(
				document.createElement('script'), {
					src: prefix + files[x],
				}
			));
		}
	},

	/**
	 Get HTML element(s) using CSS selectors

	 @param {string}  item
	 @param {boolean} all
	 *
	 @return {object|array} Single HTML element or array of results
	 */
	get_elem: (item,all = false) => {
		return document[!all ? 'querySelector' : 'querySelectorAll'](item);
	},

	/**
	 * Travel up the DOM tree from the supplied element,
	 * until we reach an element that matches the specified HTML tag
	 *
	 * @param {object} elem      Element to start at
	 * @param {string} item_type Element nodeName to stop at
	 *
	 * @return {object} First found element, or empty object if none found
	 */
	find: (elem,item_type = 'TR') => {
		while (!['HTML',item_type].includes(elem.nodeName)) {
			elem = elem.parentNode;
		}
		return (elem && elem.nodeName === item_type ? elem : {});
	},

	/**
	 * Control event behaviours
	 */
	event: {
		/**
		 * Add event listener to specified object, or body if no object is specified
		 *
		 * @param {string} event Event to listen for
		 * @param {object} func  Function to call
		 * @param {object} elem  Element to remove this listener from. Defaults to body
		 *
		 * @return {void}
		 */
		add: (event,func,elem = null) => {
			elem = (elem || document);
			if (elem.addEventListener) { elem.addEventListener(event,func); }
		},

		/**
		 * Remove event listener from specified object, or body if no object is specified
		 *
		 * @param {string} event Event to listen for
		 * @param {object} func  Function to call
		 * @param {object} elem  Element to apply this listener to. Defaults to body
		 *
		 * @return {void}
		 */
		remove: (event,func,elem = null) => {
			elem = (elem || document);
			if (elem.addEventListener) { elem.removeEventListener(event,func); }
		},
	},

	/**
	 * Prompt for confirmation before executing the specified action
	 *
	 * @param {object|string} call   Function to call, or URL to redirect to
	 * @param {string}        prompt Text to display on the confirmation prompt
	 *
	 * @return {void}
	 */
	confirm: (call,prompt = 'Are you sure?') => {

		if (confirm(prompt)) {
			if (typeof call === 'function') {
				call();
			} else {
				window.location.href = call;
			}
		}

	},

	/**
	 * Perform notification actions
	 *
	 * @param {string} act  Action to perform
	 * @param {string} body Optional notification body text
	 * @param {string} icon Optional path to notification icon
	 *
	 * @return {void|boolean|object} Permission state when requested, or delivered notification object
	 */
	notify: (act,body = '',icon = '') => {
		if (!window.Notification) { return false; }

		switch (act) {
			case 'request':
				Notification.requestPermission().then();
			break;
			case 'get':
				return (Notification.permission === 'granted');
			break;
			default:
				return new Notification(act,{body: body,icon: icon});
			break;
		}
	},

	/**
	 * Toggle fullscreen
	 *
	 * @return {void}
	 */
	fullscreen: () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().then();
		} else if (document.exitFullscreen) {
			document.exitFullscreen().then();
		}
	},

	/**
	 * Generate a date/time string based on the specified format and timestamp
	 *
	 * @param {string}  format Predefined format to use
	 * @param {int}     time   Epoch timestamp to use
	 * @param {boolean} now    Whether to calculate `time` from now, rather than epoch 0
	 *
	 * @return {string} Generated date/time string
	 */
	date: (format = '',time = 0,now = true) => {
		let days		= ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
		let th			= ['th','st','nd','rd','th','th','th','th','th','th'];
		let months	= ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

		let d				= new Date();
		d.setTime((now ? d.getTime() : 0) + (time * 1000));

		let v				= {
			day:				d.getDate().toString(),
			weekday:		d.getUTCDay(),
			month:			d.getMonth(),
			year:				d.getFullYear(),
			hour:				d.getHours(),
			mins:				d.getMinutes(),
			secs:				d.getSeconds(),
			month_real:	'',
			day_real:		'',
			suffix:			'',
		};
		v.month_real	= v.month + 1;
		v.day_real		= v.day;
		v.suffix			= th[v.day.substring(v.day.length - 1)]; // Get suffix based on last digit

		// Reformat variables that don't need to reference arrays, and can show their real values
		let change = ['hour','mins','secs','month_real','day_real'];
		for (let x = 0; x < change.length; x++) {
			let field = change[x];
			if (v[field] < 10) { v[field] = '0' + v[field]; }
		}

		let formats = {
			default:			[v.year,v.month_real,v.day_real].join('-') + ' ' + [v.hour,v.mins,v.secs].join(':'),
			iso_date:			[v.year,v.month_real,v.day].join('-'),
			iso_time:			[v.hour,v.mins,v.secs].join(':'),

			uk_date:			[v.day,v.month_real,v.year].join('/'),

			human_date:		[days[v.weekday],v.day + v.suffix,months[v.month],v.year].join(' '),
			cookie_date:	[v.day_real,months[v.month],v.year].join(' '),
		};

		formats.human_full	= formats.human_date + ' ' + [v.hour,v.mins,v.secs].join(':');
		formats.cookie_full	= [formats.cookie_date,formats.iso_time,' UTC'].join(' ');

		return (formats[format] || formats.default);
	},


	/**
	 * Send a GET request to the specified URL
	 *
	 * @param {string} url URL to request
	 *
	 * @return {promise} Promise containing returned URL contents
	 */
	url_get: (url) => {
		return new Promise((resolve) => {
			let xhr = (window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0"));
			xhr.open('GET',url,true);
			xhr.onreadystatechange = function() { if (xhr.readyState === 4 && xhr.status === 200) {
				resolve(xhr.responseText);
			} };
			xhr.send();
		});
	},

	/**
	 * Send a POST request to the specified URL
	 *
	 * @param {string} url  URL to POST to
	 * @param {string} data Data to send, either raw data or associative array
	 *
	 * @return {promise} Promise containing returned URL contents
	 */
	url_post: (url,data) => {
		return new Promise((resolve) => {
			let xhr = (window.XMLHttpRequest ? new window.XMLHttpRequest() : new ActiveXObject("MSXML2.XMLHTTP.3.0"));
			xhr.open('POST',url,true);
			xhr.setRequestHeader("Content-Type","application/x-www-form-urlencoded; charset=UTF-8");
			xhr.onreadystatechange = function() { if (xhr.readyState === 4 && xhr.status === 200) {
				resolve(xhr.responseText);
			} };
			xhr.send(data);
		});
	},

	/**
	 * Get or set cookies
	 */
	cookie: {
		/**
		 * Set a cookie's value
		 *
		 * @param {string}  name   Name of the cookie to set
		 * @param {string}  value  Value to assign to the cookie
		 * @param {int}     expiry Cookie expiry in seconds
		 * @param {string}  path   Cookie path. Defaults to `/`
		 * @param {boolean} secure Whether to set HTTPS-only cookie
		 *
		 * @returns {void}
		 */
		set: (name,value,expiry = 3600,path = '/',secure = false) => {
			let cookie = [
				name + '=' + value,
				'expires=' + $$.date('cookie_full',expiry),
				'path=' + path,
				'SameSite=None',
			];
			if (secure) { cookie.push('Secure'); }
			document.cookie = cookie.join('; ');
		},

		/**
		 * Get a cookie's value
		 *
		 * @param {string} name Name of the cookie to retrieve
		 *
		 * @returns {string} Cookie value. Defaults to empty string if not available
		 */
		get: (name) => {
			let result	= '';
			let data		= document.cookie.split('; ');
			for (let x = 0; x < data.length; x++) {
				let cookie = data[x].split('=');
				if (cookie[0] === name) {
					result = cookie[1];
					break;
				}
			}
			return result;
		},
	},

	/**
	 * Get, set, or delete LocalStorage variables
	 */
	storage: {
		/**
		 * Set LocalStorage variable
		 *
		 * @param {string} name  Name of the LocalStorage variable to set
		 * @param {string} value Value to assign to this variable
		 *
		 * @returns {void}
		 */
		set: (name,value) => {
			localStorage.setItem(name,value);
		},

		/**
		 * Get LocalStorage variable
		 *
		 * @param {string} name Name of the LocalStorage to retrieve the contents for
		 *
		 * @returns {string} Variable contents, or empty string if not available
		 */
		get: (name) => {
			return (localStorage.getItem(name) || '');
		},

		/**
		 * Delete LocalStorage variable
		 *
		 * @param {string} name Name of the LocalStorage variable to delete
		 */
		del: (name) => {
			localStorage.removeItem(name);
		},
	},

	/**
	 * Send a message to the console in the specified manner and style
	 *
	 * @param {string} message Message to send. Use `%c` to indicate style insertion point
	 * @param {string} style   Predefined style to use
	 * @param {string} type    Type of message: `[err|con]`
	 *
	 * @return {void}
	 */
	log: (message,style = '',type = '') => {

		let styles = {
			green:		'font-weight: bold; color: #006600;',
			red:			'font-weight: bold; color: #FF0000;',
			default:	'',
		};
		style = (styles[style] || styles.default);

		let method = (type === 'err' ? 'error' : 'log');
		console[method](message,style);

	},

	/**
	 * Spawn a popup window
	 *
	 * @param {string} url  URL to launch this popup window into
	 * @param {string} type Predefined window type to spawn
	 * @param {string} name Name to give to the spawned popup. Defaults to `type`
	 *
	 * @returns {void}
	 */
	popup: (url, type = 'default',name = '') => {
		let types		= {
			default:	{'width':850,'height':500,'args':'scrollbars=yes'},
			small:		{'width':500,'height':350,'args':'scrollbars=yes'},
			link:			{'width':400,'height':100,'args':''},
		};
		let vars		= (types[type] || types.default);

		let offset	= 50; // Spawn position (px from top left)
		let args		= [
			'top='		+ (screen.top + offset),
			'left='		+ (screen.left + offset),
			'width='	+ vars.width,
			'height='	+ vars.height,
		];
		if (vars.args) { args.push(vars.args); }

		let popup = window.open(url,(name || type),args.join(','));
		if (popup) { popup.focus(); }
	},

	/**
	 * Spawn an inline modal iframe
	 *
	 * @param {string} url     URL of the page to embed
	 * @param {string} heading Heading to display at top of embed
	 * @param {string} type    Predefined modal type to spawn
	 * @param {string} focus   QuerySelector string of embedded element to focus upon load
	 *
	 */
	modal: (url,heading = '',type = 'default',focus = '') => {
		let types		= {
			default:	{w:850,		h:500},
			full:			{w:true,	h:true},
			small:		{w:500,		h:100},
		};
		let vars		= (types[type] || types.default);

		let div_modal		= Object.assign(document.createElement('DIV'),{classList:['root_modal']});
		let div_bg			= document.createElement('DIV');
		let div_inner		= document.createElement('DIV');
		let div_heading	= Object.assign(document.createElement('DIV'),{innerHTML:heading});

		let div_content	= document.createElement('DIV');
		let iframe			= Object.assign(document.createElement('IFRAME'),{src:url});

		let width				= (typeof vars.w == 'number' ? vars.w : 0);
		let height			= (typeof vars.h == 'number' ? vars.h : 0);
		let pad					= 50; // Spacing between modal and viewport edge

		div_content.appendChild(iframe);
		div_inner.appendChild(div_heading);
		div_inner.appendChild(div_content);
		div_modal.appendChild(div_bg);
		div_modal.appendChild(div_inner);
		document.body.appendChild(div_modal);

		$$.event.add('click',(e) => {
			if (e.button === 0) {
				document.body.removeChild(div_modal);
				clearInterval(global.modal_timer);
			}
		},div_bg);

		if (focus) {
			$$.event.add('load',() => {
				let iframe_body = (iframe.contentDocument || iframe.contentWindow.document);
				iframe_body.querySelector(focus).focus();
			},iframe);
		}

		set_size();

		// Auto adjust if the size is based on viewport size
		if (div_modal && (!width || !height)) {
			global.modal_timer = setInterval(() => { set_size(); },250);
		}

		function set_size() {
			div_inner.style.width		= (width || window.innerWidth - (pad * 2)) + 'px';
			div_inner.style.height	= (height || window.innerHeight - (pad * 2)) + 'px';
		}
	},

	/**
	 * Add CSS declaration(s) to the provided element
	 *
	 * @param {object}       elem Element to add the CSS style to
	 * @param {string|array} rule Full-formatted and enclosed CSS rule, or array thereof, to add
	 */
	style: (elem,rule) => {
		if (typeof rule === 'string') {
			elem.sheet.insertRule(rule);
		} else {
			for (let x = 0; x < rule.length; x++) {
				$$.style(elem,rule[x]);
			}
		}
	},

};

/** Insert default CSS upon which certain functions depend */
$$.onload(() => {
	let css_rules = [
		`div.root_modal {
			z-index:					1000;
			position:					fixed;
			top:							0;
			left:							0;
			width:						100vw;
			height:						100vh;
			pointer-events:		none; 
		}`,

		`div.root_modal > div {
			pointer-events:		all;
		}`,

		`div.root_modal > div:nth-of-type(1) {
			position:					absolute;
			top:							0;
			left:							0;
			width:						100%;
			height:						100%;
			background-color:	#333333;
			opacity:					0.5;
			filter:						opacity(50%);
			cursor:						pointer;
		}`,

		`div.root_modal > div:nth-of-type(2) {
			display:					flex;
			flex-flow:				column;
			position:					absolute;
			top:							50%;
			left:							50%;
			width:						500px;
			height:						200px;
			border:						1px solid #666666;
			background-color:	#FFFFFF;
			transform:				translate(-50%,-50%);
			transition:				all 0.25s;
		}`,

		`div.root_modal > div:nth-of-type(2) > div {
			position:					relative;
			padding:					5px;
		}`,

		`div.root_modal > div:nth-of-type(2) > div:nth-of-type(1) {
			flex:							0 1 auto;
			text-align:				center;
			font-weight:			bold;
			color:						#FFFFFF;
			background-color:	#999999;
		}`,

		`div.root_modal > div:nth-of-type(2) > div:nth-of-type(2) {
			flex:							1 1 auto;
			overflow:					auto;
		}`,

		`div.root_modal > div:nth-of-type(2) > div:nth-of-type(2) > iframe {
			position:					absolute;
			top:							0;
			left:							0;
			width:						100%;
			height:						100%;
			border:						none;
		}`,
	];

	let root_css = Object.assign(document.createElement('style'),{id:'root_css'});
	document.head.appendChild(root_css);
	$$.style(root_css,css_rules);

});
