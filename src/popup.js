document.getElementById("goto").addEventListener("click", () => {
	chrome.tabs.create({
		url: "https://stelcount.fans/multiview",
	});
});
