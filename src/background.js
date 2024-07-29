// 저작권 © jebibot 2024-
// 이 코드는 MIT 라이선스에 따라 배포됩니다.
// 라이선스 사본은 프로젝트 루트에서 확인할 수 있습니다.

// Copyright (c) 2024 jebibot
// This file is licensed under the MIT License.
// See the LICENSE file in the project root for more information.

const COOKIES = [
	{
		name: "NID_AUT",
		domain: ".naver.com",
		url: "https://nid.naver.com/nidlogin.login",
	},
	{
		name: "NID_SES",
		domain: ".naver.com",
		url: "https://nid.naver.com/nidlogin.login",
	},
];

const checkPermission = async () => {
	const granted = await chrome.permissions.contains({
		origins: ["*://*.stelcount.fans/*", "*://*.naver.com/*", "*://*.chzzk.naver.com/*"],
	});
	if (!granted) {
		chrome.tabs.create({
			url: chrome.runtime.getURL("permission.html"),
		});
	}
	return granted;
};

const setPartitonedCookie = async (cookie, url) => {
	const partitionKey = { topLevelSite: "https://stelcount.fans" };
	if (cookie.partitionKey != null) {
		return;
	}
	delete cookie.hostOnly;
	delete cookie.session;
	await chrome.cookies.set({
		...cookie,
		sameSite: chrome.cookies.SameSiteStatus.NO_RESTRICTION,
		secure: true,
		url,
		partitionKey,
	});
};

chrome.runtime.onInstalled.addListener(checkPermission);
chrome.runtime.onStartup.addListener(async () => {
	const granted = await checkPermission();
	if (!granted) {
		return;
	}
	for (const { name, url } of COOKIES) {
		const cookie = await chrome.cookies.get({ name, url });
		if (cookie != null) {
			await setPartitonedCookie(cookie, url);
		}
	}
});

chrome.permissions.onRemoved.addListener(checkPermission);

chrome.storage.local.onChanged.addListener(({ streams }) => {
	if (streams != null) {
		chrome.action.setBadgeBackgroundColor({ color: "#737373" });
		chrome.action.setBadgeText({ text: `${streams.newValue.length}` });
	}
});

chrome.cookies.onChanged.addListener(async ({ cookie, removed }) => {
	if (removed) {
		return;
	}
	for (const { name, domain, url } of COOKIES) {
		if (cookie.name === name && cookie.domain === domain && cookie.partitionKey == null) {
			await setPartitonedCookie(cookie, url);
			break;
		}
	}
});

chrome.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
	if (request.message === "isInstalled") {
		sendResponse({ installed: true });
	}
	if (request.message === "versionInfo") {
		sendResponse({ version: "1.1.0" });
	}
});
