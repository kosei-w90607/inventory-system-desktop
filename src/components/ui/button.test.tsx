// src/components/ui/button.test.tsx
//
// SC1（Lane 5 S2）: variant="outline" は border-input（--border-strong）を持ち、
// variant="default" は誤って持たない（空集合 oracle 禁止の趣旨、過剰適用の対照 case）。

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Accordion, AccordionItem, AccordionTrigger } from "./accordion";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import { Progress } from "./progress";
import { ScrollArea } from "./scroll-area";
import { Table, TableBody, TableCell, TableRow } from "./table";

describe("Button (Lane 5 SC1)", () => {
  it('SC1: variant="outline" has border-input; variant="default" does not', () => {
    render(
      <>
        <Button variant="outline">枠あり</Button>
        <Button variant="default">既定</Button>
      </>,
    );

    const outlineButton = screen.getByRole("button", { name: "枠あり" });
    const defaultButton = screen.getByRole("button", { name: "既定" });

    expect(outlineButton).toHaveClass("border-input");
    expect(defaultButton).not.toHaveClass("border-input");
  });
});

it("SC11 / DSR-01: secondary action has the middle-level fill and border", () => {
  render(<Button variant="secondary">補助操作</Button>);
  const button = screen.getByRole("button", { name: "補助操作" });
  expect(button).toHaveAttribute("data-slot", "button");
  expect(button).toHaveAttribute("data-variant", "secondary");
  expect(button).toHaveClass(
    "border",
    "border-border-strong",
    "bg-secondary",
    "text-secondary-foreground",
    "hover:bg-secondary/80",
  );
  expect(button).not.toHaveClass("border-border");
});

// SPEC-COLOR-EMPHASIS-RT-1 / D-CE17（DSR-22 の操作枠 3:1 を focus にも）: 枠の無い部品と、
// focus の前後で枠の色が変わらない部品は、透過（/50）でなく不透明な ring で focus を示す。
// 合成後の比（7.28:1 / 6.97:1）は jsdom で測れないため packet の Contract Probe と AC-L3-15。
describe("conventions runtime: opaque focus ring (D-CE17)", () => {
  it.each(["default", "destructive", "ghost", "link"] as const)(
    "Button %s uses the opaque ring and no translucent ring",
    (variant) => {
      render(<Button variant={variant}>押す</Button>);
      const button = screen.getByRole("button", { name: "押す" });
      expect(button).toHaveClass("focus-visible:ring-[3px]", "focus-visible:ring-ring");
      expect(button).not.toHaveClass("focus-visible:ring-ring/50");
      expect(button).not.toHaveClass("focus-visible:ring-destructive/20");
    },
  );

  it("AccordionTrigger uses the opaque ring", () => {
    render(
      <Accordion type="single" collapsible>
        <AccordionItem value="a">
          <AccordionTrigger>開閉</AccordionTrigger>
        </AccordionItem>
      </Accordion>,
    );
    const trigger = screen.getByRole("button", { name: "開閉" });
    expect(trigger).toHaveClass("focus-visible:ring-ring");
    expect(trigger).not.toHaveClass("focus-visible:ring-ring/50");
  });

  it("ScrollArea viewport uses the opaque ring", () => {
    const { container } = render(<ScrollArea>中身</ScrollArea>);
    const viewport = container.querySelector('[data-slot="scroll-area-viewport"]');
    expect(viewport).toHaveClass("focus-visible:ring-ring");
    expect(viewport).not.toHaveClass("focus-visible:ring-ring/50");
  });

  it("checked Checkbox keeps the operation fill and uses the opaque ring", () => {
    render(<Checkbox checked aria-label="選ぶ" />);
    const checkbox = screen.getByRole("checkbox", { name: "選ぶ" });
    expect(checkbox).toHaveAttribute("data-state", "checked");
    expect(checkbox).toHaveClass(
      "data-[state=checked]:border-primary",
      "data-[state=checked]:bg-primary",
      "focus-visible:ring-ring",
    );
    expect(checkbox).not.toHaveClass("focus-visible:ring-ring/50");
  });
});

// SPEC-COLOR-EMPHASIS-RT-1 / D-CE4: 作業の進み具合の棒は進行中、比率は呼出し側で上書きする。
describe("conventions runtime: Progress indicator (D-CE4)", () => {
  it("paints the bar with the ongoing color by default", () => {
    const { container } = render(<Progress value={40} aria-label="進み" />);
    const bar = container.querySelector('[data-slot="progress-indicator"]');
    expect(bar).toHaveClass("bg-ongoing");
    expect(bar).not.toHaveClass("bg-warning");
  });

  it("lets indicatorClassName override the bar color", () => {
    const { container } = render(
      <Progress value={40} aria-label="比率" indicatorClassName="bg-muted-foreground" />,
    );
    const bar = container.querySelector('[data-slot="progress-indicator"]');
    expect(bar).toHaveClass("bg-muted-foreground");
    expect(bar).not.toHaveClass("bg-ongoing");
  });
});

// SPEC-COLOR-EMPHASIS-RT-1 / D-CE7: 最後のレコードを開いても詳細の行の左のバーを消さない。
// 描画（左 4px が残る）は jsdom で測れないため Contract Probe と AC-L3-9。
describe("conventions runtime: TableBody last row rule (D-CE7)", () => {
  it("removes only the bottom border of the last row", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>行</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const body = screen.getByText("行").closest("tbody");
    expect(body).toHaveClass("[&_tr:last-child]:border-b-0");
    expect(body).not.toHaveClass("[&_tr:last-child]:border-0");
  });

  it("keeps the stone defaults of TableRow for selected / expanded rows", () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>行</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByText("行").closest("tr")).toHaveClass(
      "has-aria-expanded:bg-muted/50",
      "data-[state=selected]:bg-muted",
    );
  });
});
