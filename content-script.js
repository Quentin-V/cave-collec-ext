const notReleasedVolume = '<div class="css-1dbjc4n"><svg viewBox="0 0 512 512" width="30" height="30" fill="var(--colors-icon)" stroke="var(--colors-icon)"><rect width="416" height="352" rx="48" ry="48" fill="none" stroke-width="32" stroke-linejoin="round" x="48" y="80"></rect><circle cx="336" cy="176" r="32" fill="none" stroke-width="32" stroke-miterlimit="10"></circle><path d="M304 335.79l-90.66-90.49a32 32 0 00-43.87-1.3L48 352M224 432l123.34-123.34a32 32 0 0143.11-2L464 368" fill="none" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"></path></svg></div>'
const observer = new MutationObserver((mutationList) => {
	// Guard case to prevent triggering for nothing, will only trigger if all added elements are Images, so new volumes OR if there is a not
	if(!mutationList.every(m => m?.addedNodes?.[0]?.constructor?.name === 'HTMLImageElement') && !mutationList.some(m => m?.addedNodes?.[0]?.innerHTML === notReleasedVolume)) return
	let url = window.location.href
	handleEditions(url.substr(url.indexOf('/editions/')+'/editions/'.length))
})
const observerConfig = { childList: true, subtree: true };

// Detect url change and triggers handleURLChange
window.onpopstate = () => handleURLChange(window.location.href)
window.onpopstate() // Exec the function at the beginning

let username, token

function handleURLChange(url) {
	observer.disconnect() // Disconnect the observer when changing url e.g. going from edition to volume
	// Refresh the username
	chrome.storage.sync.get(['cave-collec-username', 'cave-collec-token'], obj => {
		username = obj['cave-collec-username']
		token = obj['cave-collec-token']
		if(!(username && token)) return
		if(url.includes('/editions/')) { // If in edition page
			handleEditions(url.substr(url.indexOf('/editions/')+'/editions/'.length))
			observer.observe(document.querySelector('div[class="css-1dbjc4n r-eqz5dr"]').firstChild, observerConfig)
		}else if(url.includes('/volumes/')) { // Volume page
			handleVolume(url.substr(url.indexOf('/volumes/')+'/volumes/'.length))
		}
	})
}

function handleEditions(editionId) {
	let as = document.querySelectorAll('a[href]')
	let volumes = []
	for(const a of as) if(a.href.match('.*/volumes/.*')) volumes.push(a)
	let idToEl = new Map()
	volumes.forEach(a => {
	    idToEl.set(a.href.substr(a.href.indexOf('/volumes/')+'/volumes/'.length), a)
	})

	let url = `https://quinta.ovh:3443/api/edition/${editionId}/${username}`
	request("GET", url, null, (oReq) => {
		let jsonResp = JSON.parse(oReq.response)
		jsonResp.forEach(r => {
			if(!r.read) return
			let el = idToEl.get(r.mangaId)
			if(!el || el.dataset.read) return
			let readCheck =  createReadCheck()
			el.children[0].children[1].appendChild(readCheck)
			el.dataset.read = "true"
		})
	})
}

function handleVolume(volumeId) { // Creates the read / not read button and put it on the page
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
	request('GET', `https://quinta.ovh:3443/api/read/${editionId}/${volumeId}/${username}`, null, oReq => {
		let isRead = JSON.parse(oReq.response).read
		if(isRead) notRead2Read(readDiv, a, volumeId, false)
		else read2NotRead(readDiv, a, volumeId, false)
		banner.parentElement.insertBefore(readDiv, banner.nextSibling)
	})
}

function notRead2Read(readDiv, a, volumeId, execRequest = true) { // Changes not read to read and sends the request to the server if needed
	a.innerHTML = 'LU'
	readDiv.style.backgroundColor = '#4c76ad'
	readDiv.onclick = () => read2NotRead(readDiv, a, volumeId)
	if(!execRequest) return;
	request('PUT', `https://quinta.ovh:3443/api/read/${volumeId}/${username}`, {read: true}, null)
}

function read2NotRead(readDiv, a, volumeId, execRequest = true) { // Changes read to not read and sends the request to the server if needed
	a.innerHTML = 'PAS LU'
	readDiv.style.backgroundColor = '#cf783a'
	readDiv.onclick = () => notRead2Read(readDiv, a, volumeId)
	if(!execRequest) return;
	request('PUT', `https://quinta.ovh:3443/api/read/${volumeId}/${username}`, {read: false}, null)
}

function request(method, url, body, callback) { // Sends a request
	const oReq = new XMLHttpRequest();
	oReq.open(method, url, true);
	if(typeof callback === 'function') oReq.onload = () => callback(oReq)
	oReq.setRequestHeader("Content-Type", "application/json; charset=utf-8")
	oReq.setRequestHeader('Authorization', 'Bearer ' + token)
	jsonBody = JSON.stringify(body);
	oReq.send(jsonBody);
}

function createReadCheck() {
	const readCheckHtml = '<div data-readcheck="true" class="css-1dbjc4n r-1awozwy r-y47klf r-1yadl64 r-18u37iz r-1wbh5a2 r-157gdtw r-1777fci r-ilng1c r-m2pi6t r-1hvjb8t r-cacpof" style="background-color: rgb(221, 221, 85);"><div class="css-1dbjc4n r-1mdbw0j"><svg viewBox="0 0 512 512" width="16" height="16" fill="#FFF" stroke="#FFF"><path d="M416 128L192 384l-96-96" fill="none" stroke-width="44" stroke-linecap="round" stroke-linejoin="round"></path></svg></div></div>'
	var div = document.createElement('div');
	div.innerHTML = readCheckHtml;
	// Change this to div.childNodes to support multiple top-level nodes
	return div.firstChild;
}
