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

// fetchFollowings를 팝업 쪽으로 전송
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "fetchFollowings") {
		fetchFollowings()
			.then((data) => sendResponse({ success: true, data }))
			.catch((error) => sendResponse({ success: false, error: error.message }));
		return true;
	}
});

async function fetchFollowings() {
	try {
		const cookies = await Promise.all(
			COOKIES.map(({ name, url }) =>
				browser.cookies.get({ name, url }).catch((err) => {
					console.error(`쿠키(${name})를 가져오는 중 문제 발생`, err);
					return null;
				})
			)
		);

		const missingCookies = cookies.filter((c) => !c);
		if (missingCookies.length > 0) {
			throw new Error(
				"일부 쿠키를 가져오지 못함. 기존에 네이버 로그인 된 상태에서도 본 에러가 발생한다면 개발자에게 문의 바랍니다."
			);
		}

		const api = `https://api.chzzk.naver.com/service/v1/channels/followings${objectToUrlParams({
			page: 0,
			size: 505,
			sortType: "FOLLOW",
			subscription: false,
			followerCount: false,
		})}`;

		const [aut, ses] = cookies;

		const NID_AUT = aut.value;
		const NID_SES = ses.value;

		const response = await fetch(api, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				Cookie: `NID_AUT=${NID_AUT}; NID_SES=${NID_SES}`,
			},
			credentials: "include",
		});

		if (!response.ok) {
			throw new Error(`API 요청 실패: ${response.status}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error(error);
	}
}

function objectToUrlParams(object) {
	const params = Object.entries(object)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join("&");
	return `?${params}`;
}
