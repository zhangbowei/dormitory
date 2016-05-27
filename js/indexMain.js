// 其ID解析会避开常规的"baseUrl + paths"配置，而是直接将其加载为一个相对于当前HTML文档的脚本：
// 以 ".js" 结束.
// 以 "/" 开始.
// 包含 URL 协议, 如 "http:" or "https:".
requirejs.config({
    baseUrl: 'node_modules',
    paths: {
        items: '../js/items',
        'jquery': 'jquery/dist/jquery.min',
        'underscore': 'underscore/underscore',
        'bootstrap': 'bootstrap/dist/js/bootstrap',
    },
    shim: {
        'bootstrap': {
            deps: ['jquery']
        }
    }
});
        
//这里注意 requirejs()里加载的 模块 不是按顺序的！
//（当然，异步下有可能按顺序加载完成，但是还是应该把 deps 写上，以防出现问题）
requirejs(['items/index', 'items/ie10', 'jquery', 'bootstrap'], function (indexPage){
    indexPage.initHTML();
    indexClickSet = indexPage.clickSet; 
});
        
        
