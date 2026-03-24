"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");

jest.mock("child_process", () => ({
  execSync: jest.fn(),
}));

jest.mock("../../src/state", () => {
  const p = require("path");
  return {
    scriptDir: p.resolve(__dirname, "../../"),
    projectName: "test-project",
    createdFiles: [],
    preExistingFiles: new Set(),
  };
});

const { execSync } = require("child_process");
const state = require("../../src/state");
const stepScaffoldHtml = require("../../src/steps/scaffold/scaffoldHtml");

let tmpDir;
let originalCwd;

beforeEach(() => {
  jest.clearAllMocks();
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "bepy-test-"));
  originalCwd = process.cwd();
  process.chdir(tmpDir);
  state.createdFiles.length = 0;
  state.preExistingFiles.clear();
});

afterEach(() => {
  process.chdir(originalCwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("stepScaffoldHtml() - fresh directory (no index.html)", () => {
  it("creates index.html, src/styles.css, and src/script.js", async () => {
    await stepScaffoldHtml();

    expect(fs.existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "src/styles.css"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "src/script.js"))).toBe(true);
  });

  it("creates .github/workflows/deploy.yml", async () => {
    await stepScaffoldHtml();

    expect(fs.existsSync(path.join(tmpDir, ".github/workflows/deploy.yml"))).toBe(true);
  });

  it("creates .gitignore and .prettierrc", async () => {
    await stepScaffoldHtml();

    expect(fs.existsSync(path.join(tmpDir, ".gitignore"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, ".prettierrc"))).toBe(true);
  });

  it("calls git init since no .git dir exists", async () => {
    await stepScaffoldHtml();

    expect(execSync).toHaveBeenCalledWith("git init", expect.any(Object));
  });

  it("does not call git init when .git already exists", async () => {
    fs.mkdirSync(path.join(tmpDir, ".git"));
    await stepScaffoldHtml();

    expect(execSync).not.toHaveBeenCalledWith("git init", expect.any(Object));
  });
});

describe("stepScaffoldHtml() - existing index.html with inline styles", () => {
  it("extracts inline <style> to src/styles.css and links it", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "index.html"),
      "<html><head><style>body { color: red; }</style></head><body></body></html>",
    );

    await stepScaffoldHtml();

    const css = fs.readFileSync(path.join(tmpDir, "src/styles.css"), "utf8");
    expect(css).toContain("body { color: red; }");

    const html = fs.readFileSync(path.join(tmpDir, "index.html"), "utf8");
    expect(html).toContain('href="src/styles.css"');
    expect(html).not.toContain("<style>");
  });
});

describe("stepScaffoldHtml() - existing index.html with inline script", () => {
  it("extracts inline <script> to src/script.js and links it", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "index.html"),
      "<html><head></head><body><script>console.log('hi');</script></body></html>",
    );

    await stepScaffoldHtml();

    const js = fs.readFileSync(path.join(tmpDir, "src/script.js"), "utf8");
    expect(js).toContain("console.log('hi');");

    const html = fs.readFileSync(path.join(tmpDir, "index.html"), "utf8");
    expect(html).toContain('src="src/script.js"');
    expect(html).not.toContain("<script>console");
  });
});

describe("stepScaffoldHtml() - single .html file renamed to index.html", () => {
  it("renames the lone .html file to index.html", async () => {
    fs.writeFileSync(
      path.join(tmpDir, "mypage.html"),
      "<html><head></head><body></body></html>",
    );

    await stepScaffoldHtml();

    expect(fs.existsSync(path.join(tmpDir, "index.html"))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, "mypage.html"))).toBe(false);
  });
});
