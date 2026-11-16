const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { once } = require("node:events");
const { setTimeout: delay } = require("node:timers/promises");
const https = require("node:https");

// 실제 브라우저의 DNR 엔진을 사용합니다. 사용자 프로필과 사이트에는 접근하지 않습니다.
async function main() {
	const root = path.resolve(__dirname, "..");
	const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
	assert(Number(manifest.minimum_chrome_version) >= 128);
	for (const origin of manifest.optional_host_permissions || []) {
		assert(!manifest.host_permissions.includes(origin), `중복 호스트 권한: ${origin}`);
	}
	const temp = await fs.mkdtemp(path.join(os.tmpdir(), "stelcount-dnr-"));
	const extension = path.join(temp, "extension");
	const profile = path.join(temp, "profile");
	await fs.mkdir(extension);
	for (const resource of manifest.declarative_net_request.rule_resources) {
		const destination = path.join(extension, resource.path);
		await fs.mkdir(path.dirname(destination), { recursive: true });
		await fs.copyFile(path.join(root, resource.path), destination);
	}
	// 제품 규칙과 호스트 권한은 그대로 사용하고 테스트용 worker만 실행합니다.
	await fs.writeFile(path.join(extension, "manifest.json"), JSON.stringify({
		manifest_version: 3, name: "StelCount DNR verification", version: "1.0",
		minimum_chrome_version: manifest.minimum_chrome_version,
		permissions: [...manifest.permissions, "declarativeNetRequestFeedback"],
		host_permissions: manifest.host_permissions,
		declarative_net_request: manifest.declarative_net_request,
		background: { service_worker: "worker.js" },
	}));
	await fs.writeFile(path.join(extension, "worker.js"), "globalThis.matches = []; chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(info => matches.push(info));");
	const opensslPath = process.env.OPENSSL_PATH || "C:/Program Files/Git/usr/bin/openssl.exe";
	const certificate = spawn(opensslPath, ["req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=localhost", "-keyout", path.join(temp, "key.pem"), "-out", path.join(temp, "cert.pem")], { windowsHide: true, stdio: "ignore" });
	const [certificateExit] = await once(certificate, "exit");
	assert.equal(certificateExit, 0, "Test certificate generation failed");
	let responseHeaders = {};
	let received = false;
	const server = https.createServer({ key: await fs.readFile(path.join(temp, "key.pem")), cert: await fs.readFile(path.join(temp, "cert.pem")) }, (request, response) => {
		response.setHeader("cache-control", "no-store");
		response.setHeader("content-type", "text/html");
		if (request.url === "/parent") {
			response.end("<html><body>Test parent<script>window.loaded = false; addEventListener('message', e => { if (e.data === 'fixture-loaded') window.loaded = true; });</script></body></html>");
		} else {
			received = true;
			for (const [name, values] of Object.entries(responseHeaders)) response.setHeader(name, values);
			response.end("<html><body>Test frame<script>parent.postMessage('fixture-loaded', '*');</script></body></html>");
		}
	});
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const fixturePort = server.address().port;
	const hosts = ["chzzk.naver.com", "stelcount.fans", "evil.test", "chzzk.naver.com.evil.test", "stelcount.fans.evil.test"];
	const chromePath = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
	const browser = spawn(chromePath, [
		"--headless=new", "--no-first-run", "--no-default-browser-check",
		"--disable-background-networking", "--no-proxy-server", "--ignore-certificate-errors",
		`--host-resolver-rules=${hosts.map(host => `MAP ${host} 127.0.0.1:${fixturePort}`).join(", ")}`,
		"--enable-unsafe-extension-debugging", "--remote-debugging-port=0",
		`--user-data-dir=${profile}`, "about:blank",
	], { windowsHide: true, stdio: "ignore" });
	let launchError;
	browser.on("error", error => { launchError = error; });
	let socket;
	let send;
	try {
		let portInfo;
		for (let attempt = 0; attempt < 100; attempt++) {
			if (launchError) throw launchError;
			try { portInfo = await fs.readFile(path.join(profile, "DevToolsActivePort"), "utf8"); } catch {}
			if (portInfo) break;
			await delay(100);
		}
		assert(portInfo, "Chrome debugging endpoint did not start");
		const [port, endpoint] = portInfo.trim().split(/\r?\n/);
		socket = new WebSocket(`ws://127.0.0.1:${port}${endpoint}`);
		await once(socket, "open");
		let id = 0;
		const pending = new Map();
		socket.addEventListener("message", event => {
			const message = JSON.parse(event.data);
			const callbacks = pending.get(message.id);
			if (!callbacks) return;
			pending.delete(message.id);
			clearTimeout(callbacks.timer);
			if (message.error) callbacks.reject(new Error(JSON.stringify(message.error)));
			else callbacks.resolve(message.result);
		});
		send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
			const requestId = ++id;
			const timer = setTimeout(() => { pending.delete(requestId); reject(new Error(`${method} timed out`)); }, 10000);
			pending.set(requestId, { resolve, reject, timer });
			socket.send(JSON.stringify({ id: requestId, method, params, sessionId }));
		});
		const { id: extensionId } = await send("Extensions.loadUnpacked", { path: extension });
		let worker;
		for (let attempt = 0; attempt < 50; attempt++) {
			const { targetInfos } = await send("Target.getTargets");
			worker = targetInfos.find(target => target.type === "service_worker" && target.url.startsWith(`chrome-extension://${extensionId}/`));
			if (worker) break;
			await delay(100);
		}
		assert(worker, "Test extension worker did not start");
		const { sessionId } = await send("Target.attachToTarget", { targetId: worker.targetId, flatten: true });
		await send("Runtime.enable", {}, sessionId);
		let ready = false;
		for (let attempt = 0; attempt < 50; attempt++) {
			const result = await send("Runtime.evaluate", { expression: "typeof chrome !== 'undefined' && !!chrome.declarativeNetRequest", returnByValue: true }, sessionId);
			if (result.result.value === true) { ready = true; break; }
			await delay(100);
		}
		assert(ready, "Extension API did not initialize");
		const { targetId } = await send("Target.createTarget", { url: "about:blank" });
		const { sessionId: pageSession } = await send("Target.attachToTarget", { targetId, flatten: true });
		await send("Page.enable", {}, pageSession);
		const evaluate = async (expression, session = pageSession) => {
			const result = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true }, session);
			assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
			return result.result.value;
		};
		const policy = "frame-ancestors 'self' https://naver.com https://*.naver.com";
		const live = "https://chzzk.naver.com/live/0123456789abcdef0123456789abcdef";
		const base = { url: live, initiator: "https://stelcount.fans/multiview", type: "sub_frame", responseHeaders: { "content-security-policy": [policy] } };
		const cases = [
			["live", {}, true],
			["chat", { url: `${live}/chat` }, true],
			["query", { url: `${live}?test=1` }, true],
			["trailing slash", { url: `${live}/chat/` }, true],
			["home", { url: "https://chzzk.naver.com/" }, false],
			["settings", { url: "https://chzzk.naver.com/settings" }, false],
			["nested path", { url: `${live}/settings` }, false],
			["invalid ID", { url: "https://chzzk.naver.com/live/short" }, false],
			["lookalike host", { url: live.replace("naver.com", "naver.com.evil.test") }, false],
			["unrelated initiator", { initiator: "https://evil.test" }, false],
			["lookalike initiator", { initiator: "https://stelcount.fans.evil.test" }, false],
			["main frame", { type: "main_frame" }, false],
			["API request", { type: "xmlhttprequest" }, false],
			["no CSP", { responseHeaders: {} }, false],
			["changed CSP", { responseHeaders: { "content-security-policy": ["frame-ancestors 'none'"] } }, false],
			["added directive", { responseHeaders: { "content-security-policy": [`${policy}; script-src 'self'`] } }, false],
			["literal wildcard", { responseHeaders: { "content-security-policy": [policy.replace("*.naver.com", "evil.naver.com")] } }, false],
			// 값 하나만 일치해도 적용되는 DNR의 한계입니다. README에 명시한 동작을 확인합니다.
			["KNOWN LIMIT: separate additional CSP", { responseHeaders: { "content-security-policy": [policy, "script-src 'self'"] } }, true],
		];
		for (const [name, overrides, expected] of cases) {
			const request = { ...base, ...overrides };
			await send("Page.navigate", { url: `${new URL(request.initiator).origin}/parent` }, pageSession);
			let parentReady = false;
			for (let attempt = 0; attempt < 100; attempt++) {
				if (await evaluate("location.pathname === '/parent' && document.readyState === 'complete'")) { parentReady = true; break; }
				await delay(50);
			}
			assert(parentReady, `${name}: fixture parent did not load`);
			await evaluate("matches = []", sessionId);
			responseHeaders = request.responseHeaders;
			received = false;
			if (request.type === "main_frame") await send("Page.navigate", { url: request.url }, pageSession);
			else if (request.type === "xmlhttprequest") await evaluate(`fetch(${JSON.stringify(request.url)}, { mode: 'no-cors' }).then(() => true)`);
			else await evaluate(`(() => { const frame = document.createElement('iframe'); frame.src = ${JSON.stringify(request.url)}; document.body.append(frame); })()`);
			for (let attempt = 0; attempt < 100 && !received; attempt++) await delay(50);
			assert(received, `${name}: fixture request did not arrive`);
			await delay(500);
			const matches = await evaluate("matches", sessionId);
			assert.equal(matches.some(info => info.rule.rulesetId === "chzzk_iframe" && info.rule.ruleId === 1), expected, name);
			if (expected) assert.equal(await evaluate("window.loaded"), true, `${name}: iframe did not render`);
		}
		console.log(`Passed ${cases.length} HTTPS browser DNR cases, including iframe rendering and the documented multiple-CSP limitation.`);
	} finally {
		if (send && socket?.readyState === WebSocket.OPEN) await send("Browser.close").catch(() => {});
		socket?.close();
		server.closeAllConnections();
		await new Promise(resolve => server.close(resolve));
		if (browser.exitCode === null && browser.signalCode === null) {
			await Promise.race([once(browser, "exit"), delay(3000)]);
			if (browser.exitCode === null && browser.signalCode === null) browser.kill();
		}
		// 삭제 대상은 이 테스트가 만든 OS 임시 디렉터리로 제한합니다.
		assert(path.dirname(temp) === path.resolve(os.tmpdir()) && path.basename(temp).startsWith("stelcount-dnr-"));
		await fs.rm(temp, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
	}
}

main().catch(error => { console.error(error); process.exitCode = 1; });
