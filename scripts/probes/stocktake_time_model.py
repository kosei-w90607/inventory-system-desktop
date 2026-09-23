#!/usr/bin/env python3
"""Synthetic design probe, not application code or a POS parser.

Run: python3 scripts/probes/stocktake_time_model.py
Contracts: REQ-205 / REQ-401, SPEC-STK-TIME-D1..D8.
The oracle knows physical event times; the classifier sees only evidence bounds.
The clock-interval part (bound_clock_interval, classify's trusted branch, check_bounds)
no longer backs the ADR contract; it is kept as input for the next design lane.
No filesystem input, store data, dependencies, or writes.
"""

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


UNRECEIVED = "unreceived"  # the previous settlement_no is known but its Z004 is not imported yet


def changed_names(previous: Names, current: Names) -> frozenset[str]:
    """ADR D5: {name | (code, name) in previous - current}."""
    return frozenset(name for _code, name in previous - current)


def candidates(name: str, ej: "EJ") -> frozenset[int] | None:
    """ADR D5: products a detail line may belong to; empty = department sale; None = matches nothing.

    Several products (16-byte truncation), a product and a department, or a changed name do
    not make the interval incomplete: every candidate is treated as having a line.
    """
    current = {code for code, n in ej.z004 if n == name}
    if name in changed_names(ej.previous_z004, ej.z004):
        return frozenset(current | {code for code, n in ej.previous_z004 if n == name})
    if current:
        return frozenset(current)
    return frozenset() if name in DEPARTMENTS else None


@dataclass(frozen=True)
class EJ:
    """One synthetic EJ settlement interval, already classified by the EJ parser (ADR D5)."""
    lines: tuple[str, ...] = ()  # register-side names on detail lines (products and departments)
    non_item_lines: int = 0  # totals / payment / tax: known, never make the interval incomplete
    same_settlement: bool = True
    sequence_complete: bool = True
    totals_match: bool = True  # per product, or per name for candidates sharing a name
    # Proven previous settlement of the machine; None = none exists or unprovable; UNRECEIVED.
    previous_z004: Names | None | str = BASE_NAMES
    z004: Names = BASE_NAMES  # Z004 of this settlement

    def complete(self) -> bool:
        return self.same_settlement and self.sequence_complete and self.totals_match


def offset_reason(ej: EJ | None, code: int = PRODUCT) -> str | None:
    """Zero-quantity, zero-amount row of a counted product (ADR D4, sale/return offset)."""
    if ej is None or ej.previous_z004 == UNRECEIVED:
        return "offset_check_pending"  # re-evaluated when the EJ or the previous Z004 arrives
    if ej.previous_z004 is None:
        return "offset_mapping_changed"  # first interval: a re-imported EJ cannot fix it
    owners = [candidates(name, ej) for name in ej.lines]
    if None in owners:
        return "offset_mapping_changed"  # a line matching nothing: only a recount resolves it
    if not ej.complete():
        return "offset_check_pending"
    return "offset_lines_present" if any(code in o for o in owners) else None


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
        self.flags: dict[int, tuple[str, int]] = {}  # source -> (reason, creating import)
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
        latest = self.latest()
        if self.flags and latest is not None and latest.state == "pending":
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

    def import_row(self, source: int, sold: int, amount: int = 0, ej: EJ | None = None) -> int:
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
                reason = "offset_lines_present"
            else:
                reason = offset_reason(ej, self.code)
        import_id = len(self.imports) + 1
        self.imports[import_id] = [self.move(-sold)] if sold else []
        if reason:
            self.flags[source] = (reason, import_id)
        return import_id

    def reevaluate(self, source: int, ej: EJ) -> None:
        flag = self.flags.get(source)
        if flag and flag[0] == "offset_check_pending":  # never offset_mapping_changed
            reason = offset_reason(ej, self.code)
            if reason is None:
                del self.flags[source]
            else:
                self.flags[source] = (reason, flag[1])

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
    def offset_case(ej: EJ | None, amount: int = 0, code: int = PRODUCT) -> Ledger:
        ledger = Ledger(code=code)  # book 10, physical 10
        ledger.observe(9)  # one sold before the count
        ledger.complete()  # book 9
        ledger.import_row(ledger.receive(), sold=0, amount=amount, ej=ej)  # returned after
        return ledger

    # (a) EJ has a line for P: flagged, and the recount converges to physical 10.
    ledger = offset_case(EJ(("P",)))
    assert ledger.stock == 9 and reason_of(ledger, 1) == "offset_lines_present"
    ledger.observe(10, immediate=True)
    assert ledger.stock == 10 and not ledger.flags
    # (b) complete EJ without a line for P: no flag.
    assert not offset_case(EJ(("Q",))).flags
    # (c) no EJ: pending check blocks completion; a later line-free EJ resolves it.
    ledger = Ledger()
    ledger.observe(10)
    source = ledger.receive()
    ledger.import_row(source, sold=0)
    assert reason_of(ledger, source) == "offset_check_pending"
    try:
        ledger.complete()
    except ValueError:
        pass
    else:
        raise AssertionError("offset check pending did not block completion")
    ledger.reevaluate(source, EJ(sequence_complete=False))  # still incomplete
    assert reason_of(ledger, source) == "offset_check_pending"
    ledger.reevaluate(source, EJ())
    assert not ledger.flags
    ledger.complete()
    assert ledger.stock == 10
    ledger = offset_case(None)
    ledger.reevaluate(1, EJ(("P",)))
    assert reason_of(ledger, 1) == "offset_lines_present"
    # (d) a line matching no product, department or previous name puts every counted 0/0 product
    # of the interval on hold (registration changed); department sales and non-item lines do not.
    assert reason_of(offset_case(EJ(("?",))), 1) == "offset_mapping_changed"
    assert not offset_case(EJ(("D1", "D1", "D1"), non_item_lines=4)).flags
    # (e) zero quantity with a nonzero amount is movement evidence without waiting for EJ.
    assert reason_of(offset_case(None, amount=100), 1) == "offset_lines_present"
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
        assert not offset_case(EJ(lines, previous_z004=z004_names(register), z004=current)).flags
    # (g) names overlapping (16-byte truncation, a product named like a department, a changed
    # name) never hold the whole interval: only the 0/0 counted candidates get offset lines.
    def flagged(ej: EJ, codes: tuple[int, ...]) -> list[int]:
        return [c for c in codes if reason_of(offset_case(ej, code=c), 1) == "offset_lines_present"]

    truncated = BASE_NAMES | {(3, "Q")}  # codes 2 and 3 print the same 16-byte name
    shadowed = BASE_NAMES | {(3, "D1")}  # a product named like a department
    for ej, expected in (
        (EJ(("Q",), previous_z004=truncated, z004=truncated), [2, 3]),
        (EJ(("D1",), previous_z004=shadowed, z004=shadowed), [3]),
        (EJ(("P",), z004=frozenset({(2, "P"), (1, "Q")})), [1, 2]),  # names swapped codes
        (EJ(("Q",), z004=frozenset({(1, "P"), (2, "Q2")})), [2]),  # old name sold before the rename
        (EJ(("Q",), z004=frozenset({(1, "P")})), [2]),  # sold before Q was discontinued
        # Changed names are a set difference of pairs; a name-keyed map collapses the two Q pairs.
        (EJ(("Q",), previous_z004=truncated, z004=BASE_NAMES), [2, 3]),
        (EJ(("Q",), previous_z004=truncated, z004=frozenset({(1, "P"), (3, "Q")})), [2, 3]),
    ):
        assert flagged(ej, (1, 2, 3)) == expected, (ej, expected)
        for code in {1, 2, 3} - set(expected):  # quiet counted products outside the candidates
            assert not offset_case(ej, code=code).flags
    # Registration changed (a line matching nothing, or no previous Z004 at all, e.g. the first
    # interval): a re-imported EJ never resolves it (not even a clean one); a recount does.
    for ej in (EJ(("?",)), EJ(previous_z004=None)):
        ledger = offset_case(ej)
        assert reason_of(ledger, 1) == "offset_mapping_changed"
        for later in (ej, EJ()):
            ledger.reevaluate(1, later)
            assert reason_of(ledger, 1) == "offset_mapping_changed"
        ledger.observe(10, immediate=True)
        assert ledger.stock == 10 and not ledger.flags
    # A pending check turns into a registration change once the EJ shows a line matching nothing.
    ledger = offset_case(None)
    ledger.reevaluate(1, EJ(("?",)))
    assert reason_of(ledger, 1) == "offset_mapping_changed"
    # The previous Z004 is known but not received yet: pending, re-evaluated on its receipt.
    for lines, after in (((), None), (("P",), "offset_lines_present")):
        ledger = offset_case(EJ(lines, previous_z004=UNRECEIVED))
        assert reason_of(ledger, 1) == "offset_check_pending"
        ledger.reevaluate(1, EJ(lines))  # the previous Z004 has arrived
        assert reason_of(ledger, 1) == after


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
    check_migration_and_fill()
    print("PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy hold and release, unknown apply and recheck, sale/return offset, migration kinds, force_fill")
