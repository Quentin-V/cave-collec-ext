var previousUrl = null
var intervals = []
var username = null
var previousAsLength = 0

detectUrlChange()
setInterval(detectUrlChange, 1000)

function detectUrlChange() {
	let url = globalThis.location.href
	if(url != previousUrl) {
		previousUrl = url
		handleURLChange(url)
	}
}

function handleURLChange(url) {
	while(intervals.length > 0) clearInterval(intervals.shift())
	// Refresh the username
	chrome.storage.sync.get(['cave-collec-username'], obj => {
		username = obj['cave-collec-username']
		if(!username) return
		if(url.includes('/editions/')) {
			previousAsLength = 0
			handleEditions(url.substr(url.indexOf('/editions/')+'/editions/'.length))
			intervals.push(setInterval(() => handleEditions(url.substr(url.indexOf('/editions/')+'/editions/'.length)), 1000))
		}else if(url.includes('/volumes/')) {
			handleVolume(url.substr(url.indexOf('/volumes/')+'/volumes/'.length))
		}
	})
}


function handleEditions(editionId) {
	let as = document.querySelectorAll('a[href]')
	if(previousAsLength != as.length) previousAsLength = as.length
	else return;
	let idToEl = new Map()
	as.forEach(a => {
	    if(a.href.includes('volumes')) idToEl.set(a.href.substr(a.href.indexOf('/volumes/')+'/volumes/'.length), a)
	})
	let ids = Array.from(idToEl.keys())
	let url = `https://quinta.ovh:3443/api/edition/${editionId}/${username}`
	request("GET", url, null, (oReq) => {
		let jsonResp = JSON.parse(oReq.response)
		jsonResp.forEach(r => {
			if(!r.read) return
			let el = idToEl.get(r.mangaId)
			if(el.dataset.read) return
			let checkRed =  el.children[0].children[1].children[0].cloneNode(true)
			if(!checkRed) return
			checkRed.style.backgroundColor = '#DDDD55'
			el.children[0].children[1].appendChild(checkRed)
			el.dataset.read = true
		})
	})
}

function handleVolume(volumeId) {
	let collec = document.querySelectorAll('div[class="css-1dbjc4n r-18u37iz"]')[2]
	let banner = collec.parentElement.parentElement

	let readDiv = document.createElement('div')
	let container = document.createElement('div')
	let a = document.createElement('a')
	a.style.fontFamily = 'Roboto'

	readDiv.style.display = 'table'
	container.style.display = 'table-cell'
	container.style.verticalAlign = 'middle'

	readDiv.style.width = '150px'
	readDiv.style.height = '40px'
	readDiv.style.marginLeft = '12px'
	readDiv.style.marginTop = '2%'
	readDiv.style.textAlign = 'center'
	readDiv.style.color = 'white'
	readDiv.style.borderRadius = '20px'
	readDiv.style.cursor = 'pointer'
	readDiv.style.transition = '2s'
	readDiv.id = 'isRead'

	container.appendChild(a)
	readDiv.appendChild(container)
	let editionHref = document.querySelectorAll('a[class="css-4rbku5 css-18t94o4 css-1dbjc4n r-1loqt21 r-1otgn73 r-1i6wzkk r-lrvibr"]')[1].href
	let editionId = editionHref.substr(editionHref.indexOf('/editions/')+'/editions/'.length)
	let isRead = request('GET', `https://quinta.ovh:3443/api/read/${editionId}/${volumeId}/${username}`, null, oReq => {
		let isRead = JSON.parse(oReq.response).read
		if(isRead) notRead2Read(readDiv, a, volumeId, false)
		else read2NotRead(readDiv, a, volumeId, false)
		banner.parentElement.insertBefore(readDiv, banner.nextSibling)
	})
}

function notRead2Read(readDiv, a, volumeId, execRequest = true) {
	a.innerHTML = 'LU'
	readDiv.style.backgroundColor = '#4c76ad'
	readDiv.onclick = () => read2NotRead(readDiv, a, volumeId)
	if(!execRequest) return;
	request('PUT', `https://quinta.ovh:3443/api/read/${volumeId}/${username}`, {read: true}, null)
}

function read2NotRead(readDiv, a, volumeId, execRequest = true) {
	a.innerHTML = 'PAS LU'
	readDiv.style.backgroundColor = '#cf783a'
	readDiv.onclick = () => notRead2Read(readDiv, a, volumeId)
	if(!execRequest) return;
	request('PUT', `https://quinta.ovh:3443/api/read/${volumeId}/${username}`, {read: false}, null)
}

function request(method, url, body, callback) {
	var oReq = new XMLHttpRequest();
	oReq.open(method, url, true);
	if(typeof callback === 'function') oReq.onload = (res) => callback(oReq)
	oReq.setRequestHeader("Content-Type", "application/json; charset=utf-8")
	jsonBody = JSON.stringify(body);
	oReq.send(jsonBody);
}
