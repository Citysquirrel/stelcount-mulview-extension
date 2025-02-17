// 저작권 © jebibot 2024-
// 이 코드는 MIT 라이선스에 따라 배포됩니다.
// 라이선스 사본은 프로젝트 루트에서 확인할 수 있습니다.

// Copyright (c) 2024 jebibot
// This file is licensed under the MIT License.
// See the LICENSE file in the project root for more information.
const browser = window.browser || window.chrome;

try {
	window.top.location.hostname;
} catch {
	if (window.location.hostname === "chzzk.naver.com") {
		const script = document.createElement("script");
		script.src = browser.runtime.getURL("src/chzzk.js");
		script.onload = () => {
			console.log("script loaded successfully");
		};
		script.onerror = () => {
			console.log("script failed to load");
		};

		document.body.appendChild(script);
	}
}
