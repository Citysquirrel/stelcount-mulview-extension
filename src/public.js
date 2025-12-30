// (() => {
// 	//? 고정챗 래퍼 접기
// 	const CONTAINER_SELECTOR = '[class^="live_chatting_list_container__"]';
// 	const CHAT_SELECTOR = '[class^="live_chatting_list_fixed__"]';
// 	const BTN_ID = "chat-collapse-toggle-btn";
// 	const STORAGE_KEY = "chat-collapsed";

// 	let originalDisplay = "";

// 	function findContainer() {
// 		return document.querySelector(CONTAINER_SELECTOR);
// 	}

// 	function findChatWrapper(container) {
// 		return container?.querySelector(CHAT_SELECTOR);
// 	}

// 	function isCollapsed() {
// 		return localStorage.getItem(STORAGE_KEY) === "true";
// 	}

// 	function setCollapsed(value) {
// 		localStorage.setItem(STORAGE_KEY, String(value));
// 	}

// 	function applyState(chatWrapper, btn) {
// 		if (!originalDisplay) {
// 			originalDisplay = getComputedStyle(chatWrapper).display;
// 		}

// 		if (isCollapsed()) {
// 			chatWrapper.style.display = "none";
// 			btn.textContent = "+";
// 		} else {
// 			chatWrapper.style.display = originalDisplay;
// 			btn.textContent = "-";
// 		}
// 	}

// 	function toggleChat(chatWrapper, btn) {
// 		const nextState = !isCollapsed();
// 		setCollapsed(nextState);
// 		applyState(chatWrapper, btn);
// 	}

// 	function createToggleButton(container, chatWrapper) {
// 		if (container.querySelector(`#${BTN_ID}`)) return;

// 		// container 기준 positioning
// 		const containerStyle = getComputedStyle(container);
// 		if (containerStyle.position === "static") {
// 			container.style.position = "relative";
// 		}

// 		const btn = document.createElement("button");
// 		btn.id = BTN_ID;

// 		Object.assign(btn.style, {
// 			position: "absolute",
// 			top: "81px",
// 			left: "4px",
// 			width: "18px",
// 			height: "18px",
// 			padding: "0",
// 			lineHeight: "18px",
// 			textAlign: "center",
// 			fontSize: "14px",
// 			background: "rgba(0,0,0,0.6)",
// 			color: "#fff",
// 			border: "none",
// 			borderRadius: "4px",
// 			cursor: "pointer",
// 			zIndex: 10,
// 			userSelect: "none",
// 		});

// 		/* ===============================
//        Tooltip (선택 / 독립 적용)
//        =============================== */
// 		btn.title = "상단 접기 / 펼치기";

// 		btn.addEventListener("click", (e) => {
// 			e.stopPropagation();
// 			toggleChat(chatWrapper, btn);
// 		});

// 		container.appendChild(btn);

// 		// 초기 상태 적용 (localStorage 기반)
// 		applyState(chatWrapper, btn);
// 	}

// 	// SPA 대응
// 	const observer = new MutationObserver(() => {
// 		const container = findContainer();
// 		if (!container) return;

// 		const chatWrapper = findChatWrapper(container);
// 		if (!chatWrapper) return;

// 		createToggleButton(container, chatWrapper);
// 	});

// 	observer.observe(document.body, {
// 		childList: true,
// 		subtree: true,
// 	});
// })();

(() => {
	const INIT_FLAG = "data-chat-toggle-init";
	const CONTAINER_SELECTOR = '[class^="live_chatting_list_container__"]';
	const CHAT_SELECTOR = '[class^="live_chatting_list_fixed__"]';
	const BTN_ID = "chat-collapse-toggle-btn";
	const STORAGE_KEY = "chat-collapsed";

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
			top: "81px",
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
			zIndex: 10,
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

	const observer = new MutationObserver(() => {
		const container = document.querySelector(CONTAINER_SELECTOR);
		if (!container) return;

		init(container);
	});

	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});
})();
