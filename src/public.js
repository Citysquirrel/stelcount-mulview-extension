//? 고정챗 래퍼 접기
(() => {
	console.log("chat list button initializing...");
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

		const chatWrapper = container.querySelector(CHAT_SELECTOR);

		// 채팅이 사라졌으면 init 플래그 리셋
		if (!chatWrapper && container.hasAttribute(INIT_FLAG)) {
			container.removeAttribute(INIT_FLAG);
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
})();
