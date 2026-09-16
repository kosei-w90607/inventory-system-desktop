// src/features/home/components/ActionButton.tsx
//
// 入口 card 共通コンポーネント。navItemId で navigation SSOT を参照。
// 設計: docs/function-design/53-ui-home.md §53.1 / D-2 / B-10

import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { navigation } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";

function findNavItem(id: NavItem["id"]): NavItem | undefined {
  for (const area of navigation) {
    const found = area.items.find((item) => item.id === id);
    if (found) return found;
  }
  return undefined;
}

export interface ActionButtonProps {
  navItemId: NavItem["id"];
  variant?: "default" | "primary";
}

export function ActionButton({ navItemId, variant = "default" }: ActionButtonProps) {
  const item = findNavItem(navItemId);

  if (!item) {
    // navigation SSOT に未定義の id → コード変更時の検出のため fail-fast
    // pending パターンと整合 (HTML disabled でなく aria-disabled、「Unknown:」テキストで開発者警告維持)
    return (
      <Button variant="outline" aria-disabled="true" className="cursor-not-allowed opacity-60">
        Unknown: {navItemId}
      </Button>
    );
  }

  const Icon = item.icon;
  const baseClass = `w-full h-auto min-h-[4.5rem] grid grid-cols-[1.5rem_1fr] gap-3 items-start text-left text-base whitespace-normal ${variant === "primary" ? "border-primary bg-warning-soft" : ""}`;
  const content = (
    <>
      <Icon
        className={`size-6 h-6 w-6 ${variant === "primary" ? "text-primary" : "text-muted-foreground"}`}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block font-semibold">{item.label}</span>
        {item.description && (
          <span className="block text-sm text-muted-foreground">{item.description}</span>
        )}
      </span>
    </>
  );

  // pending: aria-disabled + Tooltip + cursor-not-allowed + onClick preventDefault の 3 層 (D-2 改訂)
  // shadcn 公式パターン: HTML `disabled` 属性は pointer-events を受けないため Tooltip が hover で起動しない。
  // `aria-disabled` で screen reader に伝達 + `onClick preventDefault` でクリック無効化 + `cursor-not-allowed` で
  // 視覚的に disabled を表現。これで Button が pointer-events を受けて Tooltip 起動可能。
  if (item.status === "pending" || item.to === null) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            className={`${baseClass} cursor-not-allowed opacity-60`}
            aria-disabled="true"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            {content}
          </Button>
        </TooltipTrigger>
        <TooltipContent>後続フェーズで着手予定</TooltipContent>
      </Tooltip>
    );
  }

  // active: TanStack Router <Link> で遷移
  return (
    <Button asChild variant="outline" className={baseClass}>
      <Link to={item.to}>{content}</Link>
    </Button>
  );
}
