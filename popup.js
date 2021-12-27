// Initialize button with user's preferred color
let changeColor = document.getElementById("changeColor");
let saveUsername = document.getElementById("btnUsername");
let inputUsername = document.getElementById("inputUsername");

chrome.storage.sync.get(['cave-collec-username'], obj => {
	username = obj['cave-collec-username']
	if(username) inputUsername.value = username
})

btnUsername.addEventListener("click", async () => {
	chrome.storage.sync.set({'cave-collec-username': inputUsername.value});
})

// When the button is clicked, inject setPageBackgroundColor into current page
/*
changeColor.addEventListener("click", async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: setPageBackgroundColor,
  });
});
*/
// The body of this function will be executed as a content script inside the
// current page
function setPageBackgroundColor() {
  chrome.storage.sync.get("color", ({ color }) => {
    document.body.style.backgroundColor = color;
  });
}
