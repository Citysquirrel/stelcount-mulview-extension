//? manifest.json > content_scripts에 아래 구문 추가 후 사용
// {
// 	"all_frames": true,
// 	"js": ["src/interceptor.js"],
// 	"matches": ["*://*.chzzk.naver.com/*"],
// 	"exclude_globs": ["*://api.chzzk.naver.com/*"],
// 	"run_at": "document_start"
// }

//TODO 방식 바꿔야함. fetch 안잡힘
(() => {
	console.log("[StelCount] 스내핑 테스트");
	//! live-detail 스냅 후 문자 덮어쓰기: '채팅' 을 채널주 이름으로 변경하는 작업
	const TARGET_API = "https://api.chzzk.naver.com/service/v3.3/channels/";

	const originalFetch = window.fetch;

	window.fetch = async (...args) => {
		const response = await originalFetch(...args);

		try {
			const url = args[0];
			// 🔥 해당 API만 필터링
			if (typeof url === "string" && url.startsWith(TARGET_API) && url.includes("live-detail")) {
				const clone = response.clone();
				const text = await clone.text();

				const json = JSON.parse(text);

				const channelName = json?.content?.channel?.channelName;

				if (channelName) {
					injectTitle(channelName);
				}
			}
		} catch (e) {
			console.error("Fetch intercept error:", e);
		}

		return response;
	};

	function injectTitle(channelName) {
		const target = document.querySelector('h2[class^="live_chatting_header_title__"]');

		if (!target) return;

		// 이미 변경했는지 체크 (중복 방지)
		if (target.dataset.modified === "true") return;

		target.textContent = channelName;
		target.style.color = "#00ffa3";
		target.dataset.modified = "true";
	}
})();
