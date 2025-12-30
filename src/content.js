// 저작권 © jebibot 2024-
// 이 코드는 MIT 라이선스에 따라 배포됩니다.
// 라이선스 사본은 프로젝트 루트에서 확인할 수 있습니다.

// Copyright (c) 2024 jebibot
// This file is licensed under the MIT License.
// See the LICENSE file in the project root for more information.
// const browser = window.browser || window.chrome;

try {
	window.top.location.hostname;
} catch {
	if (window.location.hostname === "chzzk.naver.com") {
		const script = document.createElement("script");
		script.src = chrome.runtime.getURL("src/chzzk.js");
		script.onload = () => {
			console.log("script loaded successfully");
		};
		script.onerror = () => {
			console.log("script failed to load");
		};

		document.body.appendChild(script);
	}
}

//! 삭제 예정. 기능 축소 및 팝업 간소화 진행
// // 페이지 로드시 체크 확인 & 실행
// chrome.storage.sync.get("subconToFront", (data) => {
// 	if (data.subconToFront) {
// 		executeSubconToFront();
// 	}
// 	if (data.donationToChat) {
// 		executeDonationToChat();
// 	}
// });

// // 스토리지 변경 시 실시간 반영
// chrome.storage.onChanged.addListener((changes, namespace) => {
// 	if (namespace === "sync" && changes.subconToFront) {
// 		if (changes.subconToFront.newValue) {
// 			executeSubconToFront();
// 		} else {
// 			document.body.style.backgroundColor = ""; // 초기화
// 		}
// 	}
// });

// function executeSubconToFront() {
// 	const observer = new MutationObserver((mutations) => {
// 		for (const mutation of mutations) {
// 			mutation.addedNodes.forEach((node) => {
// 				if (node.nodeType === 1 && [...node.classList].some((cls) => cls.startsWith("live_chatting_emoticon__"))) {
// 					console.log("이모지 팝업 감지됨:", node);

// 					const innerObserver = new MutationObserver(() => {
// 						const camera = node.querySelector(".flicking-camera");
// 						if (camera) {
// 							console.log("flicking-camera 감지됨 ✅");

// 							const order = { 0: 0, 3: 1, 2: 2 };
// 							const children = Array.from(camera.children);

// 							children
// 								.sort((a, b) => {
// 									const aOrder = order[a.getAttribute("data-type")] ?? 99;
// 									const bOrder = order[b.getAttribute("data-type")] ?? 99;
// 									return aOrder - bOrder;
// 								})
// 								.forEach((el) => camera.appendChild(el));

// 							console.log("정렬 완료 🎉");
// 							innerObserver.disconnect();
// 						}
// 					});

// 					innerObserver.observe(node, { childList: true, subtree: true });
// 				}
// 			});
// 		}
// 	});

// 	observer.observe(document.body, { childList: true, subtree: true });
// }

// function executeDonationToChat() {
// 	const chatList = document.querySelector('div[class^="live_chatting_list_wrapper__"]');
// 	const clone = document.querySelector("#tbc-clone__chzzkui");

// 	if (chatList) {
// 		const observer = new MutationObserver((mutations) => {
// 			mutations.forEach((mutation) => {
// 				mutation.addedNodes.forEach((node) => {
// 					if (!(node instanceof HTMLElement)) return;

// 					// 도네이션 컨테이너 찾기
// 					const donationContainer = node.querySelector('div[class^="live_chatting_donation_message_container__"]');
// 					if (donationContainer) {
// 						const nameEl = donationContainer.querySelector('div[class^="live_chatting_donation_message_header__"]');
// 						const textEl = donationContainer.querySelector('p[class^="live_chatting_donation_message_text__"]');
// 						const amountEl = donationContainer.querySelector('div[class^="live_chatting_donation_message_bottom__"]');

// 						const name = nameEl?.textContent?.trim() ?? "";
// 						const text = textEl?.textContent?.trim() ?? "";
// 						const amount = amountEl?.textContent?.trim() ?? "";

// 						// 일반 채팅 형식으로 변환 (필요에 맞게 마크업 수정 가능)
// 						const newChat = document.createElement("div");
// 						newChat.className = "custom_normal_chat";
// 						newChat.textContent = `[${name}] ${text} (${amount})`;

// 						// 기존 도네이션 메시지 대신 새 채팅 노드 삽입
// 						node.innerHTML = "";
// 						node.appendChild(newChat);
// 					}
// 				});
// 			});
// 		});

// 		observer.observe(chatList, { childList: true, subtree: true });
// 	}
// }

// function injectReloadButton() {
// 	const container = document.querySelector(".pzp-pc__bottom-buttons-left");
// 	if (!container) return;

// 	// 이미 버튼이 있으면 중복 추가하지 않음
// 	if (container.querySelector(".stelcount-video-reload-btn")) return;

// 	const btn = document.createElement("button");
// 	btn.className = "pzp-button pzp-playback-switch pzp-pc-ui-button pzp-pc__playback-switch stelcount-video-reload-btn";
// 	btn.ariaLabel = "영상 새로고침";
// 	// 간단한 새로고침 아이콘 (SVG)
// 	btn.innerHTML = `
// 	 <span class="pzp-button__tooltip pzp-button__tooltip--top">영상 새로고침</span>
//     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 24 24">
//       <path d="M12 6V3L8 7l4 4V8c2.757 0 5 2.243 5 5a5 5 0 0 1-9.584 2H5.26A7.002 7.002 0 0 0 12 20c3.86 0 7-3.14 7-7s-3.14-7-7-7z"/>
//     </svg>
//   `;

// 	// 버튼 클릭 시 영상 리로드
// 	btn.addEventListener("click", () => {
// 		const oldVideo = document.querySelector("video.webplayer-internal-video");
// 		if (!oldVideo) return;

// 		// const currentTime = oldVideo.currentTime;
// 		const newVideo = oldVideo.cloneNode(true);
// 		oldVideo.parentNode.replaceChild(newVideo, oldVideo);

// 		// newVideo.addEventListener("loadedmetadata", () => {
// 		// 	newVideo.currentTime = currentTime;
// 		// 	newVideo.play().catch(() => {});
// 		// });
// 	});

// 	container.appendChild(btn);
// }

// // DOM이 준비되면 실행
// // const observer = new MutationObserver(() => {
// // 	injectReloadButton();
// // });
// // observer.observe(document.body, { childList: true, subtree: true });
