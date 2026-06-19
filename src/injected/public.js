//? 고정챗 래퍼 접기
(() => {
	// console.log("[StelCount] chat list button initializing...");
	const INIT_FLAG = "data-stc-chat-toggle-init";
	const CONTAINER_SELECTOR = [
		'[class^="live_chatting_list_container__"]',
		'div[class*="_container_"][role="log"]',
	].join(",");
	const CHAT_SELECTOR = ['[class^="live_chatting_list_fixed__"]', '[class*="_fixed_"]'].join(",");
	const BTN_ID = "stc-chat-collapse-toggle-btn";
	const STORAGE_KEY = "stc-chat-collapsed";

	function isCollapsed() {
		return localStorage.getItem(STORAGE_KEY) === "true";
	}

	function setCollapsed(value) {
		localStorage.setItem(STORAGE_KEY, String(value));
	}

	function applyState(chatWrapper, btn) {
		if (!chatWrapper.dataset.originalDisplay) {
			chatWrapper.dataset.originalDisplay = getComputedStyle(chatWrapper).display || "block";
		}

		if (isCollapsed()) {
			chatWrapper.style.display = "none";
			btn.textContent = "+";
		} else {
			chatWrapper.style.display = chatWrapper.dataset.originalDisplay;
			btn.textContent = "-";
		}
	}

	function createToggleButton(container) {
		if (container.querySelector(`#${BTN_ID}`)) return;

		if (getComputedStyle(container).position === "static") {
			container.style.position = "relative";
		}

		const btn = document.createElement("button");
		btn.id = BTN_ID;
		btn.textContent = isCollapsed() ? "+" : "-";

		Object.assign(btn.style, {
			position: "absolute",
			top: "4px",
			left: "4px",
			width: "18px",
			height: "18px",
			padding: "0",
			lineHeight: "18px",
			fontSize: "14px",
			background: "rgba(0,0,0,0.6)",
			color: "#fff",
			border: "none",
			borderRadius: "4px",
			cursor: "pointer",
			zIndex: 472,
		});

		btn.title = "채팅 접기 / 펼치기";

		btn.addEventListener("click", (e) => {
			e.stopPropagation();

			const chatWrapper = container.querySelector(CHAT_SELECTOR);
			if (!chatWrapper) return;

			setCollapsed(!isCollapsed());
			applyState(chatWrapper, btn);
		});

		container.appendChild(btn);
	}

	function init(container) {
		if (container.hasAttribute(INIT_FLAG)) return;

		const chatWrapper = container.querySelector(CHAT_SELECTOR);
		if (!chatWrapper) return;

		container.setAttribute(INIT_FLAG, "true");

		createToggleButton(container);
		const btn = container.querySelector(`#${BTN_ID}`);
		applyState(chatWrapper, btn);
	}

	// #region Observing
	const observer = new MutationObserver(() => {
		const container = document.querySelector(CONTAINER_SELECTOR);
		console.log(container);
		if (!container) return;

		const chatWrapper = container.querySelector(CHAT_SELECTOR);
		const btn = container.querySelector(`#${BTN_ID}`);

		// 채팅이 사라졌으면 init 플래그 리셋
		if (!chatWrapper) {
			if (btn) btn.remove(); // 버튼 제거
			if (container.hasAttribute(INIT_FLAG)) {
				container.removeAttribute(INIT_FLAG);
			}
			return;
		}

		// 채팅이 있고 아직 init 안 됐으면 초기화
		if (chatWrapper && !container.hasAttribute(INIT_FLAG)) {
			init(container);
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// #endregion

	// 상태 의존적이지 않도록 처리
	window.addEventListener("storage", (e) => {
		if (e.key !== STORAGE_KEY) return;

		const container = document.querySelector(CONTAINER_SELECTOR);
		if (!container) return;

		const chatWrapper = container.querySelector(CHAT_SELECTOR);
		const btn = container.querySelector(`#${BTN_ID}`);
		if (!chatWrapper || !btn) return;

		applyState(chatWrapper, btn);
	});
})();

//? 랭킹 끄기
(() => {
	// console.log("[StelCount] rank list button initializing...");
	const INIT_FLAG = "stc-data-ranking-toggle-init";
	const CONTAINER_SELECTOR = ['[class^="live_chatting_container__"]', "#aside-chatting"];
	const RANKING_SELECTOR = [
		'[class^="live_chatting_ranking_container__"]',
		'[class*="_container_"]:not([class*=" "]):has([class^="_ranking_button_"])',
	];

	const BTN_ID = "stc-rank-collapse-toggle-btn";
	const STORAGE_KEY = "stc-rank-collapsed";

	function isCollapsed() {
		return localStorage.getItem(STORAGE_KEY) === "true";
	}

	function setCollapsed(value) {
		localStorage.setItem(STORAGE_KEY, String(value));
	}

	function applyState(rankWrapper, btn) {
		if (!rankWrapper.dataset.originalDisplay) {
			rankWrapper.dataset.originalDisplay = getComputedStyle(rankWrapper).display || "block";
		}

		if (isCollapsed()) {
			rankWrapper.style.display = "none";
			btn.textContent = "+";
		} else {
			rankWrapper.style.display = rankWrapper.dataset.originalDisplay;
			btn.textContent = "-";
		}
	}

	function createToggleButton(container) {
		if (container.querySelector(`#${BTN_ID}`)) return;

		if (getComputedStyle(container).position === "static") {
			container.style.position = "relative";
		}

		const btn = document.createElement("button");
		btn.id = BTN_ID;
		btn.textContent = isCollapsed() ? "+" : "-";

		Object.assign(btn.style, {
			position: "absolute",
			top: "48px",
			right: "4px",
			width: "18px",
			height: "18px",
			padding: "0",
			lineHeight: "18px",
			fontSize: "14px",
			background: "rgba(0,0,0,0.6)",
			color: "#fff",
			border: "none",
			borderRadius: "4px",
			cursor: "pointer",
			zIndex: 472,
		});

		btn.title = "랭킹 접기 / 펼치기";

		btn.addEventListener("click", (e) => {
			e.stopPropagation();

			const rankWrapper = container.querySelector(RANKING_SELECTOR);
			if (!rankWrapper) return;

			setCollapsed(!isCollapsed());
			applyState(rankWrapper, btn);
		});

		container.appendChild(btn);
	}

	function init(container) {
		if (container.hasAttribute(INIT_FLAG)) return;

		const rankWrapper = container.querySelector(RANKING_SELECTOR);
		if (!rankWrapper) return;

		container.setAttribute(INIT_FLAG, "true");

		createToggleButton(container);
		const btn = container.querySelector(`#${BTN_ID}`);
		applyState(rankWrapper, btn);
	}

	// #region Observing
	const observer = new MutationObserver(() => {
		const container = document.querySelector(CONTAINER_SELECTOR);
		if (!container) return;

		const rankWrapper = container.querySelector(RANKING_SELECTOR);
		const btn = container.querySelector(`#${BTN_ID}`);

		// 채팅이 사라졌으면 init 플래그 리셋
		if (!rankWrapper) {
			if (btn) btn.remove(); // 버튼 제거
			if (container.hasAttribute(INIT_FLAG)) {
				container.removeAttribute(INIT_FLAG);
			}
			return;
		}

		// 채팅이 있고 아직 init 안 됐으면 초기화
		if (rankWrapper && !container.hasAttribute(INIT_FLAG)) {
			init(container);
		}
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// #endregion

	// 상태 의존적이지 않도록 처리
	window.addEventListener("storage", (e) => {
		if (e.key !== STORAGE_KEY) return;

		const container = document.querySelector(CONTAINER_SELECTOR);
		if (!container) return;

		const rankWrapper = container.querySelector(RANKING_SELECTOR);
		const btn = container.querySelector(`#${BTN_ID}`);
		if (!rankWrapper || !btn) return;

		applyState(rankWrapper, btn);
	});
})();
