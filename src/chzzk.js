// 저작권 © jebibot 2024-
// 이 코드는 MIT 라이선스에 따라 배포됩니다.
// 라이선스 사본은 프로젝트 루트에서 확인할 수 있습니다.

// Copyright (c) 2024 jebibot
// This file is licensed under the MIT License.
// See the LICENSE file in the project root for more information.

(() => {
	const getReactFiber = (node) => {
		if (node == null) {
			return;
		}
		return Object.entries(node).find(([k]) => k.startsWith("__reactFiber$"))?.[1];
	};

	const findReactState = async (node, criteria, raw = false, tries = 0) => {
		if (node == null) {
			return;
		}
		let fiber = getReactFiber(node);
		if (fiber == null) {
			if (tries > 500) {
				return;
			}
			return new Promise((r) => setTimeout(r, 50)).then(() => findReactState(node, criteria, raw, tries + 1));
		}
		fiber = fiber.return;
		while (fiber != null) {
			let state = fiber.memoizedState;
			while (state != null) {
				if (state.memoizedState != null && criteria(state.memoizedState)) {
					return raw ? state : state.memoizedState;
				}
				state = state.next;
			}
			fiber = fiber.return;
		}
	};

	const root = document.getElementById("root");
	const waiting = [];
	const rootObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((n) => {
				for (const elem of waiting) {
					if (n.querySelector?.(elem.query)) {
						elem.resolve(n);
					}
				}
			});
		});
	});
	const waitFor = (query) => {
		const node = root.querySelector(query);
		if (node) {
			return Promise.resolve(node);
		}
		return Promise.race([
			new Promise((resolve) => {
				waiting.push({ query, resolve });
			}),
			new Promise((resolve) => {
				setTimeout(resolve, 10000);
			}),
		]);
	};
	rootObserver.observe(root, { childList: true, subtree: true });

	const attachBodyObserver = async () => {
		const init = async (node) => {
			if (node == null) {
				return;
			}
			const features = [];
			if (node.className.startsWith("live_")) {
				features.push(initPlayerFeatures(node, true));
				features.push(attachLiveObserver(node));
			} else if (node.className.startsWith("vod_")) {
				features.push(initPlayerFeatures(node, false));
			}
			return Promise.all(features);
		};

		const layoutBody = await waitFor("#layout-body");
		if (layoutBody == null) {
			return;
		}
		const layoutBodyObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((n) => {
					init(n.tagName === "SECTION" ? n : n.querySelector("section"));
				});
			});
		});
		layoutBodyObserver.observe(layoutBody, { childList: true });

		await init(layoutBody.querySelector("section"));
	};

	const initPlayerFeatures = async (node, isLive) => {
		if (node == null) {
			return;
		}
		const setLiveWide = await findReactState(
			isLive ? node.querySelector('[class^="live_information_player__"]') : node.querySelector("section"),
			(state) => state[0]?.length === 1 && state[1]?.length === 2 && state[1]?.[1]?.key === "isLiveWide"
		);
		setLiveWide?.[0](true);
	};

	const initChatFeatures = (chattingContainer) => {
		if (chattingContainer == null) {
			return;
		}

		const clickButtonWithInterval = (delay) => {
			return new Promise((resolve, reject) => {
				const startTime = Date.now();

				const interval = setInterval(() => {
					const button = chattingContainer.querySelector(
						'[class*="live_chatting_header_fold__"] > [class^="live_chatting_header_button__"]'
					);

					if (button) {
						button.click();
						// console.log(`클릭됨 (${delay}ms 지연):`, new Date().toLocaleTimeString());
						clearInterval(interval);
						resolve(`지연 ${delay}ms 후 클릭 성공`);
					} else if (Date.now() - startTime > delay + 3500) {
						// 3500ms 이후 자동 종료
						clearInterval(interval);
						// console.error(`지연 ${delay}ms 후 클릭 실패: 버튼을 찾을 수 없음`);
						reject(`지연 ${delay}ms 후 클릭 실패`);
					}
				}, 500); // 500ms마다 버튼 존재 여부 확인
			});
		};

		const runClicks = async () => {
			const delay = 300;
			try {
				const result = await new Promise((res) => setTimeout(res, delay));
				await clickButtonWithInterval(delay);
			} catch (error) {
				console.error(error);
			}
		};

		runClicks();
	};

	// const initVolumeFeatures =  (controllerContainer) => {
	// 	if(node == null){
	// 		return;
	// 	}
	// 	setTimeout(() => {
	// 		controllerContainer.querySelector('[class')
	// 	})
	// }

	const attachLiveObserver = (node) => {
		if (node == null) {
			return;
		}
		const liveObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((n) => {
					initChatFeatures(n.tagName === "ASIDE" ? n : n.querySelector("aside"));
				});
			});
		});
		liveObserver.observe(node, { childList: true });

		initChatFeatures(node.querySelector("aside"));
	};

	(async () => {
		if (!location.pathname.endsWith("/chat")) {
			await attachBodyObserver();
		}
		rootObserver.disconnect();
	})();
})();
