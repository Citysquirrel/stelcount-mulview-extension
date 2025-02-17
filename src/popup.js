const browser = window.browser || window.chrome;

document.getElementById("goto").addEventListener("click", () => {
	browser.tabs.create({
		url: "https://stelcount.fans/multiview",
	});
});
