// src/features/products/components/StockUnitField.test.tsx

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type React from "react";
import { describe, expect, it, vi } from "vitest";

import { StockUnitField } from "./StockUnitField";

describe("StockUnitField (UI-01b-D6)", () => {
  it("proposes POS sync off for cm but preserves user override", async () => {
    const user = userEvent.setup();
    const onStockUnitChange = vi.fn();
    const onPosStockSyncChange = vi.fn();

    const { rerender } = render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={onStockUnitChange}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "cm" }));

    expect(onStockUnitChange).toHaveBeenCalledWith("cm");
    // checkbox onChange (touched 経路) は呼ばれない — suggest 経路を使う
    expect(onPosStockSyncChange).not.toHaveBeenCalled();

    rerender(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched
        onStockUnitChange={onStockUnitChange}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={vi.fn()}
      />,
    );
    onPosStockSyncChange.mockClear();

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "cm" }));

    expect(onPosStockSyncChange).not.toHaveBeenCalled();
  });

  // REQ-101 / UI-01b-D6: pcs→cm 自動提案が suggest 経路（touched を立てない）で発火する
  it("suggest: pcs→cm calls onPosStockSyncSuggest(false) without touching posSyncTouched", async () => {
    const user = userEvent.setup();
    const onPosStockSyncSuggest = vi.fn();
    const onPosStockSyncChange = vi.fn();

    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
      />,
    );

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "cm" }));

    // suggest 経路が false を提案する（= touched を立てない）
    expect(onPosStockSyncSuggest).toHaveBeenCalledWith(false);
    // touched を立てる onChange 経路は呼ばれない
    expect(onPosStockSyncChange).not.toHaveBeenCalled();
  });

  // REQ-101 / UI-01b-D6: pcs→cm→pcs（checkbox 未操作）で suggest が true を復元する
  it("suggest: pcs→cm→pcs without checkbox restores posStockSync to true via suggest", async () => {
    const user = userEvent.setup();
    const onPosStockSyncSuggest = vi.fn();
    const onPosStockSyncChange = vi.fn();

    const { rerender } = render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
      />,
    );

    // pcs→cm: suggest(false) が呼ばれる
    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "cm" }));
    expect(onPosStockSyncSuggest).toHaveBeenLastCalledWith(false);

    onPosStockSyncSuggest.mockClear();

    // cm→pcs（checkbox 未操作、posSyncTouched=false のまま）: suggest(true) が呼ばれる
    rerender(
      <StockUnitField
        mode="create"
        stockUnit="cm"
        posStockSync={false}
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
      />,
    );

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "個" }));

    expect(onPosStockSyncSuggest).toHaveBeenCalledWith(true);
    // touched を立てる onChange 経路は呼ばれない
    expect(onPosStockSyncChange).not.toHaveBeenCalled();
  });

  it("Codex round3 P2-class: 数量単位selectで「個」を選ぶとonStockUnitChangeがpcsで呼ばれる（cmとの内部値独立検査）", async () => {
    const user = userEvent.setup();
    const onStockUnitChange = vi.fn();

    render(
      <StockUnitField
        mode="edit"
        stockUnit="cm"
        posStockSync
        posSyncTouched
        onStockUnitChange={onStockUnitChange}
        onPosStockSyncChange={vi.fn()}
        onPosStockSyncSuggest={vi.fn()}
      />,
    );

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "個" }));

    expect(onStockUnitChange).toHaveBeenCalledWith("pcs");
  });

  // REQ-101 / UI-01b-D6: checkbox を明示操作（touched=true）後は単位変更でも suggest が発火しない
  it("suggest: after checkbox interaction (touched=true), unit change does not fire suggest", async () => {
    const user = userEvent.setup();
    const onPosStockSyncSuggest = vi.fn();

    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={true}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={vi.fn()}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
      />,
    );

    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "cm" }));

    // touched=true の場合 suggest は発火しない（利用者 override を尊重）
    expect(onPosStockSyncSuggest).not.toHaveBeenCalled();
  });

  // checkbox の onChange は引き続き onPosStockSyncChange（touched 経路）を使う
  it("checkbox onChange still calls onPosStockSyncChange (touched path)", async () => {
    const user = userEvent.setup();
    const onPosStockSyncChange = vi.fn();
    const onPosStockSyncSuggest = vi.fn();

    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
      />,
    );

    await user.click(screen.getByLabelText("POS販売で在庫を減らす"));

    // checkbox は touched 経路（onPosStockSyncChange）を使う
    expect(onPosStockSyncChange).toHaveBeenCalledWith(false);
    // suggest 経路は呼ばれない
    expect(onPosStockSyncSuggest).not.toHaveBeenCalled();
  });

  it("SC5: 数量単位selectはSelect combobox（data-slot=select-trigger）である", () => {
    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={vi.fn()}
        onPosStockSyncSuggest={vi.fn()}
      />,
    );

    const trigger = screen.getByLabelText("数量単位");
    expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("SC4f: 数量単位selectがbg-control-surfaceでbg-backgroundを持たない、POS販売チェックボックスは無変更", () => {
    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={vi.fn()}
        onPosStockSyncChange={vi.fn()}
        onPosStockSyncSuggest={vi.fn()}
      />,
    );

    const stockUnitSelect = screen.getByLabelText("数量単位");
    expect(stockUnitSelect).toHaveClass("bg-control-surface");
    expect(stockUnitSelect).not.toHaveClass("bg-background");

    const posSyncCheckbox = screen.getByLabelText("POS販売で在庫を減らす");
    expect(posSyncCheckbox).not.toHaveClass("bg-control-surface");
  });
});

// UI-01b-D22 / REQ-101: 単位は 12 個の表示の語、在庫連動の提案は長さの単位で false・個数の単位で true
describe("StockUnitField (UI-01b-D22)", () => {
  function renderField(props: Partial<React.ComponentProps<typeof StockUnitField>> = {}) {
    const onStockUnitChange = vi.fn();
    const onPosStockSyncSuggest = vi.fn();
    const onPosStockSyncChange = vi.fn();
    render(
      <StockUnitField
        mode="create"
        stockUnit="pcs"
        posStockSync
        posSyncTouched={false}
        onStockUnitChange={onStockUnitChange}
        onPosStockSyncChange={onPosStockSyncChange}
        onPosStockSyncSuggest={onPosStockSyncSuggest}
        {...props}
      />,
    );
    return { onStockUnitChange, onPosStockSyncSuggest, onPosStockSyncChange };
  }

  it("UI-01b-D22: select に 12 個の表示の語が正本の表の順で出る", async () => {
    const user = userEvent.setup();
    renderField();
    await user.click(screen.getByLabelText("数量単位"));
    const options = await screen.findAllByRole("option");
    expect(options.map((option) => option.textContent)).toEqual([
      "個",
      "枚",
      "本",
      "袋",
      "箱",
      "巻",
      "組",
      "セット",
      "玉",
      "丁",
      "m",
      "cm",
    ]);
  });

  it.each([
    ["pcs", "m", "m", false],
    ["pcs", "cm", "cm", false],
    ["pcs", "玉", "ball", true],
    ["m", "玉", "ball", true],
    ["ball", "m", "m", false],
    ["cm", "枚", "sheet", true],
  ] as const)(
    "UI-01b-D22: 未操作で %s から「%s」へ替えると %s を選び、在庫連動は %s を提案する",
    async (from, label, code, suggested) => {
      const user = userEvent.setup();
      const { onStockUnitChange, onPosStockSyncSuggest, onPosStockSyncChange } = renderField({
        stockUnit: from,
      });
      await user.click(screen.getByLabelText("数量単位"));
      await user.click(await screen.findByRole("option", { name: label }));
      expect(onStockUnitChange).toHaveBeenCalledWith(code);
      expect(onPosStockSyncSuggest).toHaveBeenCalledWith(suggested);
      expect(onPosStockSyncChange).not.toHaveBeenCalled();
    },
  );

  it("UI-01b-D22: checkbox を触った後と edit では、単位を替えても提案しない", async () => {
    const user = userEvent.setup();
    const touched = renderField({ posSyncTouched: true });
    await user.click(screen.getByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "m" }));
    expect(touched.onStockUnitChange).toHaveBeenCalledWith("m");
    expect(touched.onPosStockSyncSuggest).not.toHaveBeenCalled();
  });

  it.each([
    ["m", "create", true],
    ["cm", "create", true],
    ["ball", "create", false],
    ["pcs", "create", false],
    ["m", "edit", false],
  ] as const)(
    "UI-01b-D22: 提案の案内は create の %s（%s）で出るか = %s",
    (stockUnit, mode, shown) => {
      renderField({ stockUnit, mode, readOnly: mode === "edit" });
      const note = screen.queryByText(/在庫同期しない設定を提案します/);
      if (shown) expect(note).toBeInTheDocument();
      else expect(note).toBeNull();
    },
  );
});
