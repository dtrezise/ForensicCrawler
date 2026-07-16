import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("local review interface", () => {
  it("opens with the working scope and network boundary visible", () => {
    render(<App />);
    expect(screen.getByRole("heading", { name: "Apollo 11 landing-time reconciliation" })).toBeInTheDocument();
    expect(screen.getByText("Working investigation")).toBeInTheDocument();
    expect(screen.getByText("Network off")).toBeInTheDocument();
    expect(screen.getByText("3.1 sec unresolved")).toBeInTheDocument();
  });

  it("moves among evidence, contradictions, provenance, rights, and export views", () => {
    render(<App />);
    const nav = screen.getByRole("navigation");
    fireEvent.click(within(nav).getByRole("button", { name: "Evidence" }));
    expect(screen.getByRole("heading", { name: "Claims and exact source relationships" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Timeline" }));
    const alternateToggle = screen.getByRole("button", { name: "Alternate hypotheses" });
    fireEvent.click(alternateToggle);
    expect(alternateToggle).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Clock-source or synchronization differences")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: /Contradictions/ }));
    expect(screen.getByText("this discrepancy is not evidence of misconduct, deception, or falsification.")).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Provenance" }));
    expect(screen.getByRole("heading", { name: "Five-event integrity chain" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Rights review" }));
    expect(screen.getByRole("heading", { name: "No remote source bodies retained" })).toBeInTheDocument();
    fireEvent.click(within(nav).getByRole("button", { name: "Package export" }));
    expect(screen.getByRole("link", { name: "Download working JSON" })).toHaveAttribute("download", "apollo-11-landing.forensic-package.working.json");
  });

  it("filters official sources without changing the package", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "Evidence" }));
    const search = screen.getByRole("textbox", { name: "Search official sources" });
    fireEvent.change(search, { target: { value: "Mission Report" } });
    expect(screen.getByRole("heading", { name: "1 matching source" })).toBeInTheDocument();
    expect(screen.getByText("Apollo 11 Mission Report")).toBeInTheDocument();
    expect(screen.queryByText("NASA Images and Media Usage Guidelines")).not.toBeInTheDocument();
  });

  it("updates the inspector when a source is selected", () => {
    render(<App />);
    fireEvent.click(screen.getAllByText("Apollo 11 Mission Report")[0]!);
    const inspector = screen.getByRole("complementary", { name: "Record inspector" });
    expect(within(inspector).getByText("Official source")).toBeInTheDocument();
    expect(within(inspector).getByText("Report page 5-14")).toBeInTheDocument();
    expect(within(inspector).getByText(/Network approved:/)).toBeInTheDocument();
  });
});
