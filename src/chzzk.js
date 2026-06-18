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
			if (node.className.startsWith("_container")) {
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
	};

	const attachLiveObserver = (node) => {
		if (node == null) {
			return;
		}
		const wrapper = node.querySelector('[class^="_wrapper_"]');
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

		const player = node.querySelector('[class^="_player_"]');
		if (player != null) {
			const playerObserver = new MutationObserver((mutations) => {
				for (const mutation of mutations) {
					for (const n of mutation.addedNodes) {
						if (n.className?.startsWith?.("_contents_")) {
							attachPlayerObserver(n, true);
						}
					}
				}
			});
			playerObserver.observe(player, { childList: true });
		}

		return Promise.all([
			attachPlayerObserver(node.querySelector('[class^="_contents_"]'), true),
			initChatFeatures(node.querySelector("aside")),
		]);
	};

	const initChatFeatures = async (chattingContainer) => {
		if (!chattingContainer) return;

		const SELECTOR = '[class*="_fold_"] > [class^="_button_"]';

		let executed = false;

		const waitForButton = (root, selector, timeout = 7000) =>
			new Promise((resolve, reject) => {
				if (executed) return; // 이미 처리됐으면 아무것도 안 함

				const found = root.querySelector(selector);
				if (found) return resolve(found);

				const observer = new MutationObserver(() => {
					if (executed) {
						observer.disconnect();
						return;
					}

					const el = root.querySelector(selector);
					if (el) {
						observer.disconnect();
						resolve(el);
					}
				});

				observer.observe(root, { childList: true, subtree: true });

				setTimeout(() => {
					observer.disconnect();
					reject("[StelCount] 채팅 토글 버튼 탐색 타임아웃");
				}, timeout);
			});

		try {
			const button = await waitForButton(chattingContainer, SELECTOR);
			if (!button || executed) return;

			const isOpened = !button.classList.contains("folded");

			// 이미 닫혀 있어도 처리 완료로 간주
			executed = true;

			if (isOpened) {
				button.click();
				console.log("[StelCount] 채팅창 자동 닫기 완료");
			}
		} catch (e) {
			console.warn("[StelCount] 채팅창 자동 닫기 실패:", e);
		}
	};

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

	//! 통나무 자동 클릭
	const LOG_PREFIX = "[StelCount]";
	const REWARD_NAME = "통나무";

	// 이후 확장을 위한 로그 함수
	function log(message, extra = null) {
		if (extra) {
			console.log(`${LOG_PREFIX} ${message}`, extra);
		} else {
			console.log(`${LOG_PREFIX} ${message}`);
		}
		// TODO: 로그 저장
		// chrome.storage.local.get({ logs: [] }, ({ logs }) => {
		//   chrome.storage.local.set({ logs: [...logs, entry] });
		// });
	}

	// 통나무 클릭
	function clickReward(button) {
		if (!(button instanceof HTMLButtonElement)) return;
		if (button.disabled) return;

		button.click();

		log(`${REWARD_NAME} 수집 완료`);
	}

	//
	document.querySelectorAll('button[class^="live_chatting_power_button_"]').forEach(clickReward);

	// 통나무 버튼 추적
	const observer = new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;

				// 버튼 자체가 추가된 경우
				if (node.matches?.('button[class^="live_chatting_power_button_"]')) {
					clickReward(node);
				}

				// 부모에 묻어서 같이 추가된 경우
				node.querySelectorAll?.('button[class^="live_chatting_power_button_"]').forEach(clickReward);
			}
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	log("통나무 자동 수령 시작..");

	(async () => {
		if (!location.pathname.endsWith("/chat")) {
			await attachBodyObserver();
		}
		rootObserver.disconnect();
	})();
})();
