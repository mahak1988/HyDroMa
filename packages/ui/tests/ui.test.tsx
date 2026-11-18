import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Button, Dialog, Switch, Tabs } from "../src";

describe("button", () => {
  it("reflects loading and disabled state", () => {
    render(
      <div>
        <Button loading>Save</Button>
        <Button disabled>Save</Button>
      </div>,
    );
    const loading = screen.getAllByRole("button", { name: /save/i })[0]!;
    expect(loading).toBeDisabled();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("button", { name: /save/i })[1]).toBeDisabled();
  });

  it("calls onClick once", async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Save</Button>);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("switch", () => {
  it("toggles with an accessible name and logical thumb position", () => {
    const onChange = vi.fn();
    render(<Switch label="Compact" checked={false} onCheckedChange={onChange} />);
    const control = screen.getByRole("switch", { name: "Compact" });
    expect(control).toHaveAttribute("aria-checked", "false");
    fireEvent.click(control);
    expect(onChange).toHaveBeenCalledWith(true);
  });
});

describe("tabs", () => {
  it("switches panels with the keyboard", () => {
    render(
      <Tabs
        label="sections"
        items={[
          { id: "a", label: "Alpha", content: <p>alpha-panel</p> },
          { id: "b", label: "Beta", content: <p>beta-panel</p> },
        ]}
      />,
    );
    const tab = screen.getByRole("tab", { name: "Alpha" });
    tab.focus();
    fireEvent.keyDown(tab, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Beta" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("beta-panel")).toBeInTheDocument();
  });
});

describe("dialog", () => {
  it("opens as a modal and closes via the cancel event", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Dialog open onClose={onClose} title="Settings">
        <p>dialog-body</p>
      </Dialog>,
    );
    const dialog = container.querySelector("dialog");
    expect(dialog).not.toBeNull();
    expect(dialog?.getAttribute("open")).not.toBeNull();
    fireEvent(dialog as HTMLDialogElement, new Event("cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});