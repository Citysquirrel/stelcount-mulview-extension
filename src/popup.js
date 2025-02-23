const browser = window.browser || window.chrome;

document.getElementById("goto").addEventListener("click", () => {
	browser.tabs.create({
		url: "https://stelcount.fans/multiview",
	});
});

document.getElementById("fetchFollowings").addEventListener("click", () => {
	const followingsDiv = document.getElementById("followings");
	followingsDiv.innerHTML = "불러오는 중...";

	// background.js에 메시지 전송
	chrome.runtime.sendMessage({ action: "fetchFollowings" }, (response) => {
		if (response.success) {
			displayFollowings(response.data);
		} else {
			followingsDiv.innerHTML = `<p class="error">에러 발생: 네이버에 로그인 되어 있는지 확인해주세요</p>`;
		}
	});
});

function displayFollowings(data) {
	const followingsDiv = document.getElementById("followings");
	followingsDiv.innerHTML = "";

	if (!data || data.code !== 200 || !data.content) {
		followingsDiv.innerHTML = "<p>팔로우 목록이 없습니다.</p>";
		return;
	}

	const { followingList } = data.content;

	if (followingList.length === 0) {
		container.textContent = "팔로우한 채널이 없습니다.";
		return;
	}

	followingList.forEach((following) => {
		const { channel, streamer, liveInfo } = following;
		const channelName = channel.channelName || "알 수 없는 채널";

		const div = document.createElement("div");
		div.className = "following";

		// 채널명 및 라이브 여부
		const title = document.createElement("h3");
		title.textContent = channelName;

		// 라이브 여부

		const liveIndicator = document.createElement("span");
		liveIndicator.className = "live-dot";
		liveIndicator.textContent = "●";
		if (streamer.openLive) {
			liveIndicator.classList.add = "is-live";
		}
		title.appendChild(liveIndicator);

		// 라이브 타이틀
		const liveTitle = document.createElement("p");
		liveTitle.textContent = liveInfo.liveTitle ? `제목: ${liveInfo.liveTitle}` : "라이브 제목 없음";

		div.appendChild(title);
		div.appendChild(liveTitle);

		container.appendChild(div);

		/**	*	팔로워 API 응답 데이터 구조
 		interface Followings {
			code: number;
			message: string | null;
			content?: FollowingsContent;
		}

		interface FollowingsContent {
			totalCount: number;
			totalPage: number;
			followingList: FollowingList[];
		}

		interface FollowingList {
			channelId: string;
			channel: ChannelDetail & { personalData: PersonalData };
			streamer: { openLive: boolean };
			liveInfo: { liveTitle: string | null, concurrentUserCount: number, liveCategoryValue: string };
		} 

		interface ChannelDetail {
			channelId: string | null;
			channelName: string;
			channelImageUrl: string | null;
			verifiedMark: boolean;
		}
*/
	});
}
