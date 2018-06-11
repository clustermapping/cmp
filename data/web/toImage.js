const puppeteer = require('puppeteer');

const args = process.argv;
address = args[2];
output = args[3];
options = args[4];

console.log(address + ' '+ output+' '+options);

viewportSize = { width: 1280, height: 1080 };
if (options == "sparkline") {
	viewportSize = { width: 480, height: 320 };
}

(async ()  => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  await page.setViewport(viewportSize);
  if (options == "noheader") {
    try {
      await page.evaluate(function() {
	    jQuery('footer, header, nav').hide();
        jQuery('body').css('padding-top', 0);
      });
    } catch(e){}
  }
  await page.evaluate(function() {
    document.body.bgColor = 'white';
  });

  await page.goto(address, {"waitUntil" : "networkidle0"});
  await page.screenshot({path: output});

  await browser.close();
})();
