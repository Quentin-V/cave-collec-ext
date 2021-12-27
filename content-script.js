setTimeout(executeScript, 1000)

function executeScript() {
	console.log("In matching page")
	chrome.storage.sync.get(['cave-collec-username'], obj => {
		username = obj['cave-collec-username']
		if(!username) return
		var idToEl = new Map()
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

}
