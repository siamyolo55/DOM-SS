//globals

let button = document.getElementById('but')
let cords = []

button.addEventListener('click', (e) => {
    window.api.receive('fromMain', (coordinates) => {
        cords = coordinates
        let para = document.createElement('p')
        let body = document.getElementsByTagName('body')[0]
        body.appendChild(para)
    })
    e.preventDefault()
    let link = document.getElementById('link').value
    let checks = []
    let data = {
        link,
        checks
    }
    document.getElementById('click').checked ? checks.push('click') : console.log('click not checked')
    document.getElementById('hover').checked ? checks.push('hover') : console.log('hover not checked')
    window.api.send('toMain', data)
})