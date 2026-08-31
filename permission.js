const browser = window.browser || window.chrome;

document.getElementById("apply").addEventListener("click", async () => {
	const requiredOrigins = [
		"*://*.stelcount.fans/*",
		"https://nid.naver.com/*",
		"https://chzzk.naver.com/*",
		"https://api.chzzk.naver.com/*",
	];
	try {
		const hasPermissions = await browser.permissions.contains({
			origins: requiredOrigins,
		});

		if (hasPermissions) {
			window.close();
			return;
		}

		const granted = await browser.permissions.request({
			origins: requiredOrigins,
		});

		if (granted) {
			window.close();
		} else {
			console.log("[StelCount] 사용자가 권한 요청을 거부했습니다.");
		}
	} catch (err) {
		console.error("[StelCount] 권한 업데이트 중 오류 발생:", err);
	}
});
