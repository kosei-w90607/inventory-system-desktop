let pendingMainNavTarget: string | undefined;

export function markMainNavScroll(targetHref: string): void {
  pendingMainNavTarget = targetHref;
}

export function consumeMainNavScroll(): string | undefined {
  const targetHref = pendingMainNavTarget;
  pendingMainNavTarget = undefined;
  return targetHref;
}
