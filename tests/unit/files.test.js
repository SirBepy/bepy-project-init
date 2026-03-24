"use strict";

jest.mock("fs");
jest.mock("../../src/state", () => ({
  scriptDir: "/fake/script/dir",
  createdFiles: [],
  preExistingFiles: new Set(),
}));

const fs = require("fs");
const path = require("path");
const state = require("../../src/state");

const { track, assertSafeToOverwrite, copyTemplate, mergeGitignore, injectIntoHtml } = require("../../src/shared/files");

beforeEach(() => {
  jest.clearAllMocks();
  state.createdFiles.length = 0;
  state.preExistingFiles.clear();
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockReturnValue("");
  fs.writeFileSync.mockReturnValue(undefined);
  fs.mkdirSync.mockReturnValue(undefined);
});

describe("track()", () => {
  it("adds the resolved path to state.createdFiles", () => {
    track("some/relative/path.txt");
    expect(state.createdFiles).toContain(path.resolve("some/relative/path.txt"));
  });
});

describe("assertSafeToOverwrite()", () => {
  it("throws when file exists and is pre-existing", () => {
    const p = path.resolve("existing.txt");
    fs.existsSync.mockReturnValue(true);
    state.preExistingFiles.add(p);
    expect(() => assertSafeToOverwrite("existing.txt")).toThrow(/Refusing to overwrite/);
  });

  it("does not throw when file does not exist", () => {
    fs.existsSync.mockReturnValue(false);
    expect(() => assertSafeToOverwrite("new.txt")).not.toThrow();
  });

  it("does not throw when file exists but is not pre-existing", () => {
    fs.existsSync.mockReturnValue(true);
    // preExistingFiles is empty
    expect(() => assertSafeToOverwrite("created-by-us.txt")).not.toThrow();
  });
});

describe("copyTemplate()", () => {
  it("reads template, applies substitutions, and writes to dest", () => {
    fs.readFileSync.mockReturnValue("Hello {{NAME}}, your version is {{VERSION}}.");
    fs.existsSync.mockReturnValue(false);

    copyTemplate("some/template.md", "output.md", { NAME: "Joe", VERSION: "2.0" });

    const expectedSrcPath = path.join("/fake/script/dir", "templates", "some/template.md");
    expect(fs.readFileSync).toHaveBeenCalledWith(expectedSrcPath, "utf8");
    expect(fs.writeFileSync).toHaveBeenCalledWith("output.md", "Hello Joe, your version is 2.0.");
  });

  it("handles multiple occurrences of the same placeholder", () => {
    fs.readFileSync.mockReturnValue("{{X}} and {{X}}");
    fs.existsSync.mockReturnValue(false);

    copyTemplate("t.md", "out.md", { X: "FOO" });

    expect(fs.writeFileSync).toHaveBeenCalledWith("out.md", "FOO and FOO");
  });

  it("tracks the destination path", () => {
    fs.readFileSync.mockReturnValue("content");
    fs.existsSync.mockReturnValue(false);

    copyTemplate("t.md", "out.md", {});

    expect(state.createdFiles).toContain(path.resolve("out.md"));
  });

  it("throws if the destination is a pre-existing file", () => {
    const dest = path.resolve("existing.md");
    fs.readFileSync.mockReturnValue("content");
    fs.existsSync.mockReturnValue(true);
    state.preExistingFiles.add(dest);

    expect(() => copyTemplate("t.md", "existing.md", {})).toThrow(/Refusing to overwrite/);
  });
});

describe("mergeGitignore()", () => {
  it("writes template directly when .gitignore does not exist", () => {
    fs.existsSync.mockReturnValue(false); // destPath does not exist
    fs.readFileSync.mockReturnValue("node_modules\ndist\n"); // template content

    mergeGitignore(".gitignore");

    expect(fs.writeFileSync).toHaveBeenCalledWith(".gitignore", "node_modules\ndist\n");
    expect(state.createdFiles).toContain(path.resolve(".gitignore"));
  });

  it("merges missing lines into an existing .gitignore", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync
      .mockReturnValueOnce("node_modules\ndist\n")  // template
      .mockReturnValueOnce("node_modules\n");        // existing gitignore

    mergeGitignore(".gitignore");

    const written = fs.writeFileSync.mock.calls[0][1];
    expect(written).toContain("dist");
    expect(written).toContain("# Added by bepy-project-init");
  });

  it("does not add lines that already exist in .gitignore", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync
      .mockReturnValueOnce("node_modules\ndist\n")    // template
      .mockReturnValueOnce("node_modules\ndist\n");   // existing (has everything)

    mergeGitignore(".gitignore");

    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});

describe("injectIntoHtml()", () => {
  it("injects Google Fonts link when googleFonts option is set", () => {
    fs.readFileSync.mockReturnValue("<html><head></head><body></body></html>");

    injectIntoHtml("index.html", { googleFonts: true });

    const written = fs.writeFileSync.mock.calls[0][1];
    expect(written).toContain("fonts.googleapis.com");
  });

  it("does not inject Google Fonts if already present", () => {
    fs.readFileSync.mockReturnValue(
      '<html><head><link href="https://fonts.googleapis.com/..." rel="stylesheet"></head></html>',
    );

    injectIntoHtml("index.html", { googleFonts: true });

    const written = fs.writeFileSync.mock.calls[0][1];
    const count = (written.match(/fonts\.googleapis\.com/g) || []).length;
    expect(count).toBe(1);
  });

  it("injects PWA manifest tags when pwaManifest option is set", () => {
    fs.readFileSync.mockReturnValue("<html><head></head><body></body></html>");

    injectIntoHtml("index.html", { pwaManifest: true, pwaThemeColor: "#ffffff" });

    const written = fs.writeFileSync.mock.calls[0][1];
    expect(written).toContain('rel="manifest"');
    expect(written).toContain("#ffffff");
  });

  it("injects widget script tag when widgetTag option is set", () => {
    fs.readFileSync.mockReturnValue("<html><head></head><body></body></html>");

    injectIntoHtml("index.html", { widgetTag: true });

    const written = fs.writeFileSync.mock.calls[0][1];
    expect(written).toContain("sirbepy.github.io");
  });

  it("injects build-info script when buildInfoScript option is set", () => {
    fs.readFileSync.mockReturnValue("<html><head></head><body></body></html>");

    injectIntoHtml("index.html", { buildInfoScript: true });

    const written = fs.writeFileSync.mock.calls[0][1];
    expect(written).toContain("build-info.js");
  });
});
