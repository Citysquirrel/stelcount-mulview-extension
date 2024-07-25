document.getElementById("apply").addEventListener("click", () => {
	chrome.permissions
		.request({
			origins: ["*://*.stelcount.fans/*", "*://*.naver.com/*", "*://*.chzzk.naver.com/*"],
		})
		.then((granted) => {
			if (granted) {
				window.close();
			}
		});
});
