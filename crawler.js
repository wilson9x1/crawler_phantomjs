var url, cookie, postdata, auth, post, timeout, system = require('system'), page = require("webpage").create();
var referer = "";

if (system.args.length !== 6) {
    console.log('Usage: crawls.js <url> <cookie> <auth> <post> <timeout>');
    phantom.exit();
} else {
    url = system.args[1];
    cookie = system.args[2];
    auth = system.args[3];
    post = system.args[4];
    timeout = system.args[5];
    page.settings.loadImages = false;
    page.settings.resourceTimeout = timeout ? timeout * 1000 : 5 * 1000;
    headers = {};
    headers['Cookie'] = cookie;
    headers['authorization'] = auth;
    page.customHeaders = headers;
    page.settings.userAgent = 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/37.0.2062.124 Safari/537.36';

    page.viewportSize = {
        width: 1024,
        height: 768
    };
    page.onInitialized = function () {
    };

    page.onLoadStarted = function () {
        // console.log("page.onLoadStarted");
    };
    page.onLoadFinished = function () {
        // console.log("page.onLoadFinished");
    };

    //hook url request
    page.onResourceRequested = function (request) {
        var requestData = JSON.parse(JSON.stringify(request, undefined, 4))
        if ( (/(image\/(png|jpeg|gif)|text\/css)$/).test(requestData.headers['Content-Type'])) {
            request.abort();
        }
        if ( (/logout|delete/).test(request.url)) {
            request.abort();
        }
        
        postdata = request.postData ? request.postData : "";
        for (var i = 0; i < request.headers.length; i++) {
            if (request.headers[i].name == "Referer") {
                referer = request.headers[i].value;
            }
        }
        requesturl = request.url.replace(/"/g, "\\\"");
        requestdata = postdata.replace(/"/g, "\\\"");
        requestreferer = referer.replace(/"/g, "\\\"");
        console.log("hook_url:{\"url\":\"" + request.url + "\",\"method\":\"" + request.method+ "\",\"cookie\":\"" + cookie + "\",\"post\":\"" + requestdata + "\",\"referer\":\"" + requestreferer + "\"}hook_url_end");
    };

    //hook alert
    page.onAlert = function (msg) {
    }

    //log msg in page.evaluate
    page.onConsoleMessage = function (msg) {
        map=JSON.parse(msg);
        map['cookie']=cookie;
        msg=JSON.stringify(map);
        console.log("hook_url:"+msg+"hook_url_end");
    };

    var method = post ? "POST" : "GET"

    //window.open() will hook,window.open() create a new page, old page not change
    page.onPageCreated = function (newPage) {
        newPage.onResourceRequested = function (request) {
            postdata = request.postData ? request.postData : "";
            for (var i = 0; i < request.headers.length; i++) {
                if (request.headers[i].name == "Referer") {
                    referer = request.headers[i].value;
                }
            }
            requesturl = request.url.replace(/"/g, "\\\"");
            requestdata = postdata.replace(/"/g, "\\\"");
            requestreferer = referer.replace(/"/g, "\\\"");
            console.log("hook_url:{\"url\":\"" + request.url + "\",\"method\":\"" + request.method+ "\",\"cookie\":\"" + cookie  + "\",\"post\":\"" + requestdata + "\",\"referer\":\"" + requestreferer + "\"}hook_url_end");
        };
        newPage.close();
    };

    page.open(url, {
            operation: method,
            data: post,
        },
        function (status) {
            if (status !== 'success') {
                console.log('Unable to access network');
            } else {
                page.evaluate(function () {
                    var onevents = [];
                    var onclickstrs = [];
                    var urls=[];
                    //get form
                    function GetForm() {
                        var f = document.forms;
                        for (var i = 0; i < f.length; i++) {
                            url = f[i].action;
                            //input 
                            var inputs = f[i].getElementsByTagName('*');
                            var requestdata = "";
                            var len = inputs.length;

                            for (var j = 0; j < len; j++) {
                                if(inputs[j].hasAttributes("*")== true){                   
                                    if (j < len - 1) {
                                        //console.log("row:",inputs[j].hasAttributes("value")," name:",inputs[j].name," values:" + inputs[j].value)
                                        if(inputs[j].hasAttributes("name")&&inputs[j].name !=undefined){
                                            requestdata = requestdata + inputs[j].name 
                                        }  
                                        else{
                                            continue
                                        }
                                        if(inputs[j].hasAttributes("value")&&inputs[j].value !=""){
                                            requestdata = requestdata + "=" + inputs[j].value + "&";
                                        }
                                        else{
                                            requestdata = requestdata + "=meilisecurty&";
                                        }      
                                    }
                                    if (j == len - 1) {
                                        if(inputs[j].hasAttributes("name")&&inputs[j].name !=undefined){
                                               requestdata = requestdata + inputs[j].name 
                                        }
                                        else{
                                            continue
                                        }
                                        if(inputs[j].hasAttributes("value")&&inputs[j].value !=""){
                                            requestdata = requestdata + "=" + inputs[j].value ;
                                        }
                                        else{
                                            requestdata = requestdata + "=meilisecurty";
                                        }

                                    }
                                }
                            }

                            res = "{\"url\":\"" + url + "\",\"method\":\"post\"," + "\"post\":\""+ requestdata + "\",\"cookie\":\"" + "\",\"referer\":\"" + window.location.href + "\"}";
                            if (urls.indexOf(res) < 0) {
                                urls.push(res);
                                console.log(res);
                            }
                        }
                    }
                    //get href by tag
                    function handle_tag(tag, src) {
                        var elements = document.getElementsByTagName(tag);
                        for (var i = 0; i < elements.length; i++) {
                            res = "{\"url\":\"" + elements[i][src] + "\",\"method\":\"get\",\"post\":\""+ "\",\"cookie\":\""+ "\",\"referer\":\"" + window.location.href + "\"}";
                            if (urls.indexOf(res) < 0 && elements[i][src].indexOf("javascript:") < 0 && elements[i][src].indexOf("mailto:") < 0) {
                                urls.push(res);
                                console.log(res);
                            }
                        }
                    }
                    //get href
                    function getallurl() {
                        GetForm();
                        handle_tag('a', 'href');
                        handle_tag('link', 'href');
                        handle_tag('area', 'href');
                        handle_tag('img', 'src');
                        handle_tag('embed', 'src');
                        handle_tag('video', 'src');
                        handle_tag('audio', 'src');
                    }
                    //get onevent
                    function getonevents() {
                        var allElements = document.getElementsByTagName('*');
                        var len = allElements.length;// allElements will change,len will change
                        for (var i = 0; i < len; i++) {
                            //js_code
                            if (allElements[i].href) {
                                javascript_code = allElements[i].href.match("javascript:(.*)");
                                if (javascript_code) {
                                    if (onevents.indexOf(javascript_code[0]) < 0) {
                                        onevents.push(javascript_code[0]);
                                    }
                                }
                            }
                            //onclick onevent too much,now only click
                            if (typeof allElements[i].onclick === 'function') {
                                onclickstr = String(allElements[i].onclick);
                                if (onclickstrs.indexOf(onclickstr) < 0) {
                                    onevents.push(allElements[i]);
                                    onclickstrs.push(onclickstr);
                                }
                            }
                        }
                    }
                    function doloop(i) {
                        getallurl();
                        getonevents();
                        if (onevents.length ==0) {
                            return;
                        }
                        if (i == (onevents.length - 1)) {
                            if (typeof  onevents[i] === "string") {
                                eval(onevents[i]);
                            }
                            else {
                                onevents[i].click();
                            }
                            //over~
                            setTimeout(function () {
                                getallurl();
                            }, 1000);
                        }
                        else {
                            if (typeof  onevents[i] === "string") {
                                eval(onevents[i]);
                            }
                            else {
                                onevents[i].click();
                            }

                            i = i + 1; //1
                            setTimeout(function () {
                                doloop(i);
                            }, 1000);
                        }
                    }
                    function main() {
                        doloop(0);
                    }
                    main();
                });
            };

            window.setTimeout(
                function () {
                    phantom.exit();
                },
                20000 /* wait 10 seconds (10000ms) */
            );
        });
}
