// const browser = window.browser || window.chrome;

function sendSettings(settings) {
	sendToPage("SETTINGS_UPDATE", settings);
}
function sendToPage(type, payload) {
	window.postMessage(
		{
			__STELCOUNT__: true,
			type,
			payload,
		},
		window.location.origin,
	);
}

window.messanger = {
	sendSettings,
	sendToPage,
};

if (window.location.hostname === "chzzk.naver.com") {
	const script = document.createElement("script");
	script.src = chrome.runtime.getURL("src/injected/chzzk.js");
	script.onload = () => {
		console.log("[StelCount] script loaded successfully");
	};
	script.onerror = () => {
		console.log("[StelCount] script failed to load");
	};
	document.body.appendChild(script);

	const public = document.createElement("script");
	public.src = chrome.runtime.getURL("src/injected/public.js");

	public.onload = () => {
		console.log("[StelCount] public loaded successfully");
	};
	public.onerror = () => {
		console.log("[StelCount] public failed to load");
	};
	document.body.appendChild(public);
}

// 초기 설정 전달
chrome.storage.sync.get(null, (settings) => {
	sendSettings(settings);
});

// 실시간 반영 설정
chrome.storage.onChanged.addListener((changes, area) => {
	if (area === "sync") {
		chrome.storage.sync.get(null, (settings) => {
			sendSettings(settings);
		});
	}
});

// 메시지 브릿지
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "updateMultiView") {
		window.postMessage(request, window.location.origin);
		sendResponse({ status: "success" });
	}
});

// 사이트에서 확장 프로그램으로의 메시지 전달
window.addEventListener("message", (event) => {
	// 같은 도메인에서 온 특정 액션만 허용
	if (event.data && event.data.action === "requestInitData") {
		sendDataToReact();
	}
});

function sendDataToReact() {
	chrome.storage.local.get("multiviewInitData", (result) => {
		if (result.multiviewInitData) {
			window.postMessage(
				{
					action: "updateMultiView",
					channels: result.multiviewInitData,
				},
				window.location.origin,
			);
			// 사용한 완료한 데이터 파기
			chrome.storage.local.remove("multiviewInitData");
		}
	});
}
