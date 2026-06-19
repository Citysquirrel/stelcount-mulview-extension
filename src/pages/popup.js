//! 배포시 반드시 false
const IS_DEV = true;

const MATCH_URL = IS_DEV ? "*://localhost/*" : "*://stelcount.fans/*";
const BASE_URL = IS_DEV ? "https://localhost:5173/multiview" : "https://stelcount.fans/multiview";

let cachedFollowers = [];

document.addEventListener("DOMContentLoaded", () => {
	initTabs();
	initAccordion();
	setupEventListeners();
	fetchFollowers();
});

//? UI 컨트롤 로직 (탭 & 아코디언)
function initTabs() {
	const tabBtns = document.querySelectorAll(".tab-btn");
	const tabContents = document.querySelectorAll(".tab-content");

	tabBtns.forEach((btn) => {
		btn.addEventListener("click", () => {
			tabBtns.forEach((b) => b.classList.remove("active"));
			tabContents.forEach((c) => c.classList.remove("active"));

			btn.classList.add("active");
			const targetId = btn.getAttribute("data-target");
			document.getElementById(targetId).classList.add("active");
		});
	});
}

function initAccordion() {
	const headers = document.querySelectorAll(".accordion-header");

	headers.forEach((header) => {
		header.addEventListener("click", () => {
			const item = header.parentElement;
			const isActive = item.classList.contains("active");

			document.querySelectorAll(".accordion-item").forEach((i) => i.classList.remove("active"));

			if (!isActive) {
				item.classList.add("active");
			}
		});
	});
}

//? 데이터 로딩 및 렌더링
function fetchFollowers() {
	const statusText = document.getElementById("loading-status");
	const selectAllCheckbox = document.getElementById("select-all");

	chrome.runtime.sendMessage({ action: "fetchFollowings" }, (response) => {
		if (chrome.runtime.lastError || !response || response.data?.code !== 200) {
			statusText.textContent = response.error === "쿠키 없음" ? "로그인 정보 없음" : "불러오기 실패";
			statusText.style.color = "#ef4444";
			return;
		}

		const followingList = response.data.content.followingList || [];

		// 방송 상태에 따라 우선 정렬
		followingList.sort((a, b) => {
			if (a.streamer?.openLive === b.streamer?.openLive) return 0;
			return a.streamer?.openLive ? -1 : 1;
		});

		// 전역변수에 저장은 여기!
		cachedFollowers = followingList;

		renderFollowerList(followingList);

		statusText.textContent = "불러오기 완료";
		selectAllCheckbox.disabled = false;
		setTimeout(() => {
			statusText.style.display = "none";
		}, 1500);
	});
}

function renderFollowerList(list) {
	const listContainer = document.getElementById("follower-list");
	listContainer.innerHTML = "";

	if (list.length === 0) {
		listContainer.innerHTML =
			'<li style="padding: 16px; text-align: center; color: var(--text-sub); font-size:12px;">팔로우 중인 스트리머가 없습니다.</li>';
		return;
	}

	list.forEach((item) => {
		const { channelId, channel } = item;
		const isLive = item.streamer?.openLive ?? false;
		const liveInfo = item.liveInfo || {};

		const li = document.createElement("li");
		li.className = `follower-item ${isLive ? "live" : "offline"}`;
		li.dataset.channelId = channelId;

		li.innerHTML = `
            <input type="checkbox" class="item-checkbox" value="${channelId}">
            <img class="profile-img" src="${channel.channelImageUrl ? channel.channelImageUrl + "?type=f40_40_na" : "../../images/default_profile.png"}" alt="profile">
            <div class="stream-info">
                <div class="stream-header">
                    <span class="streamer-name">${channel.channelName}</span>
                    ${isLive ? `<span class="live-badge">LIVE</span>` : ""}
                </div>
                <div class="stream-title">${isLive && liveInfo.liveTitle ? liveInfo.liveTitle : "오프라인"}</div>
                ${isLive && liveInfo.liveCategoryValue ? `<div class="category-badge">${liveInfo.liveCategoryValue}</div>` : ""}
            </div>
        `;

		// 아이템 행 전체 클릭 처리
		li.addEventListener("click", (e) => {
			if (e.target.type !== "checkbox") {
				const checkbox = li.querySelector(".item-checkbox");
				checkbox.checked = !checkbox.checked;
				updateSelectionState();
			}
		});

		listContainer.appendChild(li);
	});

	// 개별 체크박스 상태 변경 이벤트
	document.querySelectorAll(".item-checkbox").forEach((box) => {
		box.addEventListener("change", updateSelectionState);
	});
}

//? 이벤트 리스너 통합 (검색, 체크, 전송 버튼)
function setupEventListeners() {
	const searchInput = document.getElementById("search-input");
	const selectAllCheckbox = document.getElementById("select-all");
	const syncSiteBtn = document.getElementById("sync-site-btn");
	const newTabBtn = document.getElementById("new-tab-btn");
	const headerShortcutBtn = document.getElementById("header-shortcut-btn");

	// 검색 인풋 입력시마다 리스트 필터링
	if (searchInput) {
		searchInput.addEventListener("input", (e) => {
			const keyword = e.target.value.toLowerCase().trim();
			const items = document.querySelectorAll(".follower-item");

			items.forEach((item) => {
				const name = item.querySelector(".streamer-name").textContent.toLowerCase();
				if (name.includes(keyword)) {
					item.classList.remove("hidden");
				} else {
					item.classList.add("hidden");
				}
			});
			updateSelectionState();
		});
	}

	// 헤더: 멀티뷰 사이트 열기
	if (headerShortcutBtn) {
		headerShortcutBtn.addEventListener("click", () => {
			chrome.tabs.create({ url: BASE_URL });
		});
	}

	// 전체선택: 검색된 항목만 토글
	if (selectAllCheckbox) {
		selectAllCheckbox.addEventListener("change", (e) => {
			const isChecked = e.target.checked;
			const visibleCheckboxes = document.querySelectorAll(".follower-item:not(.hidden) .item-checkbox");

			visibleCheckboxes.forEach((box) => {
				box.checked = isChecked;
			});
			updateSelectionState();
		});
	}

	// 기존 탭 동기화 전송
	if (syncSiteBtn) {
		syncSiteBtn.addEventListener("click", () => {
			const selectedStreams = getSelectedStreams();
			if (selectedStreams.length === 0) return;

			chrome.tabs.query({ url: MATCH_URL }, (tabs) => {
				if (tabs && tabs.length > 0) {
					const targetTab = tabs[0];
					chrome.tabs.sendMessage(
						targetTab.id,
						{
							action: "updateMultiView",
							channels: selectedStreams,
						},
						(response) => {
							chrome.tabs.update(targetTab.id, { active: true });
							window.close();
						},
					);
				} else {
					// 탭이 없으면 새탭을 열고 로컬데이터로 전송
					chrome.storage.local.set({ multiviewInitData: selectedStreams }, () => {
						chrome.tabs.create({ url: `${BASE_URL}?data=ext` });
					});
				}
			});
		});
	}

	// 새 탭으로 열기
	if (newTabBtn) {
		newTabBtn.addEventListener("click", () => {
			const selectedStreams = getSelectedStreams();
			if (selectedStreams.length === 0) return;

			// 4개 초과 시 경고창
			if (selectedStreams.length > 4) {
				const warningMsg = `선택한 방송이 ${selectedStreams.length}개나 됩니다! 😅\n\n너무 많은 항목을 한 번에 띄우면 브라우저가 버벅일 수 있습니다.\n\n진짜로 이대로 띄우시겠습니까?`;
				if (!window.confirm(warningMsg)) return;
			}

			const queryString = selectedStreams.map((stream) => stream.streamId).join("--");
			chrome.tabs.create({ url: `${BASE_URL}?streams=${queryString}` });
		});
	}
}

// #region 유틸리티 및 상태 관리
function getSelectedStreams() {
	const checkedBoxes = document.querySelectorAll(".item-checkbox:checked");
	return Array.from(checkedBoxes).map((box) => {
		const id = box.value;
		// 저장해둔 원본 배열에서 해당 채널 ID를 가진 객체 찾기
		const rawData = cachedFollowers.find((f) => f.channelId === id);

		// 데이터를 못 찾으면 기본값 반환
		if (!rawData)
			return {
				streamId: id,
				name: "알 수 없음",
				channelImageUrl: "",
				liveTitle: "",
				openLive: false,
				liveCategoryValue: "",
			};

		const isLive = rawData.streamer?.openLive ?? false;
		const liveInfo = rawData.liveInfo || {};

		return {
			streamId: id,
			name: rawData.channel.channelName,
			channelImageUrl: rawData.channel.channelImageUrl || "",
			liveTitle: isLive && liveInfo.liveTitle ? liveInfo.liveTitle : "오프라인",
			openLive: isLive,
			liveCategoryValue: isLive && liveInfo.liveCategoryValue ? liveInfo.liveCategoryValue : "",
		};
	});
}

function updateSelectionState() {
	const allCheckedBoxes = document.querySelectorAll(".item-checkbox:checked");
	const selectAllCheckbox = document.getElementById("select-all");
	const syncSiteBtn = document.getElementById("sync-site-btn");
	const newTabBtn = document.getElementById("new-tab-btn");
	const countDisplay = document.getElementById("selected-count");

	// 선택된 총 개수
	const totalChecked = allCheckedBoxes.length;
	if (countDisplay) countDisplay.textContent = totalChecked;

	// 전체 선택 체크박스 상태
	if (selectAllCheckbox) {
		const visibleItems = document.querySelectorAll(".follower-item:not(.hidden)");
		const visibleCheckboxes = Array.from(visibleItems).map((item) => item.querySelector(".item-checkbox"));

		const visibleTotal = visibleCheckboxes.length;
		const visibleChecked = visibleCheckboxes.filter((box) => box.checked).length;

		if (visibleTotal > 0 && visibleChecked === visibleTotal) {
			selectAllCheckbox.checked = true;
			selectAllCheckbox.indeterminate = false;
		} else if (visibleChecked > 0 && visibleChecked < visibleTotal) {
			selectAllCheckbox.checked = false;
			selectAllCheckbox.indeterminate = true;
		} else {
			selectAllCheckbox.checked = false;
			selectAllCheckbox.indeterminate = false;
		}
	}

	// 하단 전송 버튼 활성화/비활성화
	const hasSelection = totalChecked > 0;
	if (syncSiteBtn) syncSiteBtn.disabled = !hasSelection;
	if (newTabBtn) newTabBtn.disabled = !hasSelection;
}
//#endregion
