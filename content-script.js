setInterval(detectUrlChange, 2000)

var previousUrl = null
function detectUrlChange() {
	let url = globalThis.location.href
	if(url != previousUrl) {
		previousUrl = url
		handleURLChange(url)
	}
}

var intervals = [];
var username = null;
function handleURLChange(url) {
	while(intervals.length > 0) clearInterval(intervals.shift())
	// Refresh the username
	chrome.storage.sync.get(['cave-collec-username'], obj => {
		username = obj['cave-collec-username']
		if(!username) return
		if(url.includes('/editions/')) {
			intervals.push(setInterval(() => handleEditions(url.substr(url.indexOf('/editions/')+'/editions/'.length)), 2000))
		}else if(url.includes('/volumes/')) {
			handleVolume(url.substr(url.indexOf('/volumes/')+'/volumes/'.length))
		}
	})
}

var previousAsLength = 0;
function handleEditions(editionId) {
	console.log('Handling editions')
	let as = document.querySelectorAll('a[href]')
	console.log(`as length : ${as.length}`);
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
	console.log(`Handlind volume`);
}

function executeScript() {
	var w = globalThis
	chrome.storage.sync.get(['cave-collec-username'], obj => {
		username = obj['cave-collec-username']
		if(!username) return
		var idToEl = new Map()
		debugger;
		let currentUrl = w.location.href

		document.querySelectorAll('a[href]').forEach(a => {
		    if(a.href.includes('volumes')) idToEl.set(a.href.substr(a.href.indexOf('/volumes/')+'/volumes/'.length), a)
		})
		//6ad2d74f-ddfd-4ec3-abe1-0fb4a72e7ba8
		var url = 'https://quinta.ovh:3443/api/read/'
		//url = 'https://quinta.ovh:3443/api/read/6ad2d74f-ddfd-4ec3-abe1-0fb4a72e7ba8'
		var ids = Array.from(idToEl.keys())
		var body = {
			mangaIds : ids,
			user: username
		}
		request("PUT", url, body, (oReq) => {
			var jsonResp = JSON.parse(oReq.response)
			console.log(`jsonResp.length : ${jsonResp.length}`);
			jsonResp.forEach(r => {
				if(!r.read) return
				var el = idToEl.get(r.mangaId)
				var checkRed =  el.children[0].children[1].children[0].cloneNode(true)
				if(!checkRed) return
				checkRed.style.backgroundColor = '#DDDD55'
				checkRed.onclick = () => {console.log("TODO : update record")}
				el.children[0].children[1].appendChild(checkRed)
			})

		})
	})
}

function request(method, url, body, callback) {
	var oReq = new XMLHttpRequest();
	oReq.open(method, url, true);
	oReq.onload = (res) => {
		callback(oReq)
	}
	oReq.setRequestHeader("Content-Type", "application/json; charset=utf-8")
	jsonBody = JSON.stringify(body);
	oReq.send(jsonBody);
}
