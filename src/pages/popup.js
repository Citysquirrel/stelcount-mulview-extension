const browser = window.browser || window.chrome;

document.getElementById("goto").addEventListener("click", () => {
	browser.tabs.create({
		url: "https://stelcount.fans/multiview",
	});
});

// document.getElementById("fetch-followings").addEventListener("click", () => {
// 	const followingsDiv = document.getElementById("followings");
// 	followingsDiv.innerHTML = "불러오는 중...";

// 	// background.js에 메시지 전송
// 	chrome.runtime.sendMessage({ action: "fetchFollowings" }, (response) => {
// 		if (response.success) {
// 			displayFollowings(response.data);
// 		} else {
// 			followingsDiv.innerHTML = `<p class="error">에러 발생: 네이버에 로그인 되어 있는지 확인해주세요</p>`;
// 		}
// 	});
// });

// //? 설정 저장
// document.addEventListener("DOMContentLoaded", async () => {
// 	const enableSubIconToFront = document.getElementById("enableSubIconToFront");
// 	const enableDonationToChat = document.getElementById("enableDonationToChat");

// 	// 저장된 체크 상태 불러오기
// 	chrome.storage.sync.get("subconToFront", (data) => {
// 		enableSubIconToFront.checked = data.subconToFront || false;
// 	});
// 	chrome.storage.sync.get("donationToChat", (data) => {
// 		enableSubIconToFront.checked = data.donationToChat || false;
// 	});

// 	// 체크 상태 변경 시 저장
// 	enableSubIconToFront.addEventListener("change", () => {
// 		chrome.storage.sync.set({ subconToFront: enableSubIconToFront.checked });
// 	});
// 	enableDonationToChat.addEventListener("change", () => {
// 		chrome.storage.sync.set({ donationToChat: enableDonationToChat.checked });
// 	});
// });

// function displayFollowings(data) {
// 	const followingsDiv = document.getElementById("followings");
// 	followingsDiv.innerHTML = "";

// 	if (!data || data.code !== 200 || !data.content) {
// 		followingsDiv.innerHTML = "<p>네트워크 오류</p>";
// 		return;
// 	}

// 	const { followingList } = data.content;

// 	if (followingList.length === 0) {
// 		followingsDiv.textContent = "팔로우한 채널이 없습니다.";
// 		return;
// 	}

// 	followingList
// 		.sort((a, b) => (a.streamer.openLive ? -1 : 1) - (b.streamer.openLive ? -1 : 1))
// 		.forEach((following) => {
// 			const { channel, streamer, liveInfo } = following;
// 			const channelName = channel.channelName || "알 수 없는 채널";
// 			const channelImageUrl = channel.channelImageUrl;

// 			const followingWrapper = document.createElement("div");
// 			followingWrapper.className = "following";

// 			// Wrapper: 이미지, 채널명 및 라이브 여부
// 			const followingInfo = document.createElement("div");
// 			followingInfo.className = "following-info";

// 			// 프로필 이미지
// 			const liveProfileImage = document.createElement("img");
// 			liveProfileImage.src = channelImageUrl;
// 			liveProfileImage.className = "following-image";

// 			followingInfo.appendChild(liveProfileImage);

// 			// 채널명
// 			const followingName = document.createElement("span");
// 			followingName.className = "following-name";
// 			followingName.textContent = channelName;

// 			followingInfo.appendChild(followingName);

// 			// 라이브 여부

// 			const liveIndicator = document.createElement("span");
// 			liveIndicator.className = "live-dot";
// 			liveIndicator.textContent = "●";
// 			if (streamer.openLive) {
// 				liveIndicator.classList.add("is-live");
// 			}
// 			followingInfo.appendChild(liveIndicator);

// 			// 라이브 타이틀
// 			const liveTitle = document.createElement("div");
// 			liveTitle.className = "following-live_title";
// 			liveTitle.textContent = liveInfo.liveTitle ? `${liveInfo.liveTitle}` : "방송 종료됨";

// 			followingWrapper.appendChild(followingInfo);
// 			followingWrapper.appendChild(liveTitle);

// 			followingsDiv.appendChild(followingWrapper);

// 			// 업로드 svg
// 			const uploadImageWrapper = document.createElement("div");
// 			uploadImageWrapper.classList = "following-upload-image";
// 			uploadImageWrapper.innerHTML = `<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round" height="200px" width="200px" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>`;

// 			followingWrapper.appendChild(uploadImageWrapper);
// 		});
// }
