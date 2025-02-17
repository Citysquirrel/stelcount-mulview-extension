// 저작권 © jebibot 2024-
// 이 코드는 MIT 라이선스에 따라 배포됩니다.
// 라이선스 사본은 프로젝트 루트에서 확인할 수 있습니다.

// Copyright (c) 2024 jebibot
// This file is licensed under the MIT License.
// See the LICENSE file in the project root for more information.

const browser = window.browser || window.chrome;

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
	const granted = await browser.permissions.contains({
		origins: ["*://*.stelcount.fans/*", "*://*.naver.com/*", "*://*.chzzk.naver.com/*"],
	});
	if (!granted) {
		browser.tabs.create({
			url: browser.runtime.getURL("permission.html"),
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
	await browser.cookies.set({
		...cookie,
		sameSite: browser.cookies.SameSiteStatus.NO_RESTRICTION,
		secure: true,
		url,
		partitionKey,
	});
};

browser.runtime.onInstalled.addListener(checkPermission);
browser.runtime.onStartup.addListener(async () => {
	const granted = await checkPermission();
	if (!granted) {
		return;
	}
	for (const { name, url } of COOKIES) {
		const cookie = await browser.cookies.get({ name, url });
		if (cookie != null) {
			await setPartitonedCookie(cookie, url);
		}
	}
});

browser.permissions.onRemoved.addListener(checkPermission);

browser.storage.local.onChanged.addListener(({ streams }) => {
	if (streams != null) {
		browser.action.setBadgeBackgroundColor({ color: "#737373" });
		browser.action.setBadgeText({ text: `${streams.newValue.length}` });
	}
});

browser.cookies.onChanged.addListener(async ({ cookie, removed }) => {
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

browser.runtime.onMessageExternal.addListener((request, sender, sendResponse) => {
	if (request.message === "isInstalled") {
		sendResponse({ installed: true });
	}
	if (request.message === "versionInfo") {
		sendResponse({ version: "1.1.0" });
	}
});
