"use strict";

jest.mock("child_process");
jest.mock("fs");
jest.mock("../../src/state", () => ({
  scriptDir: "/fake/script/dir",
  createdFiles: [],
  preExistingFiles: new Set(),
}));

const { execSync, spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { commitIfDirty, runClaudeCli } = require("../../src/shared/git");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("commitIfDirty()", () => {
  it("commits when git status reports changes", () => {
    execSync
      .mockReturnValueOnce("M src/foo.js\n") // git status --porcelain
      .mockReturnValue(undefined);           // git add, git commit

    const result = commitIfDirty("CHORE: test commit");
    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledWith("git add .", expect.any(Object));
    expect(execSync).toHaveBeenCalledWith(
      'git commit -m "CHORE: test commit"',
      expect.any(Object),
    );
  });

  it("skips commit when working tree is clean", () => {
    execSync.mockReturnValueOnce(""); // git status returns empty
    const result = commitIfDirty("CHORE: test commit");
    expect(result).toBe(true);
    expect(execSync).toHaveBeenCalledTimes(1);
  });

  it("returns false when execSync throws", () => {
    execSync.mockImplementation(() => { throw new Error("git error"); });
    const result = commitIfDirty("CHORE: whatever");
    expect(result).toBe(false);
  });
});

describe("runClaudeCli()", () => {
  it("returns false and logs error when prompt file does not exist", () => {
    fs.existsSync.mockReturnValue(false);
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = runClaudeCli("SETUP_PROMPT.md");
    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns false when claude is not on PATH", () => {
    fs.existsSync.mockReturnValue(true);
    execSync.mockImplementationOnce(() => { throw new Error("not found"); }); // where/which claude
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = runClaudeCli("SETUP_PROMPT.md");
    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it("returns true when spawnSync exits with status 0", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(Buffer.from("prompt content"));
    execSync.mockReturnValueOnce("C:\\tools\\claude.exe"); // where claude
    spawnSync.mockReturnValue({ status: 0 });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = runClaudeCli("SETUP_PROMPT.md");
    expect(result).toBe(true);
    consoleSpy.mockRestore();
  });

  it("returns false when spawnSync exits with non-zero status", () => {
    fs.existsSync.mockReturnValue(true);
    fs.readFileSync.mockReturnValue(Buffer.from("prompt content"));
    execSync.mockReturnValueOnce("C:\\tools\\claude.exe"); // where claude
    spawnSync.mockReturnValue({ status: 1 });
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const result = runClaudeCli("SETUP_PROMPT.md");
    expect(result).toBe(false);
    consoleSpy.mockRestore();
  });

  it("calls spawnSync with -p flag and file contents as input", () => {
    fs.existsSync.mockReturnValue(true);
    const promptBuf = Buffer.from("my prompt content");
    fs.readFileSync.mockReturnValue(promptBuf);
    execSync.mockReturnValueOnce("C:\\tools\\claude.exe");
    spawnSync.mockReturnValue({ status: 0 });
    jest.spyOn(console, "log").mockImplementation(() => {});
    runClaudeCli("SETUP_PROMPT.md");
    expect(spawnSync).toHaveBeenCalledWith(
      "claude",
      ["-p"],
      expect.objectContaining({ input: promptBuf }),
    );
  });
});
