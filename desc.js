const puppeteer = require('puppeteer');

//连接数据库，读取表中的商品详情
var mysql      = require('mysql');
var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'root',
    password : 'aaa111',
    database : 'swsdb'
});

connection.connect();

var html = '';
connection.query('select description from eb_store_product where is_show = 1 limit 1', function (error, results, fields) {
    if (error) throw error;
    if (results.length == 0) return false;
    html = results[0].description;
});

if (html == ''){
    return;
}
(async () => {

    // 启动Chromium
    const browser =await puppeteer.launch({ignoreHTTPSErrors:true, headless:false, args: ['--no-sandbox']});
    // 打开新页面
    const page =await browser.newPage();
    // 设置页面分辨率
    await page.setViewport({width:400, height:1080});

    html = '<html><body>'+html+'</body></html>'
    //设置页面内容
    await page.setContent(html);
    // 网页加载最大高度
    const max_height_px =20000;
    // 滚动高度
    let scrollStep =1080;
    let height_limit =false;
    let mValues = {'scrollEnable':true, 'height_limit': height_limit};
    while (mValues.scrollEnable) {
        mValues =await page.evaluate((scrollStep, max_height_px, height_limit) => {
            // 防止网页没有body时，滚动报错
            if (document.scrollingElement) {
                let scrollTop = document.scrollingElement.scrollTop;
                document.scrollingElement.scrollTop = scrollTop + scrollStep;
                if (null != document.body && document.body.clientHeight > max_height_px) {
                    height_limit =true;
                }else if (document.scrollingElement.scrollTop + scrollStep > max_height_px) {
                    height_limit =true;
                }

                let scrollEnableFlag =false;
                if (null != document.body) {
                    scrollEnableFlag = document.body.clientHeight > scrollTop +1081 && !height_limit;
                }else {
                    scrollEnableFlag = document.scrollingElement.scrollTop + scrollStep > scrollTop +1081 && !height_limit;
                }

                return {
                    'scrollEnable': scrollEnableFlag,
                    'height_limit': height_limit,
                    'document_scrolling_Element_scrollTop': document.scrollingElement.scrollTop
                };
            }
        }, scrollStep, max_height_px, height_limit);
        await sleep(800);
    }

    try {
        await page.screenshot({path:"desc.jpg", fullPage:true}).catch(err => {
            console.log('截图失败');
            console.log(err);
        });
        await page.waitFor(5000);

    }catch (e) {
        console.log('执行异常');
    }finally {
        await browser.close();
    }
})();
//延时函数
function sleep(delay) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                resolve(1)
            }catch (e) {
                reject(0)
            }
        }, delay)
    })
}
