(function() {
/* begin scragz' GM utility functions */
var log = function(msg) { console.log(msg); }
var _gt = function(e) { return document.getElementsByTagName(e); };
var _gi = function(e) { return document.getElementById(e); };
var _ce = function(e) { return document.createElement(e); };
var _ct = function(e) { return document.createTextNode(e); };
var _gc = function(clsName)
{
    var elems = document.getElementsByTagName('*');
    var j = 0;
    var arr = new Array();
    for (var i=0; (elem = elems[i]); i++) {
        if (elem.className == clsName) {
            arr[j] = elem;
            j++;
        }
    }
    return (arr.length > 0) ? arr : false;
};
var xpath = function(query, startingPoint)
{
    if (startingPoint == null) {
        startingPoint = document;
    }
    var retVal = document.evaluate(query, startingPoint, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
    return retVal;
};
var xpathFirst = function(query, startingPoint)
{
    var res = xpath(query, startingPoint);

    if (res.snapshotLength == 0) return false;
    else return res.snapshotItem(0);
};
var swapNode = function(node, swap)
{
    var nextSibling = node.nextSibling;
    var parentNode = node.parentNode;
    swap.parentNode.replaceChild(node, swap);
    parentNode.insertBefore(swap, nextSibling);
};
var addGlobalStyle = function(css)
{
    var head, style;
    head = _gt('head')[0];
    if (!head) { return; }
    style = _ce('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
};
/* end scragz' GM utility functions */

function retryUntilTagExists(tag, success)
{
    var tries = 0;
	if (arguments.size > 2) var ensure = arguments[2];
	else var ensure = function(){};
    function _retryUntilTagExists(){
        var element = _gt(tag)[0];
        if (element) {
            success(element);
			ensure();
        } else {
            tries++;
            if (tries < 25) {
				window.setTimeout(_retryUntilTagExists, 100);
			} else {
			 	ensure();
			}
        }
    }
    _retryUntilTagExists();
}
function hidePage()
{
    retryUntilTagExists('html', function(html){
        html.style.display = 'none';
    });
}

function showPage()
{
    retryUntilTagExists('html', function(html){
        html.style.display = 'block';
    });
}
function countdown(delay, strict)
{
	if (confirm('Do you really want to wait to look at this site?')) {
		focused = true;
	} else {
		chrome.extension.sendRequest({method: 'closeSelectedTab'}, function(){});
		return;
	}
	var ms = Math.abs(parseInt(delay*1000));
	function _countdown() {
		//log(focused ? 'focused' : 'not focused');
		if (focused || !strict) {
			ms -= 1000;
			if (ms <= 0) {
				// you did it!
				showPage();
				return;
			}
		}
		window.setTimeout(_countdown, 1000);
	}
	_countdown();
    retryUntilTagExists('title', function(title){
		//log('found title tag');
        var text = title.innerText;
        function _countdownTitle() {
			//log('_countdownTitle');
			try {
	            if (ms > 0) {
	                title.innerText = Math.ceil(ms/1000)+" "+text;
					window.setTimeout(_countdownTitle, 1000);
	            } else {
	                title.innerText = text;
	            }
			} catch(e){/*andwedontcare*/}
        }
        _countdownTitle();
    });
}

var focused = false;
function addListeners() {
	window.addEventListener('focus', function() {
	  focused = true;
	});
	window.addEventListener('blur', function() {
	  focused = false;
	});
}

function go(options) {
    if (options && options.sites && options.delay) {
        var re = new RegExp('https?://('+options.sites.split("\n").join('|')+')/.*');
        var ref = new RegExp('https?://'+window.location.hostname+'/.*');
        if (re.test(window.location.href) && !ref.test(window.document.referrer)) {
            // why are you looking at this rubbish?
            hidePage();
			addListeners();
            countdown(options.delay, options.strict);
        }
    }
}

chrome.extension.sendRequest({method: 'getOptions'}, go);

})();
