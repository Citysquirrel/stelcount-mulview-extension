export function sendToPage(type, payload) {
	window.postMessage(
		{
			__STELCOUNT__: true,
			type,
			payload,
		},
		"*",
	);
}

export function sendSettings(settings) {
	sendToPage("SETTINGS_UPDATE", settings);
}
