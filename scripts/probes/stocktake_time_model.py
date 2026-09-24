#!/usr/bin/env python3
"""Synthetic design probe, not application code or a POS parser.

Run: python3 scripts/probes/stocktake_time_model.py
Contracts: REQ-205 / REQ-401, SPEC-STK-TIME-D1..D8.
The oracle knows physical event times; the classifier sees only evidence bounds.
The clock-interval part (bound_clock_interval, classify's trusted branch, check_bounds)
no longer backs the ADR contract; it is kept as input for the next design lane.
No filesystem input, store data, dependencies, or writes.
"""

from copy import deepcopy
from dataclasses import dataclass, replace
from itertools import product


@dataclass(frozen=True)
class Source:
    received: int
    lower: int | None = None
    upper: int | None = None
    trusted: bool = False


@dataclass(frozen=True)
class Count:
    # Bounds after timestamp granularity / measured clock uncertainty expansion.
    start: int
    end: int
    sources: int
    legacy: bool = False
    # Latest possible START, including timestamp precision and observation error.
    # None means unknown; end is the latest SAVE and is not a substitute.
    start_latest: int | None = None


def bound_clock_interval(lower: int | None, upper: int | None, quantum: int, error: int):
    """Reported timestamps are the starts of their representable buckets."""
    assert quantum > 0 and error >= 0
    return (
        lower - error if lower is not None else None,
        upper + quantum + error if upper is not None else None,
    )


def qualified_source(source: Source, count: Count | None) -> Source:
    """Clock diagnostics precede causal early returns; receipt evidence survives."""
    reversed_bounds = source.lower is not None and source.upper is not None and source.lower > source.upper
    causal_conflict = (
        count is not None and not count.legacy and source.received <= count.sources
        and count.start_latest is not None
        and source.lower is not None and source.lower > count.start_latest
    )
    return replace(source, trusted=False) if reversed_bounds or causal_conflict else source


def classify(source: Source, count: Count | None) -> str:
    assert source.received > 0
    source = qualified_source(source, count)
    if count is None:
        return "after"  # genuinely never counted, not legacy evidence
    if count.legacy:
        return "unknown"
    if source.received <= count.sources:
        return "before"
    if source.trusted:
        if source.upper is not None and source.upper < count.start:
            return "before"
        if source.lower is not None and source.lower > count.end:
            return "after"
    return "unknown"


def classify_row(source: Source, candidates: list[tuple[bool, Count | None]]) -> str:
    decisions = [classify(source, count) for sync, count in candidates if sync]
    if not decisions:
        return "no_stock"
    if len(candidates) > 1:
        return "before" if all(d == "before" for d in decisions) else "unknown"
    return decisions[0]


def migration_kind(actual: int | None, counted_at: str | None, snapshot: int) -> str:
    if actual is None and counted_at is None:
        return "uncounted"
    if actual == 0 and counted_at is None and snapshot == 0:
        return "auto_filled"
    return "legacy"  # includes malformed legacy rows, never invent measured evidence


Names = frozenset[tuple[int, str]]  # (scanning code, register-side name) pairs of one Z004
BASE_NAMES: Names = frozenset({(1, "P"), (2, "Q")})
DEPARTMENTS = frozenset({"D1"})  # department names on the register
PRODUCT = 1  # each Ledger models the product with this scanning code


def z004_names(register: dict[int, tuple[str, int]]) -> Names:
    """Z004 shows scanning code and name but no price (ADR D5)."""
    return frozenset((code, name) for code, (name, _price) in register.items())


PENDING, MAPPING, LINES = "offset_check_pending", "offset_mapping_changed", "offset_lines_present"
# The previous Z004 of an interval as BIZ knows it from its receipts (ADR D5), when not its pairs:
FIRST = "first"  # no Z004 of this machine_no was received before this one
ROLLED_BACK = "rolled_back"  # a received settlement_no arrived again as another settlement (reset)
EARLIER = "earlier"  # settlement_no below the smallest received: its previous cannot be proven
UNRECEIVED = "unreceived"  # Z004s were received, but not the directly preceding settlement_no
Previous = Names | str


class Machine:
    """Z004 receipts of one machine_no; "previous" is the directly preceding settlement_no."""

    def __init__(self) -> None:
        # Receipts since the last going-back: previous candidates and the settlement identities
        # that smallest / largest / gap / going-back are judged against.
        self.pairs: dict[int, Names] = {}
        self.ids: dict[int, str] = {}
        self.firsts: set[int] = set()  # settlement_nos received when nothing else was

    def receive(self, settlement_no: int, names: Names = BASE_NAMES, identity: str = "") -> Previous:
        """Decided at the Z004 import, before and without the EJ. A gap between the smallest and
        the largest received is filled as an ordinary late receipt."""
        if not self.ids:
            self.firsts.add(settlement_no)
        back = self.ids.get(settlement_no, identity) != identity  # same number, another settlement
        if back:  # never pair later Z004s with receipts from before the going-back
            self.pairs, self.ids, self.firsts = {}, {}, set()
        earlier = bool(self.ids) and settlement_no < min(self.ids)
        self.ids[settlement_no] = identity
        self.pairs[settlement_no] = names
        if back:
            return ROLLED_BACK
        return EARLIER if earlier else self.previous(settlement_no)

    def previous(self, settlement_no: int) -> Previous:
        if settlement_no - 1 in self.pairs:
            return self.pairs[settlement_no - 1]
        return FIRST if settlement_no in self.firsts else UNRECEIVED


def changed_names(previous: Names, current: Names) -> frozenset[str]:
    """ADR D5: {name | (code, name) in previous - current}."""
    return frozenset(name for _code, name in previous - current)


def candidates(name: str, ej: "EJ", previous: Names) -> frozenset[int] | None:
    """ADR D5: products a detail line may belong to; empty = department sale; None = matches nothing.

    Several products (16-byte truncation), a product and a department, or a changed name do
    not make the interval incomplete: every candidate is treated as having a line.
    """
    current = {code for code, n in ej.z004 if n == name}
    if name in changed_names(previous, ej.z004):
        return frozenset(current | {code for code, n in previous if n == name})
    if current:
        return frozenset(current)
    return frozenset() if name in DEPARTMENTS else None


def units(ej: "EJ", previous: Names) -> list[tuple[set[str], set[int]]]:
    """ADR D5: names and codes joined by candidate sets (connected components)."""
    found: list[tuple[set[str], set[int]]] = []
    for name in dict.fromkeys(ej.lines):
        owners = candidates(name, ej, previous)
        if not owners:
            continue  # department sale, or a line matching nothing
        names, codes = {name}, set(owners)
        for unit in [u for u in found if u[1] & codes]:
            found.remove(unit)
            names |= unit[0]
            codes |= unit[1]
        found.append((names, codes))
    return found


def totals_match(ej: "EJ", previous: Names) -> bool:
    """Signed EJ lines against Z004 slot quantities, one comparison per unit (ADR D5)."""
    qty = dict(ej.z004_qty)  # every slot, whether or not an app product uses the code
    signed = dict.fromkeys(ej.lines, 0)
    for name, quantity in zip(ej.lines, ej.signed):
        signed[name] += quantity
    current = {code for code, _name in ej.z004}
    covered: set[int] = set()
    for names, codes in units(ej, previous):
        covered |= codes
        if names & DEPARTMENTS:
            continue  # lines of this name cannot be told from department sales; they flag candidates
        if codes - current:
            continue  # a code cleared from the register may drop unsettled sales (clear-line premise)
        if sum(signed[n] for n in names) != sum(qty.get(c, 0) for c in codes):
            return False
    return all(q == 0 for code, q in qty.items() if code not in covered)


@dataclass(frozen=True)
class EJ:
    """One synthetic EJ settlement interval, already classified by the EJ parser (ADR D5)."""
    lines: tuple[str, ...] = ()  # register-side names on detail lines (products and departments)
    signed: tuple[int, ...] = ()  # signed quantity per detail line; omitted = 0 (a sale and its return)
    non_item_lines: int = 0  # totals / payment / tax: known, never make the interval incomplete
    same_settlement: bool = True
    sequence_complete: bool = True
    start: bool | None = True  # start evidence matches the received previous Z004 / contradicts / none
    z004: Names = BASE_NAMES  # Z004 of this settlement
    z004_qty: tuple[tuple[int, int], ...] = ()  # (code, net quantity) per slot; omitted = 0

    def complete(self, previous: Names) -> bool:
        return (self.same_settlement and self.sequence_complete and self.start is True
                and totals_match(self, previous))


def offset_targets(counted: frozenset[int], current: Names, previous: Previous) -> frozenset[int]:
    """ADR D4, clear-line premise true: counted stock-synced products whose 0/0 row is judged.

    Codes of this Z004, codes only in the previous one (cleared with their unsettled sales), and,
    while the previous Z004 is not received, every counted product this Z004 has no row for.
    """
    if isinstance(previous, str):
        return counted
    return counted & {code for code, _name in current | previous}


def offset_reason(ej: EJ | None, previous: Previous = BASE_NAMES, code: int = PRODUCT) -> str | None:
    """Zero-quantity, zero-amount row of a counted product (ADR D4, sale/return offset)."""
    if previous in (FIRST, ROLLED_BACK, EARLIER):
        return MAPPING  # decided at the Z004 import, before looking at any EJ
    if previous == UNRECEIVED or ej is None:
        return PENDING  # lines matching nothing are judged only against a received previous Z004
    owners = [candidates(name, ej, previous) for name in ej.lines]
    if None in owners or ej.start is False:
        return MAPPING  # judged before completeness and lines; a re-imported EJ cannot fix it
    if not ej.complete(previous):
        return PENDING  # includes an EJ without start evidence
    return LINES if any(code in o for o in owners) else None


@dataclass
class Movement:
    id: int
    quantity: int
    active: bool = True


@dataclass
class Observation:
    order: int
    cursor: int | None
    actual: int
    snapshot: int
    state: str  # pending / applied / superseded
    legacy: bool = False
    time: Count | None = None
    auto_filled: bool = False
    sources: int = 0  # receipt cursor fixed when the count started


class Ledger:
    def __init__(self, opening: int = 10, code: int = PRODUCT):
        self.code = code  # scanning code of the modelled product
        self.movements = [Movement(1, opening)]
        self.observations: list[Observation] = []
        self.revision = 0
        self.legacy_ceiling = 0
        self.active_item = False  # an uncounted item owns the active flow too
        self.received = 0  # max pos_import_sources id
        # source -> (reason, creating import, previous_recheck_pending: a registration change made
        # while the directly preceding Z004 was unreceived — first interval, below the smallest
        # received, going-back — whose reevaluation with that Z004 is not committed yet)
        self.flags: dict[int, tuple[str, int, bool]] = {}
        self.imports: dict[int, list[int]] = {}  # import id -> movement ids

    @property
    def stock(self) -> int:
        return sum(m.quantity for m in self.movements if m.active)

    def move(self, quantity: int) -> int:
        assert quantity != 0, "zero movements are not evidence markers"
        movement = Movement(len(self.movements) + 1, quantity)
        self.movements.append(movement)
        self.revision += 1
        return movement.id

    def observe(self, actual: int, *, immediate: bool = False, time: Count | None = None) -> Observation:
        pending = [o for o in self.observations if o.state == "pending"]
        if immediate and self.active_item:
            raise ValueError("use the active stocktake count")
        for old in pending:
            old.state = "superseded"
        snapshot = self.stock
        cursor = self.movements[-1].id  # before the recount's own correction
        if immediate and actual != snapshot:
            self.move(actual - snapshot)
        self.revision += 1
        observation = Observation(
            self.revision, cursor, actual, snapshot,
            "applied" if immediate else "pending",
            time=time, sources=self.received,
        )
        self.observations.append(observation)
        # A new count resolves flags for sources it already covered at start.
        self.flags = {s: f for s, f in self.flags.items() if s > observation.sources}
        if not immediate:
            self.active_item = True
        return observation

    def force_fill(self, *, needs_recheck: bool = False) -> Observation:
        if needs_recheck or any(o.state == "pending" for o in self.observations):
            raise ValueError("force_fill cannot bypass a count or its recheck")
        quantity = max(self.stock, 0)
        self.revision += 1
        fill = Observation(self.revision, None, quantity, quantity, "pending", auto_filled=True)
        self.observations.append(fill)
        self.active_item = True
        return fill

    def complete(self) -> None:
        # Any unresolved flag of a product with an item blocks completion, whatever the item's kind
        # (uncounted, auto_filled, measured), the latest count's owner or the flag's reason.
        if self.flags and self.active_item:
            raise ValueError("an unresolved recount flag blocks completion, even with force_fill")
        for observation in self.observations:
            if observation.state != "pending":
                continue
            correction = observation.actual - observation.snapshot
            if correction:
                self.move(correction)
            observation.state = "applied"
        self.revision += 1
        self.active_item = False

    def cancel(self, movement_id: int) -> None:
        self.cancel_import([movement_id])

    def cancel_import(self, movement_ids: list[int]) -> None:
        # One product's movements from ONE import TX: no count can split this batch.
        movements = [self.movements[i - 1] for i in movement_ids if self.movements[i - 1].active]
        net = sum(m.quantity for m in movements)
        if net and any(self.needs_legacy_recheck(m.id) for m in movements):
            raise ValueError("legacy cancellation needs a fresh applied recount")
        if not movements:
            return
        for movement in movements:
            movement.active = False
        self.revision += 1  # void/flag state changes even when the net is zero
        absorbed = [
            o for o in self.observations
            if not o.legacy and o.state != "superseded"
            and o.cursor is not None and o.cursor >= max(m.id for m in movements)
        ]
        first = min(absorbed, key=lambda o: o.order) if absorbed else None
        if first is not None:
            if first.state == "pending":
                first.snapshot -= net
            elif net:
                self.move(net)

    def migrate_legacy(self) -> None:
        self.legacy_ceiling = self.movements[-1].id
        for observation in self.observations:
            if not observation.auto_filled:
                observation.legacy = True

    def needs_legacy_recheck(self, movement_id: int) -> bool:
        uncertain = any(o.legacy and o.state != "superseded" for o in self.observations)
        applied_proof = any(
            not o.legacy and o.state == "applied" and o.cursor is not None and o.cursor >= movement_id
            for o in self.observations
        )
        return uncertain and movement_id <= self.legacy_ceiling and not applied_proof

    def receive(self) -> int:
        self.received += 1
        return self.received

    def latest(self) -> Observation | None:
        valid = [o for o in self.observations if o.state != "superseded" and not o.auto_filled]
        return max(valid, key=lambda o: o.order) if valid else None

    def import_row(self, source: int, sold: int, amount: int = 0, ej: EJ | None = None,
                   previous: Previous = BASE_NAMES) -> int:
        """One Z004 row of this product, classified by receipt order only (ADR D4)."""
        basis = self.latest()
        reason = None
        if basis is not None and basis.legacy:
            reason = "legacy_basis"
        elif basis is not None and source <= basis.sources:
            sold = 0  # before the count: sales and returns do not move stock
        elif basis is not None:
            if sold:
                reason = "sale_order_unknown"
            elif amount:
                reason = LINES
            else:
                reason = offset_reason(ej, previous, self.code)
        import_id = len(self.imports) + 1
        self.imports[import_id] = [self.move(-sold)] if sold else []
        if reason:
            self.set_flag(source, reason, import_id, previous)
        return import_id

    def set_flag(self, source: int, reason: str | None, import_id: int, previous: Previous) -> None:
        before = self.flags.get(source)
        if reason is None:
            self.flags.pop(source, None)
        else:
            unreceived = previous in (FIRST, EARLIER, ROLLED_BACK)
            self.flags[source] = (reason, import_id, reason == MAPPING and unreceived)
        if self.flags.get(source) != before:
            self.revision += 1  # D1: actual flag/marker changes invalidate open counts

    def reevaluate(self, source: int, ej: EJ | None, previous: Previous = BASE_NAMES,
                   current: Names | None = None) -> None:
        """Inside the business TX importing the interval's EJ or previous Z004 (never a receipt
        alone, see ImportModel): re-judge a pending check, and a marked registration change once
        the directly preceding Z004 is usable. A
        product without a row in this Z004 (`current`, default the EJ's) and not in the received
        previous one is no longer a target and is resolved."""
        flag = self.flags.get(source)
        # A marked registration change waits for its directly preceding Z004, not for an EJ.
        # Other registration changes: recount only.
        if flag and (flag[0] == PENDING or flag[2] and not isinstance(previous, str)):
            if current is None:
                current = ej.z004 if ej else BASE_NAMES
            target = offset_targets(frozenset({self.code}), current, previous)
            reason = offset_reason(ej, previous, self.code) if target else None
            self.set_flag(source, reason, flag[1], previous)

    def rollback(self, import_id: int) -> None:
        self.cancel_import(self.imports[import_id])  # a legacy hold raises before any write
        self.flags = {s: f for s, f in self.flags.items() if f[1] != import_id}


def check_bounds() -> None:
    # Test actual event times independently of classify's chosen branch.
    for s, e, lo, hi in product(range(5), repeat=4):
        if s > e or lo > hi:
            continue
        count = Count(s, e, 0)
        decision = classify(Source(1, lo, hi, True), count)
        for actual_count, actual_event in product(range(s, e + 1), range(lo, hi + 1)):
            if decision == "before":
                assert actual_event < actual_count
            if decision == "after":
                assert actual_event > actual_count


def check_counterexamples() -> None:
    # With no lower bound, an overlapping upper bound cannot prove AFTER.
    assert classify(Source(1, None, 100, True), Count(20, 21, 0)) == "unknown"
    assert classify(Source(1, None, 10, True), Count(20, 21, 0)) == "before"
    # The old saved-at-only rule would skip this overlapping count window.
    assert classify(Source(1, 0, 40, True), Count(0, 60, 0)) == "unknown"
    assert classify(Source(1, 0, 10, True), Count(10, 20, 0)) == "unknown"
    # Bad clocks and missing times have the same causal recovery.
    assert classify(Source(1, 1000, 2000, False), Count(20, 21, 0)) == "unknown"
    assert classify(Source(1, 1000, 2000, False), Count(20, 21, 1)) == "before"
    # Received during the count must not be promoted to received before it.
    assert classify(Source(2), Count(20, 21, 1)) == "unknown"
    assert classify(Source(2), Count(22, 23, 2)) == "before"
    assert classify(Source(1), Count(20, 21, 0, legacy=True)) == "unknown"
    assert classify(Source(1), None) == "after"
    # Net zero sales may have a nonzero post-count stock effect.
    count = Count(10, 11, 0)
    transactions = [(Source(1, 5, 5, True), 2), (Source(1, 15, 15, True), -2)]
    assert sum(q for _, q in transactions) == 0
    stock_delta = -sum(q for source, q in transactions if classify(source, count) == "after")
    assert stock_delta == 2
    # Clock error AND timestamp granularity must expand the reported end.
    lo, hi = bound_clock_interval(0, 10, quantum=1, error=1)
    assert classify(Source(1, lo, hi, True), Count(12, 13, 0)) == "unknown"
    assert classify(Source(1, lo, hi, True), Count(13, 14, 0)) == "before"
    assert bound_clock_interval(None, 10, 1, 1) == (None, 12)
    assert classify(Source(1, 20, 0, True), Count(10, 11, 0)) == "unknown"
    # Causal proof still works, but MUST NOT carry contradictory clock trust forward.
    conflict = Source(1, 20, 30, True)
    assert not qualified_source(conflict, Count(10, 11, 1, start_latest=10)).trusted
    assert classify(conflict, Count(10, 11, 1, start_latest=10)) == "before"
    invalidated = qualified_source(conflict, Count(10, 11, 1, start_latest=10))
    assert classify(invalidated, Count(10, 11, 0)) == "unknown"
    assert qualified_source(Source(1, 0, 5, True), Count(10, 11, 1)).trusted
    # REQ-401 / D3: contradiction means after EVERY possible start, not after save.
    start_earliest, start_latest = bound_clock_interval(100, 100, quantum=1, error=2)
    uncertain_start = Count(start_earliest, 122, 1, start_latest=start_latest)
    assert (start_earliest, start_latest) == (98, 103)
    inside_window = Source(1, 104, 110, True)
    assert not qualified_source(inside_window, uncertain_start).trusted
    assert classify(inside_window, uncertain_start) == "before"  # receipt still proves this
    assert qualified_source(Source(1, 99, 100, True), uncertain_start).trusted
    assert qualified_source(Source(1, 103, 110, True), uncertain_start).trusted  # touching
    # Sale at 99.5, receipt at 99.75, true start at 100 is consistent with these bounds.
    assert qualified_source(inside_window, Count(98, 122, 1)).trusted  # unknown start bound
    assert classify(Source(2, 104, 110, True), uncertain_start) == "unknown"
    assert classify(Source(2, 123, 130, True), uncertain_start) == "after"  # AFTER still uses E
    # Expand the COUNT side too: exact ends would incorrectly classify both cases.
    s, e = bound_clock_interval(10, 11, quantum=1, error=1)
    assert (s, e) == (9, 13)
    assert classify(Source(1, 12, 12, True), Count(s, e, 0)) == "unknown"
    assert classify(Source(1, 9, 9, True), Count(s, e, 0)) == "unknown"
    assert classify(Source(1, 14, 14, True), Count(s, e, 0)) == "after"
    assert classify_row(Source(1), [(True, None), (True, Count(5, 6, 0))]) == "unknown"
    assert classify_row(Source(1), [(True, Count(5, 6, 1)), (True, Count(7, 8, 1))]) == "before"
    assert classify_row(Source(1), [(False, None), (True, None)]) == "unknown"
    assert classify_row(Source(1), [(False, None), (False, None)]) == "no_stock"


def check_diagnostic_order() -> None:
    # REQ-401 / D3-D4: observe the diagnostic result, not just the unchanged stock decision.
    global qualified_source
    original = qualified_source
    inspected_trust = []

    def recording(source: Source, count: Count | None) -> Source:
        checked = original(source, count)
        inspected_trust.append(checked.trusted)
        return checked

    qualified_source = recording
    try:
        assert classify(Source(1, 20, 0, True), Count(10, 11, 0, legacy=True)) == "unknown"
        assert inspected_trust == [False], "legacy early return bypassed clock diagnostics"
    finally:
        qualified_source = original


def check_lifecycle() -> None:
    # REQ-401 / D6: one product, one import TX, one net correction at most.
    for quantities in ((-2, 2), (-3, 1)):
        for applied in (False, True):
            ledger = Ledger()
            imported = [ledger.move(q) for q in quantities]
            first = ledger.observe(8)
            if applied:
                ledger.complete()
                later = ledger.observe(7)  # cancellation must not touch this snapshot
                later_snapshot = later.snapshot
            before = len(ledger.movements)
            ledger.cancel_import(imported)
            compensation = ledger.movements[before:]
            assert all(not ledger.movements[i - 1].active for i in imported)
            if applied:
                assert [m.quantity for m in compensation] == ([-2] if quantities == (-3, 1) else [])
                assert ledger.stock == 8 and later.snapshot == later_snapshot
                ledger.complete()
                assert ledger.stock == 7
            else:
                assert not compensation and first.snapshot == 10
                ledger.complete()
                assert ledger.stock == 8

    for quantity in (-3, -1, 1, 3):
        for immediate in (False, True):
            ledger = Ledger()
            imported = ledger.move(quantity)
            ledger.observe(10, immediate=immediate)
            ledger.cancel(imported)
            ledger.complete()
            assert ledger.stock == 10
            ledger.cancel(imported)  # repeat must not compensate twice
            assert ledger.stock == 10

        ledger = Ledger()
        ledger.observe(10)
        imported = ledger.move(quantity)  # after count, even if same wall-clock second
        ledger.cancel(imported)
        ledger.complete()
        assert ledger.stock == 10

        ledger = Ledger()
        imported = ledger.move(quantity)
        observed = ledger.observe(8)
        ledger.complete()  # pending -> applied BEFORE cancellation
        ledger.move(4)
        ledger.cancel(imported)
        assert ledger.stock == 12 and observed.actual == 8

        ledger = Ledger()
        imported = ledger.move(quantity)
        ledger.observe(10)
        ledger.move(5)
        latest = ledger.observe(15)  # replaces the old pending snapshot
        ledger.cancel(imported)
        assert latest.actual - latest.snapshot == 0
        ledger.complete()
        assert ledger.stock == 15

        ledger = Ledger()
        imported = ledger.move(quantity)
        first = ledger.observe(10, immediate=True)
        second = ledger.observe(10, immediate=True)  # possible equal ledger cursors
        pending = ledger.observe(8)  # newer pending difference must survive cancellation
        stock_before_cancel = ledger.stock
        snapshot_before_cancel = pending.snapshot
        ledger.cancel(imported)
        assert ledger.stock == stock_before_cancel
        assert pending.snapshot == snapshot_before_cancel
        ledger.complete()
        assert first.order < second.order
        assert ledger.stock == 8

    ledger = Ledger()
    ledger.move(-1)
    ledger.move(1)
    assert ledger.stock == 10  # offsetting movements; context ABA rejection is a runtime test
    count = ledger.observe(8, immediate=True)
    ledger.move(-1)
    assert ledger.stock == 7 and count.actual == 8  # no delayed overwrite at import

    ledger = Ledger()
    imported = ledger.move(-2)
    recount = ledger.observe(9, immediate=True)
    correction = ledger.movements[-1]
    ledger.cancel(imported)
    assert ledger.stock == 9 and recount in ledger.observations and correction.active
    assert (recount.actual, recount.snapshot) == (9, 8)  # append-only fact is intact

    # REQ-205 / D7: completion releases the active owner so the correction exit is usable.
    ledger = Ledger()
    ledger.observe(8)
    ledger.complete()
    corrected = ledger.observe(7, immediate=True)
    assert ledger.stock == 7 and corrected.state == "applied"

    for measured in (False, True):
        ledger = Ledger()
        ledger.active_item = True
        if measured:
            ledger.observe(8)
        try:
            ledger.observe(6, immediate=True)
        except ValueError:
            pass
        else:
            raise AssertionError("independent recount must not bypass an active item")


def check_legacy_recovery() -> None:
    # REQ-205 / D6: hold before void; release only through a normal APPLIED count.
    for quantity, active in product((-3, 3), ("none", "uncounted", "measured")):
        ledger = Ledger()
        imported = ledger.move(quantity)
        ledger.observe(10)
        ledger.complete()
        ledger.migrate_legacy()
        if active == "measured":
            ledger.observe(8)  # a new pending alone must not release the hold
        elif active == "uncounted":
            ledger.active_item = True
        stock_before = ledger.stock
        try:
            ledger.cancel(imported)
        except ValueError:
            assert ledger.stock == stock_before and ledger.movements[imported - 1].active
        else:
            raise AssertionError("unknown legacy absorption silently undone")
        if active == "none":
            ledger.observe(8, immediate=True)  # independent recount
        else:
            try:
                ledger.observe(8, immediate=True)
            except ValueError:
                pass
            else:
                raise AssertionError("release bypassed the active item")
            ledger.observe(8)
            ledger.complete()  # count and complete the active stocktake
        assert ledger.stock == 8
        ledger.cancel(imported)  # retry: undo and compensation cancel out
        assert ledger.stock == 8 and not ledger.movements[imported - 1].active
        ledger.move(4)  # a later movement survives completion and repeated cancel
        ledger.complete()
        ledger.cancel(imported)
        assert ledger.stock == 12

    ledger = Ledger()
    ledger.observe(10)
    ledger.complete()
    ledger.migrate_legacy()
    new_import = ledger.move(-2)
    ledger.cancel(new_import)  # new movement cannot be absorbed by a legacy observation
    assert ledger.stock == 10

    # Migration while pending: the old pending is legacy; counting the item releases it.
    ledger = Ledger()
    imported = ledger.move(-3)
    ledger.observe(10)
    ledger.migrate_legacy()
    try:
        ledger.cancel(imported)
    except ValueError:
        pass
    else:
        raise AssertionError("legacy pending did not hold the cancellation")
    ledger.observe(8)
    ledger.complete()
    ledger.cancel(imported)
    assert ledger.stock == 8


def reason_of(ledger: Ledger, source: int) -> str | None:
    return ledger.flags.get(source, (None, None))[0]


def refused(close) -> bool:
    try:
        close()
    except ValueError:
        return True
    return False


def check_unknown_apply_recheck() -> None:
    # REQ-205 / REQ-401, ADR D4: Unknown is applied as usual and flagged per (product, source).
    # Confirmed product P: book 10 converges to physical 8 in all four cases.
    for sold_before_count in (False, True):
        for cancel_before_recount in (False, True):
            ledger = Ledger()
            ledger.observe(8 if sold_before_count else 10)  # physical at the count
            ledger.complete()
            source = ledger.receive()  # Z004 received after the count started
            imported = ledger.import_row(source, sold=2)
            assert ledger.stock == (6 if sold_before_count else 8)  # applied, not skipped
            assert reason_of(ledger, source) == "sale_order_unknown"
            if cancel_before_recount:
                ledger.rollback(imported)
                assert not ledger.flags
                if sold_before_count:
                    assert ledger.stock == 8
                continue
            recount = ledger.observe(8, immediate=True)  # physical 8
            assert recount.actual - recount.snapshot == (2 if sold_before_count else 0)
            assert ledger.stock == 8 and not ledger.flags
            ledger.rollback(imported)  # undo +2 and compensation -2 cancel out
            assert ledger.stock == 8

    # In-progress stocktake: completion (and force_fill) wait for a fresh count.
    for sold_before_count in (False, True):
        ledger = Ledger()
        ledger.observe(8 if sold_before_count else 10)
        source = ledger.receive()
        imported = ledger.import_row(source, sold=2)
        for close in (ledger.complete, ledger.force_fill):
            try:
                close()
            except ValueError:
                pass
            else:
                raise AssertionError("unresolved flag was bypassed")
        ledger.observe(8)
        assert not ledger.flags
        ledger.complete()
        assert ledger.stock == 8
    ledger = Ledger()
    ledger.observe(10)
    imported = ledger.import_row(ledger.receive(), sold=2)
    ledger.rollback(imported)  # cancelling the import also resolves its flag
    assert not ledger.flags
    ledger.complete()
    assert ledger.stock == 10

    # Received before the count: skipped without a flag. Legacy basis: flagged whatever the quantity.
    ledger = Ledger()
    source = ledger.receive()
    ledger.observe(8, immediate=True)
    ledger.import_row(source, sold=2)
    assert ledger.stock == 8 and not ledger.flags
    ledger = Ledger()
    ledger.observe(10)
    ledger.complete()
    ledger.migrate_legacy()
    source = ledger.receive()
    ledger.import_row(source, sold=0)
    assert reason_of(ledger, source) == "legacy_basis"

    # Sale before the count, return after it, same settlement: Z004 shows 0 / 0.
    def offset_case(ej: EJ | None, amount: int = 0, code: int = PRODUCT,
                    previous: Previous = BASE_NAMES) -> Ledger:
        ledger = Ledger(code=code)  # book 10, physical 10
        ledger.observe(9)  # one sold before the count
        ledger.complete()  # book 9
        ledger.import_row(ledger.receive(), sold=0, amount=amount, ej=ej, previous=previous)  # returned after
        return ledger

    # (a) EJ has a line for P: flagged, and the recount converges to physical 10.
    ledger = offset_case(EJ(("P",)))
    assert ledger.stock == 9 and reason_of(ledger, 1) == LINES
    ledger.observe(10, immediate=True)
    assert ledger.stock == 10 and not ledger.flags
    # (b) complete EJ without a line for P: no flag.
    assert not offset_case(EJ(("Q",))).flags
    # (c) no EJ: pending check blocks completion; a later line-free EJ resolves it.
    ledger = Ledger()
    ledger.observe(10)
    source = ledger.receive()
    ledger.import_row(source, sold=0)
    assert reason_of(ledger, source) == PENDING
    try:
        ledger.complete()
    except ValueError:
        pass
    else:
        raise AssertionError("offset check pending did not block completion")
    ledger.reevaluate(source, EJ(sequence_complete=False))  # still incomplete
    assert reason_of(ledger, source) == PENDING
    ledger.reevaluate(source, EJ())
    assert not ledger.flags
    ledger.complete()
    assert ledger.stock == 10
    ledger = offset_case(None)
    ledger.reevaluate(1, EJ(("P",)))
    assert reason_of(ledger, 1) == LINES
    # (d) a line matching no product, department or previous name puts every counted 0/0 product
    # of the interval on hold (registration changed); department sales and non-item lines do not.
    assert reason_of(offset_case(EJ(("?",))), 1) == MAPPING
    assert not offset_case(EJ(("D1", "D1", "D1"), non_item_lines=4)).flags
    # (e) zero quantity with a nonzero amount is movement evidence without waiting for EJ.
    assert reason_of(offset_case(None, amount=100), 1) == LINES
    # (f) changed names = {name | (code, name) in previous - current}. Price-only, discontinued,
    # renamed and added names flag nothing unless a changed name has an EJ line ((g)).
    register = {1: ("P", 100), 2: ("Q", 200)}
    repriced = {1: ("P", 120), 2: ("Q", 200)}
    for current, lines in (
        (z004_names(repriced), ("Q",)),  # price only
        (frozenset({(1, "P")}), ("D1",)),  # Q discontinued, no Q line
        (frozenset({(1, "P"), (2, "Q2")}), ("Q2",)),  # Q renamed, only the new name sold
        (BASE_NAMES | {(3, "R")}, ("R",)),  # new name R
        (frozenset({(1, "P2"), (2, "Q")}), ()),  # P itself renamed, not sold
    ):
        assert not offset_case(EJ(lines, z004=current), previous=z004_names(register)).flags
    # (g) names overlapping (16-byte truncation, a product named like a department, a changed
    # name) never hold the whole interval: only the 0/0 counted candidates get offset lines.
    def flagged(ej: EJ, codes: tuple[int, ...], previous: Previous = BASE_NAMES) -> list[int]:
        return [c for c in codes if reason_of(offset_case(ej, code=c, previous=previous), 1) == LINES]

    truncated = BASE_NAMES | {(3, "Q")}  # codes 2 and 3 print the same 16-byte name
    shadowed = BASE_NAMES | {(3, "D1")}  # a product named like a department
    for ej, previous, expected in (
        (EJ(("Q",), z004=truncated), truncated, [2, 3]),
        (EJ(("D1",), z004=shadowed), shadowed, [3]),
        (EJ(("P",), z004=frozenset({(2, "P"), (1, "Q")})), BASE_NAMES, [1, 2]),  # names swapped codes
        (EJ(("Q",), z004=frozenset({(1, "P"), (2, "Q2")})), BASE_NAMES, [2]),  # old name sold before the rename
        (EJ(("Q",), z004=frozenset({(1, "P")})), BASE_NAMES, [2]),  # sold before Q was discontinued
        # Changed names are a set difference of pairs; a name-keyed map collapses the two Q pairs.
        (EJ(("Q",), z004=BASE_NAMES), truncated, [2, 3]),
        (EJ(("Q",), z004=frozenset({(1, "P"), (3, "Q")})), truncated, [2, 3]),
    ):
        assert flagged(ej, (1, 2, 3), previous) == expected, (ej, expected)
        for code in {1, 2, 3} - set(expected):  # quiet counted products outside the candidates
            assert not offset_case(ej, code=code, previous=previous).flags
    # Registration changed (a line matching nothing, or the first interval): a re-imported EJ
    # never resolves it (not even a clean one); a recount does.
    for ej, previous in ((EJ(("?",)), BASE_NAMES), (EJ(), FIRST)):
        ledger = offset_case(ej, previous=previous)
        assert reason_of(ledger, 1) == MAPPING
        for later in (ej, EJ()):
            ledger.reevaluate(1, later, previous)
            assert reason_of(ledger, 1) == MAPPING
        ledger.observe(10, immediate=True)
        assert ledger.stock == 10 and not ledger.flags
    # A pending check turns into a registration change once the EJ shows a line matching nothing.
    ledger = offset_case(None)
    ledger.reevaluate(1, EJ(("?",)))
    assert reason_of(ledger, 1) == MAPPING
    # The previous Z004 is known but not received yet: pending, re-evaluated on its receipt.
    for lines, after in (((), None), (("P",), LINES)):
        ledger = offset_case(EJ(lines), previous=UNRECEIVED)
        assert reason_of(ledger, 1) == PENDING
        ledger.reevaluate(1, EJ(lines))  # the previous Z004 has arrived
        assert reason_of(ledger, 1) == after

    # (h) Totals are compared per unit of names and codes joined by candidates. A name shared with
    # a department is left out of the comparison (its lines already flag the candidates).
    ej = EJ(("D1", "D1"), signed=(1, 1), z004=shadowed)  # two department sales, product 3 unsold
    assert ej.complete(shadowed) and flagged(ej, (1, 2, 3), shadowed) == [3]
    assert not offset_case(ej, code=1, previous=shadowed).flags
    # Names swapped mid-interval; product 1 sold as A before the swap and as B after it.
    swapped_before, swapped = frozenset({(1, "A"), (2, "B")}), frozenset({(1, "B"), (2, "A")})
    ej = EJ(("A", "B"), signed=(1, 1), z004=swapped, z004_qty=((1, 2),))
    assert ej.complete(swapped_before) and flagged(ej, (2,), swapped_before) == [2]
    # Every slot counts, even one no app product uses: a sale with no EJ line is incomplete.
    assert not EJ(z004=BASE_NAMES | {(9, "R")}, z004_qty=((9, 1),)).complete(BASE_NAMES)
    # First interval vs unreceived previous, decided at the Z004 import before any EJ.
    machine = Machine()
    first = machine.receive(10)
    assert first == FIRST
    ledger = offset_case(None, previous=first)
    assert reason_of(ledger, 1) == MAPPING
    ledger.reevaluate(1, EJ(), machine.previous(10))  # the EJ alone does not resolve it
    assert reason_of(ledger, 1) == MAPPING
    machine = Machine()
    machine.receive(10)
    gap = machine.receive(12)
    assert gap == UNRECEIVED
    ledger = offset_case(EJ(), previous=gap)
    assert reason_of(ledger, 1) == PENDING
    assert machine.receive(11) == BASE_NAMES  # a late gap fill, not a going-back
    ledger.reevaluate(1, EJ(), machine.previous(12))
    assert not ledger.flags

    # (i) F1: today's Z004 and EJ first (first interval), then the directly preceding Z004.
    for lines, after in (((), None), (("P",), LINES), (("P", "?"), MAPPING)):
        machine = Machine()
        ledger = offset_case(EJ(lines), previous=machine.receive(10))
        assert reason_of(ledger, 1) == MAPPING
        machine.receive(9)
        ledger.reevaluate(1, EJ(lines), machine.previous(10))
        assert reason_of(ledger, 1) == after  # F6: a line matching nothing wins over lines present
    # F2: while the previous Z004 is unreceived, a line matching nothing is not judged yet;
    # it may carry a name the previous Z004 explains.
    renamed = frozenset({(1, "P"), (2, "Q2")})
    ej = EJ(("Q",), z004=renamed)
    ledger = offset_case(ej, code=2, previous=UNRECEIVED)
    assert reason_of(ledger, 1) == PENDING
    ledger.reevaluate(1, ej, BASE_NAMES)
    assert reason_of(ledger, 1) == LINES
    # F3: a going-back is only a received settlement_no arriving again as another settlement; it is
    # a registration change, and later "previous" candidates are receipts from the going-back on.
    machine = Machine()
    for settlement_no in (1, 2, 3, 5):
        machine.receive(settlement_no)
    assert machine.receive(3, renamed, identity="reset") == ROLLED_BACK
    assert reason_of(offset_case(EJ(), previous=ROLLED_BACK), 1) == MAPPING
    assert machine.receive(4, identity="reset") == renamed  # the new 3, not the old one
    assert machine.receive(6, identity="reset") == UNRECEIVED  # the old 5 is not a candidate
    # Below the smallest received: its previous cannot be proven (registration change), but it is
    # still the directly preceding Z004 for the next settlement_no (F1 above).
    machine = Machine()
    machine.receive(5)
    earlier = machine.receive(3)
    assert earlier == EARLIER and reason_of(offset_case(EJ(), previous=earlier), 1) == MAPPING
    # A gap between the smallest and the largest received is an ordinary late receipt: it pairs with
    # its own previous and re-evaluates the first interval and the unreceived previous after it.
    machine = Machine()
    first = offset_case(EJ(), previous=machine.receive(10))
    assert reason_of(first, 1) == MAPPING
    assert machine.receive(8) == EARLIER
    unreceived = offset_case(EJ(), previous=machine.receive(12))
    assert reason_of(unreceived, 1) == PENDING
    for settlement_no in (9, 11):
        assert not offset_case(EJ(), previous=machine.receive(settlement_no)).flags
    first.reevaluate(1, EJ(), machine.previous(10))
    unreceived.reevaluate(1, EJ(), machine.previous(12))
    assert not first.flags and not unreceived.flags
    # F4: no start evidence = incomplete (pending); evidence contradicting the previous = changed.
    assert reason_of(offset_case(EJ(start=None)), 1) == PENDING
    assert reason_of(offset_case(EJ(start=False)), 1) == MAPPING
    # F5 (clear-line premise true): a code in the previous Z004 but not in this one is judged as a
    # 0/0 row, and its unit is left out of the totals (its unsettled sale left the Z004).
    cleared = frozenset({(1, "P")})
    ej = EJ(("Q",), signed=(1,), z004=cleared)
    assert ej.complete(BASE_NAMES) and flagged(ej, (1, 2)) == [2]

    # (j) Gated Amendment 4: every registration change made while the directly preceding Z004 was
    # unreceived (first interval, below the smallest received, going-back) is re-evaluated in D4
    # order once that Z004 arrives, so the receipt order never fixes the result.
    for ej, after in ((EJ(), None), (EJ(("P",)), LINES), (None, PENDING)):
        machine = Machine()
        machine.receive(10)
        ledger = offset_case(ej, previous=machine.receive(9))  # counted after 10; 9 arrives late
        assert reason_of(ledger, 1) == MAPPING
        ledger.reevaluate(1, EJ(), machine.previous(9))  # an EJ alone does not re-evaluate it
        assert reason_of(ledger, 1) == MAPPING
        machine.receive(8)
        ledger.reevaluate(1, ej, machine.previous(9))
        assert reason_of(ledger, 1) == after
    ledger.reevaluate(1, EJ(), machine.previous(9))  # the missing EJ arrives
    assert not ledger.flags
    machine = Machine()  # three steps back: 10, then 9, 8, 7
    machine.receive(10)
    nine = offset_case(EJ(), previous=machine.receive(9))
    eight = offset_case(EJ(), previous=machine.receive(8))
    assert reason_of(nine, 1) == reason_of(eight, 1) == MAPPING
    nine.reevaluate(1, EJ(), machine.previous(9))
    assert not nine.flags and reason_of(eight, 1) == MAPPING
    machine.receive(7)
    eight.reevaluate(1, EJ(), machine.previous(8))
    assert not eight.flags
    machine = Machine()  # going-back (model only; the D3 identity guard keeps runtime from it)
    for settlement_no in (1, 2, 3, 4, 5):
        machine.receive(settlement_no)
    back = offset_case(EJ(), previous=machine.receive(3, identity="reset"))
    assert reason_of(back, 1) == MAPPING and machine.previous(3) == UNRECEIVED  # not the old 2
    machine.receive(2, identity="reset")
    back.reevaluate(1, EJ(), machine.previous(3))
    assert not back.flags
    # (k) Clear-line premise true, previous 11 unreceived: Q is sold, counted, returned and cleared
    # within 12, so 12's Z004 has no Q row while its EJ has Q's sale and return (Codex broad #2).
    cleared = frozenset({(1, "P")})
    ej = EJ(("Q", "Q"), signed=(1, -1), z004=cleared)
    for eleven, late_ej, after in ((BASE_NAMES, ej, LINES), (BASE_NAMES, None, PENDING),
                                   (cleared, ej, None), (cleared, None, None)):
        machine = Machine()
        machine.receive(10)
        previous = machine.receive(12, cleared)
        ledger = Ledger(code=2)  # book 10
        ledger.observe(9)  # counted after the sale; the later return makes physical 10
        if offset_targets(frozenset({2}), cleared, previous):
            ledger.import_row(ledger.receive(), sold=0, ej=late_ej, previous=previous)
        assert reason_of(ledger, 1) == PENDING
        machine.receive(11, eleven)
        ledger.reevaluate(1, late_ej, machine.previous(12), current=cleared)
        assert reason_of(ledger, 1) == after
        if after:
            try:
                ledger.complete()
            except ValueError:
                pass
            else:
                raise AssertionError("an offset of a cleared counted product was missed")
    # Not in 11 either: Q resolves, and its EJ line now matches nothing, holding the other products.
    assert offset_reason(ej, cleared) == MAPPING
    # (k') The same with 12 as the first interval (12 received first) and below the smallest received
    # (13, then 12): Q gets a marked registration change, re-evaluated when 11 arrives.
    for before in ((), (13,)):
        for eleven, late_ej, after in ((BASE_NAMES, ej, LINES), (BASE_NAMES, None, PENDING),
                                       (cleared, ej, None), (cleared, None, None)):
            machine = Machine()
            for settlement_no in before:
                machine.receive(settlement_no)
            previous = machine.receive(12, cleared)
            assert previous == (EARLIER if before else FIRST)
            ledger = Ledger(code=2)
            ledger.observe(9)
            if offset_targets(frozenset({2}), cleared, previous):
                ledger.import_row(ledger.receive(), sold=0, ej=late_ej, previous=previous)
            assert ledger.flags.get(1) == (MAPPING, 1, True)
            machine.receive(11, eleven)
            ledger.reevaluate(1, late_ej, machine.previous(12), current=cleared)
            assert reason_of(ledger, 1) == after
            assert refused(ledger.complete) == bool(after)
    # (l) Frozen after that re-evaluation: a line matching nothing, or start evidence contradicting
    # the received previous Z004. Re-importing the EJ later does not re-evaluate them.
    for ej in (EJ(("P", "?")), EJ(start=False)):
        machine = Machine()
        machine.receive(10)
        ledger = offset_case(ej, previous=machine.receive(9))
        machine.receive(8)
        for later in (ej, EJ()):
            ledger.reevaluate(1, later, machine.previous(9))
            assert reason_of(ledger, 1) == MAPPING
        ledger.observe(10, immediate=True)
        assert not ledger.flags


class ImportModel:
    """One machine/product, synthetic valid Z004s; all attributes model committed storage.

    Receipt identity is the supplied synthetic hash. No parser, SQL, or D3 guard proof.
    A new object loaded from these attributes models restart; no preview token survives.
    """

    def __init__(self, code: int = PRODUCT):
        self.machine = Machine()
        self.ledger = Ledger(code=code)
        self.receipts: dict[str, tuple[int, int, Previous, Names]] = {}
        self.intervals: dict[int, tuple[int, EJ | None, Names]] = {}
        self.active: dict[str, int] = {}

    def receive(self, file_hash: str, number: int, names: Names = BASE_NAMES) -> int:
        if file_hash not in self.receipts:
            previous = self.machine.receive(number, names, identity=file_hash)
            self.receipts[file_hash] = (self.ledger.receive(), number, previous, names)
        return self.receipts[file_hash][0]

    def business_state(self):
        ledger = self.ledger
        return deepcopy((ledger.movements, ledger.observations, ledger.revision,
                         ledger.flags, ledger.imports, self.intervals, self.active))

    def commit(self, file_hash: str, ej: EJ | None = None, sold: int = 0,
               *, fail: bool = False, held: bool = False) -> bool:
        if file_hash in self.active:
            raise ValueError("active hash duplicate")
        if held:
            return False  # represents a guard rejection before business writes
        source, number, original_previous, names = self.receipts[file_hash]
        previous = self.machine.previous(number)
        if isinstance(previous, str):
            previous = original_previous
        ledger, intervals, active = deepcopy((self.ledger, self.intervals, self.active))
        active[file_hash] = ledger.import_row(source, sold, ej=ej, previous=previous)
        intervals[number] = (source, ej, names)
        if number + 1 in intervals:
            target, evidence, current = intervals[number + 1]
            ledger.reevaluate(target, evidence, self.machine.previous(number + 1), current)
        if fail:
            return False  # fail after flag changes; discard the whole business TX
        self.ledger, self.intervals, self.active = ledger, intervals, active
        return True

    def restart(self):
        fresh = ImportModel(self.ledger.code)
        fresh.machine, fresh.ledger, fresh.receipts, fresh.intervals, fresh.active = deepcopy(
            (self.machine, self.ledger, self.receipts, self.intervals, self.active))
        return fresh


def check_receipt_business_retry() -> None:
    # ADR D2/D4, packet R9: receipt alone survives abort/failure; same hash must retry.
    cleared = frozenset({(1, "P")})
    cases = (
        (EJ(z004=cleared), BASE_NAMES, None),
        (EJ(("Q", "Q"), signed=(1, -1), z004=cleared), BASE_NAMES, LINES),
        (None, BASE_NAMES, PENDING),
        (EJ(("?",), z004=cleared), BASE_NAMES, MAPPING),
        (EJ(start=False, z004=cleared), BASE_NAMES, MAPPING),
        (None, cleared, None),  # absent in both: resolves even without EJ
    )
    for before, interruption, (ej, eleven, expected) in product(
        ((), (13,), (10,)), ("abort", "failure", "held"), cases
    ):
        model = ImportModel(code=2)
        for number in before:
            model.receive(str(number), number)
        model.ledger.observe(9)
        source = model.receive("twelve", 12, cleared)
        assert model.commit("twelve", ej)
        original = model.ledger.flags[source]
        assert original[0] == (PENDING if before == (10,) else MAPPING)
        assert original[2] == (before != (10,))
        state = model.business_state()
        receipt = model.receive("eleven", 11, eleven)
        assert model.business_state() == state, "receipt mutated business state"
        if interruption != "abort":
            assert not model.commit("eleven", sold=2, fail=interruption == "failure",
                                    held=interruption == "held")
        assert model.business_state() == state, "failed TX leaked business state"
        assert refused(model.ledger.complete), "interrupted import unblocked completion"
        model = model.restart()
        assert model.business_state() == state, "restart lost committed business state"
        receipts = deepcopy(model.receipts)
        machine = deepcopy(model.machine.__dict__)
        assert model.receive("eleven", 11, eleven) == receipt
        assert model.receipts == receipts and model.machine.__dict__ == machine
        assert model.business_state() == state, "reselection mutated business state"
        assert model.commit("eleven", sold=2)
        assert reason_of(model.ledger, source) == expected, "same-hash retry missed reevaluation"
        if expected:
            assert model.ledger.flags[source] == (expected, original[1], False)
        assert model.ledger.stock == 8 and len(model.active) == 2
        committed = model.business_state()
        model = model.restart()  # includes crash after commit, before the response
        assert refused(lambda: model.commit("eleven", sold=2))
        assert model.business_state() == committed, "duplicate import had side effects"
        # Repeat only the judgement, not sales. Frozen mapping also resists a changed EJ.
        for later in (ej, ej):
            model.ledger.reevaluate(source, later, eleven, cleared)
            assert model.business_state() == committed, "reevaluation was not idempotent"
        if expected == MAPPING:
            model.ledger.reevaluate(source, EJ(z004=cleared), eleven, cleared)
            assert model.business_state() == committed, "frozen mapping reopened"
    # A recount or cancellation while the predecessor is only received must not be resurrected.
    for recovery in ("recount", "cancel"):
        model = ImportModel()
        model.ledger.observe(10)
        source = model.receive("twelve", 12)
        assert model.commit("twelve", EJ())
        model.receive("eleven", 11)
        if recovery == "recount":
            model.ledger.observe(10)
        else:
            model.ledger.rollback(model.active["twelve"])
            del model.active["twelve"]
        assert source not in model.ledger.flags
        model = model.restart()
        assert model.commit("eleven")
        assert source not in model.ledger.flags, "resolved flag was resurrected"
    print("PASS: receipt/business separation, same-hash retry, restart, atomic rollback, idempotence")


def check_completion_with_stale_basis() -> None:
    # Gated Amendment 5 (Codex broad #1): the latest count belongs to a completed stocktake or an
    # independent recount, and the new stocktake's item is uncounted (force_fill) or auto_filled at
    # its start (discontinued). An unresolved flag still blocks completion; counting the item resolves it.
    for basis, kind, (sold, ej, reason, physical) in product(
        ("completed", "independent"), ("uncounted", "auto_filled"),
        ((0, EJ(("P", "P"), signed=(1, -1)), LINES, 10),  # sold, recounted 9, returned (Codex)
         (0, None, PENDING, 10),
         (1, None, "sale_order_unknown", 9)),  # sold before the recount 9, settled after it
    ):
        ledger = Ledger()  # book 10
        if basis == "completed":
            ledger.observe(9)
            ledger.complete()
        else:
            ledger.observe(9, immediate=True)
        if kind == "auto_filled":
            ledger.force_fill()  # the new stocktake starts; discontinued items are auto-filled
        else:
            ledger.active_item = True  # the new stocktake starts; the item is not counted yet
        source = ledger.receive()
        ledger.import_row(source, sold=sold, ej=ej)
        assert reason_of(ledger, source) == reason
        if kind == "uncounted":
            ledger.force_fill()
        assert refused(ledger.complete), (basis, kind, reason)
        ledger.observe(physical)  # count the item
        assert not ledger.flags
        ledger.complete()
        assert ledger.stock == physical and not ledger.flags


def check_migration_and_fill() -> None:
    # D8: old manual AND force_fill set counted_at; only the zero/zero INSERT did not.
    for actual, saved, snapshot, expected in (
        (None, None, 10, "uncounted"), (0, None, 0, "auto_filled"),
        (0, "old", 0, "legacy"), (8, "old", 10, "legacy"),
        (None, "old", 10, "legacy"), (8, None, 10, "legacy"), (8, None, 0, "legacy"),
        (0, None, 10, "legacy"),
    ):
        assert migration_kind(actual, saved, snapshot) == expected

    for opening in (-3, 0, 5):
        ledger = Ledger(opening)
        filled = ledger.force_fill()
        assert filled.actual == filled.snapshot == max(opening, 0)
        assert filled.auto_filled and filled.cursor is None and filled.time is None
        ledger.complete()
        assert ledger.stock == opening and len(ledger.movements) == 1

    ledger = Ledger(2)
    imported = ledger.move(-2)
    filled = ledger.force_fill()  # zero/zero matches the old discontinued auto-input
    ledger.complete()
    ledger.migrate_legacy()  # D8: auto-filled legacy rows do not become observations
    assert not filled.legacy
    ledger.cancel(imported)  # auto_fill did not absorb it
    assert ledger.stock == 2
    try:
        ledger.force_fill(needs_recheck=True)
    except ValueError:
        pass
    else:
        raise AssertionError("force_fill bypassed a recheck")

    ledger = Ledger()
    imported = ledger.move(-2)
    ledger.observe(9, immediate=True, time=Count(10, 11, 0))
    ledger.force_fill()
    ledger.complete()
    ledger.cancel(imported)
    assert ledger.stock == 9  # auto-fill did not displace the applied absorber

    ledger = Ledger()
    imported = [ledger.move(-2), ledger.move(2)]  # same import TX, net zero
    ledger.observe(8)
    ledger.complete()
    ledger.migrate_legacy()
    version = ledger.revision
    ledger.cancel_import(imported)  # no stock uncertainty despite unknown legacy cursor
    assert ledger.stock == 8 and ledger.revision > version
    assert all(not ledger.movements[i - 1].active for i in imported)


if __name__ == "__main__":
    check_bounds()
    check_counterexamples()
    check_diagnostic_order()
    check_lifecycle()
    check_legacy_recovery()
    check_unknown_apply_recheck()
    check_receipt_business_retry()
    check_completion_with_stale_basis()
    check_migration_and_fill()
    print("PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy hold and release, unknown apply and recheck, sale/return offset, completion over a stale basis, migration kinds, force_fill")
