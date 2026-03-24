"use strict";

jest.mock("inquirer");
const inquirer = require("inquirer");
const { prompt, select } = require("../../src/shared/prompt");

beforeEach(() => {
  jest.clearAllMocks();
});

describe("prompt()", () => {
  it("returns the user-entered value", async () => {
    inquirer.prompt.mockResolvedValue({ value: "my-project" });
    const result = await prompt("Project name?", "default");
    expect(result).toBe("my-project");
  });

  it("returns defaultVal when inquirer returns empty string", async () => {
    inquirer.prompt.mockResolvedValue({ value: "" });
    const result = await prompt("Project name?", "fallback");
    expect(result).toBe("fallback");
  });

  it("returns defaultVal when inquirer returns undefined", async () => {
    inquirer.prompt.mockResolvedValue({ value: undefined });
    const result = await prompt("Project name?", "fallback");
    expect(result).toBe("fallback");
  });

  it("calls inquirer with type=input and the provided message", async () => {
    inquirer.prompt.mockResolvedValue({ value: "x" });
    await prompt("Enter name:", "d");
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({ type: "input", message: "Enter name:" }),
    ]);
  });

  it("sets default when defaultVal is non-empty", async () => {
    inquirer.prompt.mockResolvedValue({ value: "x" });
    await prompt("Label", "myDefault");
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({ default: "myDefault" }),
    ]);
  });

  it("does not set default when defaultVal is empty string", async () => {
    inquirer.prompt.mockResolvedValue({ value: "x" });
    await prompt("Label", "");
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({ default: undefined }),
    ]);
  });

  it("passes validator that resolves fallback before calling user function", async () => {
    inquirer.prompt.mockResolvedValue({ value: "entered" });
    const validator = jest.fn().mockReturnValue(true);
    await prompt("Label", "def", validator);
    const [questions] = inquirer.prompt.mock.calls[0];
    const result = questions[0].validate("entered");
    expect(validator).toHaveBeenCalledWith("entered");
    expect(result).toBe(true);
  });

  it("validator substitutes defaultVal when input is empty", async () => {
    inquirer.prompt.mockResolvedValue({ value: "entered" });
    const validator = jest.fn().mockReturnValue(true);
    await prompt("Label", "def", validator);
    const [questions] = inquirer.prompt.mock.calls[0];
    questions[0].validate("");
    expect(validator).toHaveBeenCalledWith("def");
  });

  it("validator returns error string from user function", async () => {
    inquirer.prompt.mockResolvedValue({ value: "x" });
    const validator = jest.fn().mockReturnValue("too short");
    await prompt("Label", "def", validator);
    const [questions] = inquirer.prompt.mock.calls[0];
    const result = questions[0].validate("x");
    expect(result).toBe("too short");
  });
});

describe("select()", () => {
  it("returns the chosen value", async () => {
    inquirer.prompt.mockResolvedValue({ value: "react" });
    const result = await select("Pick framework:", ["vite", "react"]);
    expect(result).toBe("react");
  });

  it("calls inquirer with type=list and provided choices", async () => {
    inquirer.prompt.mockResolvedValue({ value: "vite" });
    await select("Pick:", ["a", "b"]);
    expect(inquirer.prompt).toHaveBeenCalledWith([
      expect.objectContaining({ type: "list", message: "Pick:", choices: ["a", "b"] }),
    ]);
  });
});
