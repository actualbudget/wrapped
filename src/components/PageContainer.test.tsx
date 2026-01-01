import { describe, it, expect, vi } from "vitest";

import { render, screen } from "../test-utils/test-utils";
import { PageContainer } from "./PageContainer";

// Mock framer-motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, id, className, ...props }: React.ComponentProps<"div">) => (
      <div id={id} className={className} data-testid="motion-div" {...props}>
        {children}
      </div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => (
    <div data-testid="animate-presence">{children}</div>
  ),
}));

describe("PageContainer", () => {
  it("renders children", () => {
    render(
      <PageContainer id="test-page">
        <div>Test Content</div>
      </PageContainer>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("applies correct id", () => {
    render(
      <PageContainer id="my-page">
        <div>Content</div>
      </PageContainer>,
    );

    const container = screen.getByTestId("motion-div");
    expect(container.id).toBe("my-page");
  });

  it("applies custom className", () => {
    render(
      <PageContainer id="test-page" className="custom-class">
        <div>Content</div>
      </PageContainer>,
    );

    const container = screen.getByTestId("motion-div");
    expect(container.className).toContain("custom-class");
  });

  it("renders without className", () => {
    render(
      <PageContainer id="test-page">
        <div>Content</div>
      </PageContainer>,
    );

    const container = screen.getByTestId("motion-div");
    expect(container).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    render(
      <PageContainer id="test-page">
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </PageContainer>,
    );

    expect(screen.getByText("Child 1")).toBeInTheDocument();
    expect(screen.getByText("Child 2")).toBeInTheDocument();
    expect(screen.getByText("Child 3")).toBeInTheDocument();
  });

  it("renders complex nested content", () => {
    render(
      <PageContainer id="test-page">
        <header>
          <h1>Title</h1>
        </header>
        <main>
          <p>Content</p>
        </main>
      </PageContainer>,
    );

    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
