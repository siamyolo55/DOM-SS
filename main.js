const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const puppeteer = require('puppeteer')

let win

const createWindow = () => {
    win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: false, // is default value after Electron v5
            contextIsolation: true, // protect against prototype pollution
            enableRemoteModule: false, // turn off remote
            preload: path.join(__dirname, "preload.js") // use a preload script
        }
    })
    
    win.loadFile('index.html')
}

app.whenReady().then(() => {
    createWindow()
})

// puppeteer takes over from here

//globals

let logs = []
let cnt = 1
let cords

let js = `
            function getPathTo(element) {
        if (element.id !== '')
            return "//*[@id='" + element.id + "']";
    
        if (element === document.body)
            return element.tagName.toLowerCase();
    
        var ix = 0;
        var siblings = element.parentNode.childNodes;
        for (var i = 0; i < siblings.length; i++) {
            var sibling = siblings[i];
    
            if (sibling === element)
                return getPathTo(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
    
            if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
                ix++;
            }
        }
    }
    
    document.addEventListener('mousedown', (e) => {
        e.preventDefault()
        let element = e.target
        let cords = element.getBoundingClientRect()
        console.log(cords.x, cords.y, cords.width, cords.height)
        let x = e.pageX
        let y = e.pageY
        let data = String(x) + ' ' + String(y)
        //console.log(data)
        let xpath = getPathTo(element)
        console.log(xpath)
        
        element.style.border = "2px solid red"
        // disable button/a tags
        // e.disabled = true
        //e.style.pointer-events = "none"


        
        // send xpath,x,y to backend, highlight the element, take an ss
        //async let result = await axios.post('')
    
    })`

    const test = async (url) => {
        // start the browser & load new page
        let browser = await puppeteer.launch({headless: false})
        let page = await browser.newPage()
        // set display resolution to monitor
        await page.setViewport({ width: 1600, height: 900 })
    
        // handling click evnet
        await page.exposeFunction('onClickEvent', () => {
            page.screenshot({path: `./screenshots/ss${cnt}.png`})
            cnt++
        })
        
        // listen for events of type 'status/click' and
        // pass 'type' and 'detail' attributes to our exposed function


        await page.evaluateOnNewDocument((e) => {
            let points = []
            window.addEventListener('click', () => {
                window.onClickEvent();
            })
        })

        //console.log(mousePoints)
    
        await page.goto(url,{waitUntil: 'domcontentloaded'})
        await page.addScriptTag({content: js})
    
        page.on('console',(message) => {
            logs.push(message.text())
            //console.log(message.text())
            // MIGHT NEED TO BE UNCOMMENTED
            //console.log(message.text())
        })
        //await page.close()
        //await browser.close()
    }

// receives data (link for now) from index.html
ipcMain.on('toMain', async (e, data) => {
    e.preventDefault()
    checks = data.checks
    //console.log(data.link)
    await test(data.link)
})

// receives hover chords from index.html
ipcMain.on('toMainCords', async (e, data) => {
    e.preventDefault()
    cords = data
    //console.log(data.link)
    console.log(cords)
});