import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import App from "./App";

describe("FlowBoard workspace", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("creates a task and persists it in the browser", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "New task" }));
    const dialog = screen.getByRole("dialog");
    await user.type(
      within(dialog).getByRole("textbox", { name: "Task name" }),
      "Write launch brief",
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Create task" }),
    );
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("button", { name: "Board" }),
    );

    expect(
      await screen.findByRole("button", { name: "Write launch brief" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem("flowboard.tasks.v1")).toContain(
      "Write launch brief",
    );
  });

  it("moves a task using its keyboard-accessible status selector", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("button", { name: "Board" }),
    );

    const status = screen.getByRole("combobox", {
      name: "Move Map account setup flow to status",
    });
    await user.selectOptions(status, "review");

    expect(status).toHaveValue("review");
    expect(window.localStorage.getItem("flowboard.tasks.v1")).toContain(
      '"status":"review"',
    );
  });

  it("filters tasks by search text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(
      within(
        screen.getByRole("navigation", { name: "Main navigation" }),
      ).getByRole("button", { name: "Board" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Search tasks" }),
      "interview synthesis",
    );

    expect(
      screen.getByRole("button", { name: "Review interview synthesis" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Map account setup flow" }),
    ).not.toBeInTheDocument();
  });
});
