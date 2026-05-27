// ===== 브릿지 =====
const listeners = {};

function on(type, handler) {
	if (!listeners[type]) listeners[type] = [];
	listeners[type].push(handler);
}

function emit(type, payload) {
	const handlers = listeners[type];
	if (!handlers) return;
	handlers.forEach((fn) => fn(payload));
}

// 메시지 수신
window.addEventListener("message", (event) => {
	if (event.source !== window) return;

	const data = event.data;
	if (!data || data.__STELCOUNT__ !== true) return;

	emit(data.type, data.payload);
});

// ===== 기능 =====

// 예시 기능
let enabled = false;

function enableFeature() {
	if (enabled) return;
	enabled = true;

	console.log("[STELCOUNT] feature ON");
}

function disableFeature() {
	if (!enabled) return;
	enabled = false;

	console.log("[STELCOUNT] feature OFF");
}

// 설정 반영
on("SETTINGS_UPDATE", (settings) => {
	if (settings.newFeature) {
		enableFeature();
	} else {
		disableFeature();
	}
});
