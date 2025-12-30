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
				let value = state.memoizedState;
				if (state.queue?.pending?.hasEagerState) {
					value = state.queue.pending.eagerState;
				} else if (state.baseQueue?.hasEagerState) {
					value = state.baseQueue.eagerState;
				}
				if (value != null && criteria(value)) {
					return raw ? state : value;
				}
				state = state.next;
			}
			fiber = fiber.return;
		}
	};

	const root = document.getElementById("root");
	const waiting = [];
	const rootObserver = new MutationObserver((mutations) => {
		if (!waiting.length) {
			return;
		}
		for (const mutation of mutations) {
			for (const n of mutation.addedNodes) {
				if (n.querySelector == null) {
					continue;
				}
				for (const elem of waiting) {
					const node = n.querySelector(elem.query);
					if (node != null) {
						elem.resolve(node);
					}
				}
			}
		}
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
			if (node.className.startsWith("live_")) {
				return attachLiveObserver(node);
			}
		};

		const layoutBody = await waitFor("#layout-body");
		if (layoutBody == null) {
			return;
		}
		const layoutBodyObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const n of mutation.addedNodes) {
					if (n.querySelector != null) {
						init(n.tagName === "SECTION" ? n : n.querySelector("section"));
					}
				}
			}
		});
		layoutBodyObserver.observe(layoutBody, { childList: true });

		await init(layoutBody.querySelector("section"));
	};

	const attachPlayerObserver = async (node, isLive, tries = 0) => {
		if (node == null) {
			return;
		}
		const playerLayout = node.querySelector(isLive ? "#live_player_layout" : "#player_layout");
		if (playerLayout == null) {
			if (tries > 500) {
				return;
			}
			return new Promise((r) => setTimeout(r, 50)).then(() => attachPlayerObserver(node, isLive, tries + 1));
		}
		const playerObserver = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				for (const n of mutation.addedNodes) {
					if (!n.className.startsWith("pip_player_")) {
						initPlayerFeatures(n, isLive);
					}
				}
			}
		});
		playerObserver.observe(playerLayout.parentNode, { childList: true });

		await initPlayerFeatures(playerLayout, isLive);
	};

	const initPlayerFeatures = async (node, isLive) => {
		if (node == null) {
			return;
		}

		const runClicks = async () => {
			const delay = 300;
			try {
				const result = await new Promise((res) => setTimeout(res, delay));
				await clickWideButtonWithInterval(delay, document.querySelector(".pzp-viewmode-button"));
			} catch (error) {
				console.error(error);
			}
		};

		runClicks();

		// const setLiveWide = await findReactState(
		// 	node,
		// 	(state) => state[0]?.length === 1 && state[1]?.length === 2 && state[1]?.[1]?.key === "isLiveWide"
		// );
		// setLiveWide?.[0](true);
	};

	const initChatFeatures = async (chattingContainer) => {
		if (chattingContainer == null) {
			return;
		}

		const runClicks = async () => {
			const delay = 300;
			try {
				const result = await new Promise((res) => setTimeout(res, delay));
				await clickButtonWithInterval(
					delay,
					chattingContainer.querySelector(
						'[class*="live_chatting_header_fold__"] > [class^="live_chatting_header_button__"]'
					)
				);
			} catch (error) {
				console.error(error);
			}
		};

		runClicks();
	};

	const attachLiveObserver = (node) => {
		if (node == null) {
			return;
		}
		const wrapper = node.querySelector('[class^="live_wrapper__"]');
		if (wrapper != null) {
			const liveObserver = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const n of mutation.addedNodes) {
						if (n.tagName === "ASIDE") {
							initChatFeatures(n);
						}
					}
				}
			});
			liveObserver.observe(wrapper, { childList: true });
		}

		const player = node.querySelector('[class^="live_information_player__"]');
		if (player != null) {
			const playerObserver = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const n of mutation.addedNodes) {
						if (n.className?.startsWith?.("live_information_video_container__")) {
							attachPlayerObserver(n, true);
						}
					}
				}
			});
			playerObserver.observe(player, { childList: true });
		}

		return Promise.all([
			attachPlayerObserver(node.querySelector('[class^="live_information_video_container__"]'), true),
			initChatFeatures(node.querySelector("aside")),
		]);
	};

	function clickButtonWithInterval(delay, node) {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			const interval = setInterval(() => {
				const button = node;

				if (button) {
					button.click();
					clearInterval(interval);
					resolve(`지연 ${delay}ms 후 클릭 성공`);
				} else if (Date.now() - startTime > delay + 3500) {
					clearInterval(interval);
					reject(`지연 ${delay}ms 후 클릭 실패`);
				}
			}, 500); // 500ms마다 버튼 존재 여부 확인
		});
	}

	function clickWideButtonWithInterval(delay, node) {
		return new Promise((resolve, reject) => {
			const startTime = Date.now();

			const interval = setInterval(() => {
				const button = node;
				const label = button.getAttribute("aria-label");
				if (label === "넓은 화면") {
					button.click();
					clearInterval(interval);
					resolve(`지연 ${delay}ms 후 클릭 성공`);
				} else if (Date.now() - startTime > delay + 3500) {
					clearInterval(interval);
					reject(`지연 ${delay}ms 후 클릭 실패`);
				}
			}, 500); // 500ms마다 버튼 존재 여부 확인
		});
	}

	(async () => {
		if (!location.pathname.endsWith("/chat")) {
			await attachBodyObserver();
		}
		rootObserver.disconnect();
	})();

	//? 고정챗 래퍼 접기
	const CONTAINER_SELECTOR = '[class^="live_chatting_list_container__"]';
	const CHAT_SELECTOR = '[class^="live_chatting_list_fixed__"]';
	const BTN_ID = "chat-collapse-toggle-btn";
	const STORAGE_KEY = "chat-collapsed";

	let originalDisplay = "";

	function findContainer() {
		return document.querySelector(CONTAINER_SELECTOR);
	}

	function findChatWrapper(container) {
		return container?.querySelector(CHAT_SELECTOR);
	}

	function isCollapsed() {
		return localStorage.getItem(STORAGE_KEY) === "true";
	}

	function setCollapsed(value) {
		localStorage.setItem(STORAGE_KEY, String(value));
	}

	function applyState(chatWrapper, btn) {
		if (!originalDisplay) {
			originalDisplay = getComputedStyle(chatWrapper).display;
		}

		if (isCollapsed()) {
			chatWrapper.style.display = "none";
			btn.textContent = "+";
		} else {
			chatWrapper.style.display = originalDisplay;
			btn.textContent = "-";
		}
	}

	function toggleChat(chatWrapper, btn) {
		const nextState = !isCollapsed();
		setCollapsed(nextState);
		applyState(chatWrapper, btn);
	}

	function createToggleButton(container, chatWrapper) {
		if (container.querySelector(`#${BTN_ID}`)) return;

		// container 기준 positioning
		const containerStyle = getComputedStyle(container);
		if (containerStyle.position === "static") {
			container.style.position = "relative";
		}

		const btn = document.createElement("button");
		btn.id = BTN_ID;

		Object.assign(btn.style, {
			position: "absolute",
			top: "81px",
			left: "4px",
			width: "18px",
			height: "18px",
			padding: "0",
			lineHeight: "18px",
			textAlign: "center",
			fontSize: "14px",
			background: "rgba(0,0,0,0.6)",
			color: "#fff",
			border: "none",
			borderRadius: "4px",
			cursor: "pointer",
			zIndex: 10,
			userSelect: "none",
		});

		/* ===============================
       Tooltip (선택 / 독립 적용)
       =============================== */
		btn.title = "상단 접기 / 펼치기";

		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			toggleChat(chatWrapper, btn);
		});

		container.appendChild(btn);

		// 초기 상태 적용 (localStorage 기반)
		applyState(chatWrapper, btn);
	}

	// SPA 대응
	const observer = new MutationObserver(() => {
		const container = findContainer();
		if (!container) return;

		const chatWrapper = findChatWrapper(container);
		if (!chatWrapper) return;

		createToggleButton(container, chatWrapper);
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
})();
