const fs = require("fs");
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
});

archive.on("error", (err) => {
	console.error("❌ ZIP error:", err);
	process.exit(1);
});

archive.pipe(output);

// 🔥 현재 폴더 전체 압축 (zip 파일 자신은 제외)
archive.glob("**/*", {
	cwd: projectRoot,
	ignore: [
		"node_modules/**",
		".git/**",
		`${outputFileName}`, // 자기 자신 제외
	],
});

archive.finalize();
