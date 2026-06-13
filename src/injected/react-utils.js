/**
 * DOM 요소에 바인딩된 React Props(속성) 보따리를 추출합니다.
 * * 리액트가 DOM 요소에 주입한 이벤트 핸들러(예: onClick, onChange)나
 * 상위 컴포넌트로부터 전달받은 텍스트, 설정값 등을 확인하고 직접 실행할 때 주로 사용합니다.
 * "버튼을 클릭한 것처럼" 이벤트를 확정적으로 트리거하고 싶을 때 가장 먼저 찾아야 하는 객체입니다.
 * * @param {HTMLElement} domElement - 탐색할 대상 DOM 요소 (예: document.querySelector로 찾은 노드)
 * @returns {Object|null} React Props 객체. 리액트 요소가 아니거나 찾지 못하면 null을 반환합니다.
 * * @example
 * const btn = document.querySelector('.reward-btn');
 * const props = getReactProps(btn);
 * // 버튼의 가짜 클릭 이벤트 강제 실행
 * if (props && typeof props.onClick === 'function') {
 * props.onClick({ preventDefault: () => {}, target: btn });
 * }
 */
function getReactProps(domElement) {
	if (!domElement) return null;
	const key = Object.keys(domElement).find((k) => k.startsWith("__reactProps$"));
	return key ? domElement[key] : null;
}

/**
 * DOM 요소에 바인딩된 내부 React Fiber(파이버) 노드를 추출합니다.
 * * Props만으로는 해결할 수 없는 깊은 수준의 제어나 탐색이 필요할 때 사용하는 리액트 코어 객체입니다.
 * 컴포넌트의 내부 상태값(`memoizedState`)을 강제로 읽거나,
 * 가상 DOM 트리(`return`: 부모, `child`: 자식, `sibling`: 형제)를 타고 다니며
 * 화면에는 보이지 않는 숨겨진 데이터를 캐낼 때 유용합니다.
 * * @param {HTMLElement} domElement - 탐색할 대상 DOM 요소
 * @returns {Object|null} React Fiber 객체. 리액트 요소가 아니거나 찾지 못하면 null을 반환합니다.
 * * @example
 * const el = document.querySelector('.chat-container');
 * const fiber = getReactFiber(el);
 * * // 1. 현재 컴포넌트의 숨겨진 상태값 확인
 * console.log("상태값(State):", fiber.memoizedState);
 * * // 2. 이벤트 위임이 된 경우, 부모 파이버를 타고 올라가서 Props 찾기
 * const parentProps = fiber.return ? fiber.return.memoizedProps : null;
 */
function getReactFiber(domElement) {
	if (!domElement) return null;
	const key = Object.keys(domElement).find((k) => k.startsWith("__reactFiber$"));
	return key ? domElement[key] : null;
}

/**
 * 리액트 요소의 Props 객체를 찾아 onClick을 확정적으로 실행하는 만능 함수
 * @param {HTMLElement} domElement - 클릭할 타겟 DOM 요소
 * @returns {boolean} - 성공 여부
 */
function triggerReactClick(domElement) {
	if (!domElement) return false;

	// 확정적으로 존재하는 리액트 객체의 키 이름 탐색
	const reactKey = Object.keys(domElement).find((key) => key.startsWith("__reactProps$"));
	if (!reactKey) return false;

	// 객체 꺼내기
	const props = domElement[reactKey];

	// 객체 안에 onClick이 있는지 확인 후 실행
	if (props && typeof props.onClick === "function") {
		props.onClick({
			preventDefault: () => {},
			stopPropagation: () => {},
			target: domElement,
			currentTarget: domElement,
		});
		return true; // 실행 성공
	}

	return false; // onClick 함수가 없어 실행 실패
}
