const fs = require("fs");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const archiver = require("archiver");
const readline = require("readline");

const projectRoot = process.cwd();
const projectName = path.basename(projectRoot);

// manifest.json (루트)
const manifestPath = path.join(projectRoot, "manifest.json");

if (!fs.existsSync(manifestPath)) {
	console.error("❌ manifest.json not found in project root");
	process.exit(1);
}

// version 읽기
const { version } = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

if (!version) {
	console.error("❌ version not found in manifest.json");
	process.exit(1);
}

// IS_DEV 검사
const popupJsPath = path.join(projectRoot, "src/pages/popup.js");

if (fs.existsSync(popupJsPath)) {
	const popupContent = fs.readFileSync(popupJsPath, "utf-8");

	if (/const\s+IS_DEV\s*=\s*true/.test(popupContent)) {
		console.error("\n🚨 [치명적 오류] 패키징 중단! 🚨");
		console.error("👉 popup.js의 IS_DEV 변수가 'true'로 설정되어 있습니다.");
		console.error("👉 배포용 ZIP을 만들기 전에 반드시 'false'로 변경해주세요!\n");
		process.exit(1);
	}
} else {
	console.error("⚠️ popup.js 파일을 찾을 수 없습니다. 경로를 확인해주세요!");
	process.exit(1);
}

const outputFileName = `${projectName}_${version}.zip`;
const outputPath = path.join(projectRoot, "..", outputFileName);

const output = fs.createWriteStream(outputPath);
const archive = archiver("zip", { zlib: { level: 9 } });

if (fs.existsSync(outputPath)) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	rl.question(
		`⚠️ 동일한 이름의 파일이 이미 존재합니다. 배포시 버전을 확인해주세요: ${outputFileName}\n덮어쓰시겠습니까? (y/n): `,
		(answer) => {
			rl.close();
			const response = answer.trim().toLowerCase();

			if (response === "y" || response === "yes") {
				console.log("🔄 기존 파일을 덮어쓰고 압축을 시작합니다...");
				createZip();
			} else {
				console.log("🛑 작업을 취소했습니다.");
				process.exit(0);
			}
		},
	);
} else {
	// 파일이 없으면 바로 압축 시작
	console.log("🚀 압축을 시작합니다...");
	createZip();
}

function createZip() {
	const output = fs.createWriteStream(outputPath);
	const archive = archiver("zip", { zlib: { level: 9 } });

	output.on("close", () => {
		console.log(`✅ ZIP created: ${outputFileName}`);
		console.log(`📦 Size: ${archive.pointer()} bytes`);

		openFileInExplorer(outputPath);
	});

	archive.on("error", (err) => {
		console.error("❌ ZIP error:", err);
		process.exit(1);
	});

	archive.pipe(output);

	// 현재 폴더 전체 압축
	archive.glob("**/*", {
		cwd: projectRoot,
		ignore: [
			"node_modules/**",
			".git/**",
			"scripts/**",
			"manifest.firefox.json",
			"package.json",
			"package-lock.json",
			".gitignore",
			"README.md",
			"LICENSE",
			`${outputFileName}`, // 자기 자신 제외
		],
	});

	archive.finalize();
}

function openFileInExplorer(filePath) {
	const platform = os.platform();

	if (platform === "win32") {
		// Windows: 파일 선택
		exec(`explorer /select,"${filePath}"`);
	} else if (platform === "darwin") {
		// macOS: Finder에서 파일 선택
		exec(`open -R "${filePath}"`);
	} else {
		// Linux: 폴더 열기 (파일 선택은 환경별로 다름)
		exec(`xdg-open "${path.dirname(filePath)}"`);
	}
}
