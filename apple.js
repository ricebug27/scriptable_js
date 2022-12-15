/**
 * author: 飙猪狂
 * 这个脚本用于监测国内苹果官翻设备的情况
 */
let data = await getHTML('https://www.apple.com.cn/shop/refurbished/mac/macbook-pro');
let model = 'M1';
if(args.widgetParameter != null)
{
	model = args.widgetParameter ? args.widgetParameter : model;
}
let widget = await createWidget(data,model);
if (config.runsInWidget) {
  // The script runs inside a widget, so we pass our instance of ListWidget to be shown inside the widget on the Home Screen.
  Script.setWidget(widget);
} else {
  // The script runs inside the app, so we preview the widget.
  widget.presentMedium();
}
// Calling Script.complete() signals to Scriptable that the script have finished running.
// This can speed up the execution, in particular when running the script from Shortcuts or using Siri.
Script.complete();

async function createWidget(data,model) {
    let widget = new ListWidget();//先创建ListWidget对象
    // widget.backgroundColor = Color.dynamic(
    //     new Color('FFF8EE'),
    //     new Color('000000'),
    // );
    widget.refreshAfterDate = new Date(Date.now()+1000*60*5)//这个是指定多长时间后台重新执行一遍脚本，当前是设置每5分钟刷新一次，至于刷新的速率很大程度上取决于操作系统，如你的电量、内存、网络环境​等。
    widget.setPadding(20,10,20,10)//设置好组件与其他应用在桌面上的边距
    //创建头部展示区域
    const header = widget.addStack();//WidgetStack组件相当于HTMl的div
    header.size = new Size(0,24);
    const headerIcon = header.addImage(await loadImg('https://ss1.baidu.com/6ONXsjip0QIZ8tyhnq/it/u=3779990328,1416553241&fm=179&app=35&f=PNG?w=108&h=108&s=E7951B62A4639D153293A4E90300401B'))
    headerIcon.imageSize = new Size(22,22);
    header.addSpacer(2);
    const headerTitle = header.addText("苹果官翻MacbookPro监控");
    headerTitle.textColor = new Color('#0080FF');
    headerTitle.font = Font.boldSystemFont(18);
    //当组件设置为2X2时，仅能显示Logo，直接返回头部图标就可以了
    if(config.widgetFamily === 'small') {
        return widget;
    }
    header.addSpacer();//增加空隙​
    //创建身体展示区域​                  var _b = title.substring(3,title.indexOf('芯')-1)+title.substring(title.indexOf('- ')+1)
    const content = widget.addStack();
    content.layoutVertically();
    content.addSpacer(5);
    content.setPadding(5,0,5,0);
    let _rownum = 0;
    for(let i=0;i<5;i++){
        const title = data[i].title;
        const _title = title.substring(3,title.indexOf('寸')-1)+title.substring(title.indexOf('Pro')+4,title.indexOf('配备')-1)+title.substring(title.indexOf('- ')+1)+data[i].price;
        const row = content.addStack();
        const rowText = row.addText(_title);
        rowText.font = Font.boldSystemFont(14);
        rowText.lineLimit = 1;
        // rowText.textColor = new Color('000000');
        row.url = data[i].href;
    }
    for(let i=0;i<data.length;i++){
        let title = data[i].title;
        if(title.indexOf(model)>-1){
            let notify1 = new Notification();
            notify1.title = "您监测的设备有货了！";
            notify1.body = title;
            notify1.openURL = data[i].href;
            await notify1.schedule();
            break;
        }
    }
    widget.addSpacer();
    // 创建底部展示区域，增加一个时间展示，方便我们知道​当前的热搜结果是什么时间点的结果
    const footer = widget.addStack();
    footer.size = new Size(0, 16);
    footer.addSpacer();
    const DF = new DateFormatter();
    DF.dateFormat = 'yyyy-MM-dd HH:mm:ss';
    const now = DF.string(new Date());
    const footerText = footer.addText(now);
    footerText.font = Font.regularSystemFont(14);
    footerText.lineLimit = 1;
    
    return widget;
  }

async function getHTML(url){
    let webView = new WebView();
    await webView.loadURL(url);
    let js = `
        function _amethod(){
            var _result = [];
            var _a = document.querySelectorAll('li.rf-refurb-producttile');
            for(var i=0;i<_a.length;i++){
                var title = _a[i].querySelector('a.rf-refurb-producttile-link').outerText;
                var href = _a[i].querySelector('a.rf-refurb-producttile-link').href;
                var price = _a[i].querySelector('span.rf-refurb-producttile-currentprice').outerText;
                _result.push({"title":title,"price":price,"href":href});
            } 
            return _result;
        }
        _amethod();
    `
    let datas = await webView.evaluateJavaScript(js);
    return datas;
}

async function loadImg (url) {
    const req = new Request(url);
    return await req.loadImage();
}
