const browser = window.browser || window.chrome;

document.getElementById("apply").addEventListener("click", () => {
	browser.permissions
		.request({
			origins: ["*://*.stelcount.fans/*", "*://*.naver.com/*", "*://*.chzzk.naver.com/*"],
		})
		.then((granted) => {
			if (granted) {
				window.close();
			}
		});
});
