const fs = require("fs");
const { exec } = require("child_process");
const os = require("os");
const path = require("path");
const archiver = require("archiver");

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

const outputFileName = `${projectName}_${version}.zip`;
const outputPath = path.join(projectRoot, "..", outputFileName);

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
		`${outputFileName}`, // 자기 자신 제외 - 불필요하지만 확실하게 예외처리
	],
});

archive.finalize();

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
