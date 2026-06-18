const browser = self.browser || self.chrome;

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

browser.runtime.onInstalled.addListener((details) => {
	if (details.reason === "update") {
		browser.notifications.create({
			type: "basic",
			iconUrl: browser.runtime.getURL("images/icon.png"),
			title: "새로운 업데이트!",
			message: "확장이 최신 버전으로 업데이트되었습니다. 변경 사항을 확인하세요.",
		});
	}
});

browser.notifications.onClicked.addListener((notificationId) => {
	browser.notifications.clear(notificationId, () => {
		const extensionId = "aldeieecngphbbepbpljdafgibcfmima";
		const storeUrl = `https://chrome.google.com/webstore/detail/${extensionId}`;
		browser.tabs.create({ url: storeUrl });
	});
});

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

// 캐시 및 요청 잠금을 위한 최상위 변수 (백그라운드가 살아있는 동안 유지됨)
let fetchPromise = null;
const CACHE_KEY = "naverFollowingsCache";
const CACHE_EXPIRY = 1000 * 30; // 현재 30초

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === "fetchFollowings") {
		// 원본 함수에 영향이 없도록 제어 전용 비동기 함수로 위임
		handleFetchFollowingsWithLock(sendResponse);
		return true; // 비동기 응답(sendResponse)을 사용하기 위해 필수 반환
	}
});

async function handleFetchFollowingsWithLock(sendResponse) {
	try {
		// 요청 잠금 처리
		if (fetchPromise) {
			console.log("⏳ 이미 API 요청이 진행 중입니다. 기존 요청의 응답을 공유합니다.");
			const data = await fetchPromise;
			sendResponse({ success: true, data });
			return;
		}

		// 캐시 확인
		//! manifest.json에서의 "storage" 권한 확인할 것
		const storage = browser.storage?.session || browser.storage?.local;
		if (storage) {
			const cache = await storage.get(CACHE_KEY);
			const cachedData = cache[CACHE_KEY];

			if (cachedData && Date.now() - cachedData.timestamp < CACHE_EXPIRY) {
				console.log("✅ 유효한 캐시 데이터가 존재하여 통신 없이 즉시 반환합니다.");
				sendResponse({ success: true, data: cachedData.data });
				return;
			}
		}

		// 잠금 장치에 원본 함수의 Promise 할당
		fetchPromise = fetchFollowings();

		// Promise 결과를 대기
		const data = await fetchPromise;

		// 캐시 저장
		if (data && storage) {
			await storage.set({
				[CACHE_KEY]: {
					data: data,
					timestamp: Date.now(),
				},
			});
		}

		sendResponse({ success: true, data });
	} catch (error) {
		sendResponse({ success: false, error: error.message });
	} finally {
		// 다음 요청을 위해 잠금 해제
		fetchPromise = null;
	}
}

async function fetchFollowings() {
	const cookies = await Promise.all(
		COOKIES.map(({ name, url }) =>
			browser.cookies.get({ name, url }).catch((err) => {
				console.error(`쿠키(${name})를 가져오는 중 문제 발생`, err);
				return null;
			}),
		),
	);

	const missingCookies = cookies.filter((c) => !c);
	if (missingCookies.length > 0) {
		throw new Error(
			"일부 쿠키를 가져오지 못함. 기존에 네이버 로그인 된 상태에서도 본 에러가 발생한다면 개발자에게 문의 바랍니다.",
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
		},
		credentials: "include",
	});

	if (!response.ok) {
		throw new Error(`API 요청 실패: ${response.status}`);
	}

	const data = await response.json();
	return data;
}

function objectToUrlParams(object) {
	const params = Object.entries(object)
		.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		.join("&");
	return `?${params}`;
}
