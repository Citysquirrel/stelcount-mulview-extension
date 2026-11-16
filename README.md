# 스텔카운트 멀티뷰 확장 프로그램

https://stelcount.fans/multiview 의 치지직 방송에 대해 로그인 인증 및 각종 편리성 제공을 돕습니다.

[구글 확장 스토어에서 보기](https://chromewebstore.google.com/detail/stelcount-multiview-exten/aldeieecngphbbepbpljdafgibcfmima)

본 프로그램은 사용자의 개인정보를 절대 수집하지 않으며, 사용자 과실에 의해 발생하는 문제는 사용자 본인의 책임입니다.

본 확장 프로그램을 완전 삭제를 하실 때에는 브라우저 환경설정의 개인 정보 보호 탭에서 쿠키를 삭제해주어야 합니다.

본 프로그램은 스텔라이브 팬사이트인 스텔카운트에 포함된 프로젝트임을 알립니다. 해당 사이트 및 프로그램은 요청에 의해 삭제될 수 있음을 알립니다.

## Chrome iframe 규칙 배포 검토

- Chrome 128 이상이 필요합니다. `manifest.json`과 `rules/chzzk-iframe.json`을 함께 배포합니다. Firefox manifest에는 적용되지 않습니다.
- 규칙은 스텔카운트에서 시작한 `https://chzzk.naver.com/live/{32자리 소문자 16진수 채널 ID}` 및 `/chat`의 `sub_frame` 요청만 대상으로 합니다. 쿼리 문자열과 마지막 `/`를 허용합니다.
- 단일 CSP 헤더가 `frame-ancestors 'self' https://naver.com https://*.naver.com`일 때만 스텔카운트 출처를 추가한 값으로 대체합니다. DNR의 헤더 값 비교는 대소문자를 구분하지 않습니다. 헤더 조건의 `*`는 와일드카드가 아닌 문자로 이스케이프했습니다.
- 단일 헤더에 지시문이 추가되거나 값이 변경되면 대체하지 않습니다. 서비스가 차단되더라도 원본 정책을 먼저 확인하며, 조건을 포괄적인 와일드카드로 넓히지 않습니다.
- **복수 CSP 헤더 제한:** DNR의 `responseHeaders` 조건은 헤더 값 중 하나만 일치해도 통과합니다. 알려진 CSP와 별도의 추가 CSP가 동시에 전송되면 `set`이 추가 정책까지 덮어쓸 수 있습니다. 이 규칙은 복수 CSP 응답에 대해 안전한 보존을 보장하지 않습니다. 배포 전 방송·채팅 응답이 각각 단일 CSP인지 확인하고, 복수 정책으로 변경되면 규칙을 비활성화하고 재검토해야 합니다.
- `initiatorDomains`는 하위 도메인도 포함하며 `/multiview` 경로를 구분하지 않습니다. 다만 대체 CSP에서 새로 허용하는 출처는 정확히 `https://stelcount.fans`입니다. 스텔카운트 침해 시 클릭재킹 위험은 남습니다.
- 검증: `node scripts/test-iframe-rules.js`로 격리된 Chrome과 로컬 HTTPS 응답을 사용해 실제 DNR 매칭과 iframe 표시를 검사합니다(Node.js 22 이상, CDP `Extensions.loadUnpacked`를 지원하는 최신 Chrome, OpenSSL 필요). 필요 시 `CHROME_PATH`, `OPENSSL_PATH`로 실행 파일을 지정합니다. 인증서 예외는 임시 테스트 브라우저에만 적용하며 사용자 프로필을 사용하지 않습니다. 실제 방송 재생·채팅·새로고침은 확장 재로드 후 별도로 확인합니다.

참고: [Chrome DNR 문서](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest#type-HeaderInfo), [복수 헤더 매칭 구현](https://chromium.googlesource.com/chromium/src/+/refs/heads/main/extensions/browser/api/declarative_net_request/request_params.cc).
