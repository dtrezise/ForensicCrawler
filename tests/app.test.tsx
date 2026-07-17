import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("local review interface", () => {
  it("opens on the active case with the procedural and network boundaries visible", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Operation Southern Spear vessel strikes - public-record reconstruction" })).toBeInTheDocument();
    expect(screen.getByText("Working reconstruction")).toBeInTheDocument();
    expect(screen.getByText("Public prototype · no live crawler")).toBeInTheDocument();
    expect(screen.getByText("Campaign-wide record · not all strikes in Venezuela")).toBeInTheDocument();
    expect(screen.getByText("Schematic ready · photogrammetry blocked")).toBeInTheDocument();
  });

  it("moves among the case review surfaces", () => {
    render(<App />);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: /Evidence ledger/ }));
    expect(screen.getByRole("heading", { name: "24 claims in view" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Event timeline" }));
    expect(screen.getByRole("heading", { name: "Source clocks remain separate" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: /Contradictions/ }));
    expect(screen.getByText("Conflicts remain visible, never averaged away")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: /Provenance/ }));
    expect(screen.getByRole("heading", { name: "6-event integrity chain" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Rights & privacy" }));
    expect(screen.getByText("REMOTE BYTES")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Package export" }));
    expect(screen.getByRole("link", { name: "Download working JSON" })).toHaveAttribute("download", "southern-spear-vessel-strikes.forensic-package.working.json");
  });

  it("searches claims and source metadata without changing the package", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Evidence ledger/ }));
    const search = screen.getByRole("textbox", { name: "Search case records" });
    fireEvent.change(search, { target: { value: "publicly releasable accounting" } });
    expect(screen.getByRole("heading", { name: "1 claim in view" })).toBeInTheDocument();
    expect(screen.getByText(/could not provide a publicly releasable accounting/)).toBeInTheDocument();
  });

  it("updates the inspector when a source is selected", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Evidence ledger/ }));
    fireEvent.click(screen.getByRole("button", { name: /Operation Southern Spear, Report to Congress/ }));
    const inspector = screen.getByRole("complementary", { name: "Record inspector" });
    expect(within(inspector).getByText("Official Report")).toBeInTheDocument();
    expect(within(inspector).getAllByText(/Strikes and Interdictions, page 10/)).toHaveLength(2);
    expect(within(inspector).getByText(/Crawler network approved:/)).toBeInTheDocument();
  });

  it("keeps the original Apollo fixture available as a separate case", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "Select investigation" }), { target: { value: "apollo" } });
    expect(screen.getByRole("heading", { name: "Apollo 11 landing-time reconciliation" })).toBeInTheDocument();
    expect(screen.queryByText("Campaign-wide record · not all strikes in Venezuela")).not.toBeInTheDocument();
  });

  it("keeps the Charlie Kirk fixture available as a separate case", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "Select investigation" }), { target: { value: "kirk" } });
    expect(screen.getByRole("heading", { name: "Charlie Kirk assassination — public-record reconstruction" })).toBeInTheDocument();
    expect(screen.getByText("Active criminal case · no guilt finding")).toBeInTheDocument();
  });

  it("keeps the Renee Good fixture available as a separate case", () => {
    render(<App />);
    fireEvent.change(screen.getByRole("combobox", { name: "Select investigation" }), { target: { value: "good" } });
    expect(screen.getByRole("heading", { name: "Renee Good killing - public-record reconstruction" })).toBeInTheDocument();
    expect(screen.getByText("Open state investigation · no charging decision")).toBeInTheDocument();
  });

  it("registers a local intake and prevents a duplicate existing case", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /Add subject/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Subject" }), { target: { value: "October 7th" } });
    fireEvent.click(screen.getByRole("button", { name: /Register intake/ }));
    expect(screen.getByRole("heading", { name: /subject in the governed engine/i })).toBeInTheDocument();
    expect(screen.getByText("October 7th")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Preparation progress for October 7th" })).toHaveAttribute("aria-valuenow", "8");

    fireEvent.click(screen.getByRole("button", { name: /Add research subject/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Subject" }), { target: { value: "Venezuela boat bombings" } });
    fireEvent.click(screen.getByRole("button", { name: /Register intake/ }));
    expect(screen.getByRole("heading", { name: "Already in the workspace" })).toBeInTheDocument();
    expect(within(screen.getByRole("alertdialog")).getByText("Southern Spear · vessel strikes")).toBeInTheDocument();
  });
});
