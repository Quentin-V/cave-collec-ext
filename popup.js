let isConnectedDiv = document.getElementById('isConnected')
let connectDiv = document.getElementById('connect')
let registerDiv = document.getElementById('register')

let registerLink     = document.getElementById('registerLink')
let registerUsername = document.getElementById('registerUsername')
let registerPassword = document.getElementById('registerPassword')
let registerConfPass = document.getElementById('registerConfirmPass')
let registerBtn      = document.getElementById('btnRegister')
let backArrow        = document.getElementById('arrow')

let connectUsername = document.getElementById("connectUsername")
let connectPassword = document.getElementById('connectPassword')
let connectBtn      = document.getElementById("btnConnect")

let welcomeA = document.getElementById('welcomeA')

displayRightDiv()
function displayRightDiv() { // Displays the right div when no user input is needed
    chrome.storage.sync.get(['cave-collec-token', 'cave-collec-username'], obj => {
        let username = obj['cave-collec-username']
        let token = obj['cave-collec-token']
        debugger
        if(!(username && token)) {
            connectDiv.style.display = ''
            welcomeA.innerHTML = welcomeA.innerHTML.replace('${username}', username)
        }else {
            isConnectedDiv.style.display = ''
        }
    })
}

// Displays register div and hides connect div when the link is clicked
registerLink.addEventListener('click', () => {
    changeConnectRegister(connectDiv, connectUsername, connectPassword, registerDiv, registerUsername, registerPassword)
})

// Displays connnect div and hides register div when the back arrow is clicked
backArrow.addEventListener('click', () => { // Hides connecition div and displays register div
    changeConnectRegister(registerDiv, registerUsername, registerPassword, connectDiv, connectUsername, connectPassword)
})

registerUsername.addEventListener('focusout', () => {
    if(!registerUsername.value) return
    request('GET', `https://quinta.ovh:3443/api/user/exists/${registerUsername.value}`, {}, oResp => {
        const resp = JSON.parse(oResp.response)
        if(oResp.status !== 200) return alert(resp.message)
        if(!resp.exists) {
            let added = addErrorAfterEl(registerUsername, 'Username already used')
            setTimeout(() => {
                added.forEach(e => fadeOutEffect(e))
            }, 3000)
        }
    })
})

connectBtn.addEventListener("click", async () => { // Verifies input then sends request
    if(!connectUsername.value) {
        return alert(`Username can't be empty`)
    }else if(!connectPassword.value) {
        return alert(`Password can't be empty`)
    }
    request('POST', 'https://quinta.ovh:3443/api/user/login', {username: connectUsername.value, password: connectPassword.value}, oResp => {
        const resp = JSON.parse(oResp.response)
        if(oResp.status !== 200) return alert(resp.message)
        chrome.storage.sync.set({'cave-collec-token': resp.token, 'cave-collec-username': resp.username}, displayRightDiv)
        (() => {alert('If you werealready on mangacollec, please refresh the page')})();
    })
})

registerBtn.addEventListener('click', () => {
    if(!registerUsername.value) {
        alert('Please fill username field')
        return registerUsername.focus()
    }else if(!registerPassword.value) {
        alert('Please fill password field')
        return registerPassword.focus()
    }else if(registerPassword.value !== registerConfPass.value) {
        alert('Password confirmation does not match password')
        return registerConfPass.focus()
    }
    const body = {
        username: registerUsername.value,
        password: registerPassword.value
    }
    request('POST', 'https://quinta.ovh:3443/api/user/register', body, oResp => {
        const resp = JSON.parse(oResp.response)
        if(resp.status !== 201) return alert(resp.message)
        chrome.storage.sync.set({'cave-collec-token': resp.token, 'cave-collec-username': resp.username}, displayRightDiv)
        (() => {alert('If you werealready on mangacollec, please refresh the page')})();
    })
})

function changeConnectRegister(toHide, toHideUsername, toHidePassword, toShow, toShowUsername, toShowPassword) {
    toHide.style.display = 'none'
    toShow.style.display  = ''
    if(toHideUsername.value !== '') toShowUsername.value = toHideUsername.value
    if(toHidePassword.value !== '') toShowPassword.value = toHidePassword.value
}

function request(method, url, body, callback) { // Sends a request
    const oReq = new XMLHttpRequest();
    oReq.open(method, url, true);
    if(typeof callback === 'function') oReq.onload = () => callback(oReq)
    oReq.setRequestHeader("Content-Type", "application/json; charset=utf-8")
    const jsonBody = JSON.stringify(body);
    oReq.send(jsonBody);
}

function addErrorAfterEl(el, message) {
    let div = document.createElement('div')
    div.id = 'errorDiv'
    let br = document.createElement('br')
    let error = document.createElement('span')
    error.classList.add('input-error')
    error.innerHTML = message
    div.appendChild(error)
    registerDiv.insertBefore(div, el.nextSibling)
    registerDiv.insertBefore(br, div)
    return [br, div]
}

function fadeOutEffect(target) {
    const fadeEffect = setInterval(function () {
        if (!target.style.opacity) {
            target.style.opacity = "1";
        }
        if (target.style.opacity > 0) {
            target.style.opacity -= 0.1;
        } else {
            clearInterval(fadeEffect);
        }
    }, 200);
}