#!/usr/bin/env python3
"""Synthetic design probe, not application code or a POS parser.

Run: python3 scripts/probes/stocktake_time_model.py
Contracts: REQ-205 / REQ-401, SPEC-STK-TIME-D1..D6.
The oracle knows physical event times; the classifier sees only evidence bounds.
No filesystem input, store data, dependencies, or writes.
"""

from dataclasses import dataclass
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


def bound_clock_interval(lower: int | None, upper: int | None, quantum: int, error: int):
    """Reported timestamps are the starts of their representable buckets."""
    assert quantum > 0 and error >= 0
    return (
        lower - error if lower is not None else None,
        upper + quantum + error if upper is not None else None,
    )


def classify(source: Source, count: Count | None) -> str:
    assert source.received > 0
    if count is None:
        return "after"  # genuinely never counted, not legacy evidence
    if count.legacy:
        return "unknown"
    if source.received <= count.sources:
        return "before"
    if source.trusted:
        if source.lower is not None and source.upper is not None and source.lower > source.upper:
            return "unknown"
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


@dataclass
class Movement:
    id: int
    quantity: int
    active: bool = True


@dataclass
class Observation:
    order: int
    cursor: int
    actual: int
    snapshot: int
    state: str  # pending / applied / superseded
    legacy: bool = False
    time: Count | None = None
    rebased_from: int | None = None


class Ledger:
    def __init__(self, opening: int = 10):
        self.movements = [Movement(1, opening)]
        self.observations: list[Observation] = []
        self.revision = 0
        self.legacy_ceiling = 0

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
        if immediate and pending:
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
            time=time,
        )
        self.observations.append(observation)
        return observation

    def complete(self) -> None:
        for observation in self.observations:
            if observation.state != "pending":
                continue
            correction = observation.actual - observation.snapshot
            if correction:
                self.move(correction)
            observation.state = "applied"
        self.revision += 1

    def cancel(self, movement_id: int) -> None:
        movement = self.movements[movement_id - 1]
        if not movement.active:
            return
        if self.needs_legacy_recheck(movement_id):
            raise ValueError("legacy cancellation needs a fresh applied recount")
        absorbed = [
            o for o in self.observations
            if not o.legacy and o.state != "superseded" and o.cursor >= movement_id
        ]
        first = min(absorbed, key=lambda o: o.order) if absorbed else None
        movement.active = False
        self.revision += 1
        if first is None:
            return
        if first.state == "pending":
            first.snapshot -= movement.quantity
        else:
            self.move(movement.quantity)

    def migrate_legacy(self) -> None:
        self.legacy_ceiling = self.movements[-1].id
        for observation in self.observations:
            observation.legacy = True

    def needs_legacy_recheck(self, movement_id: int) -> bool:
        uncertain = any(o.legacy and o.state != "superseded" for o in self.observations)
        applied_proof = any(
            not o.legacy and o.state == "applied" and o.cursor >= movement_id
            for o in self.observations
        )
        return uncertain and movement_id <= self.legacy_ceiling and not applied_proof

    def recover_legacy_rollback(self, movement_id: int, actual: int, time: Count | None = None) -> None:
        assert self.needs_legacy_recheck(movement_id)
        pending = [o for o in self.observations if o.state == "pending"]
        for old in pending:
            old.state = "superseded"
        recount = self.observe(actual, immediate=True, time=time)
        if pending:
            basis = self.observe(actual, time=time)  # derived N/N active basis
            basis.rebased_from = recount.order


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
    # Unknown initial start never becomes an invented midnight lower bound.
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
    assert classify_row(Source(1), [(True, None), (True, Count(5, 6, 0))]) == "unknown"
    assert classify_row(Source(1), [(True, Count(5, 6, 1)), (True, Count(7, 8, 1))]) == "before"
    assert classify_row(Source(1), [(False, None), (True, None)]) == "unknown"
    assert classify_row(Source(1), [(False, None), (False, None)]) == "no_stock"


def check_lifecycle() -> None:
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
    version = ledger.revision
    ledger.move(-1)
    ledger.move(1)
    assert ledger.stock == 10 and ledger.revision != version  # ABA
    count = ledger.observe(8, immediate=True)
    ledger.move(-1)
    assert ledger.stock == 7 and count.actual == 8  # no delayed overwrite at import

    ledger = Ledger()
    ledger.observe(8)
    try:
        ledger.observe(6, immediate=True)
    except ValueError:
        pass
    else:
        raise AssertionError("independent recount must not bypass a pending count")


def check_legacy_recovery() -> None:
    for quantity, pending in product((-3, 3), (False, True)):
        ledger = Ledger()
        imported = ledger.move(quantity)
        ledger.observe(10)
        ledger.complete()
        ledger.migrate_legacy()
        if pending:
            ledger.observe(8)
        stock_before = ledger.stock
        try:
            ledger.cancel(imported)
        except ValueError:
            assert ledger.stock == stock_before and ledger.movements[imported - 1].active
        else:
            raise AssertionError("unknown legacy absorption silently undone")
        ledger.recover_legacy_rollback(imported, 8)
        ledger.move(4)  # movement after the recovery must survive both cancel and completion
        ledger.cancel(imported)
        assert ledger.stock == 12
        ledger.complete()
        assert ledger.stock == 12
        ledger.cancel(imported)
        assert ledger.stock == 12

    ledger = Ledger()
    ledger.observe(10)
    ledger.complete()
    ledger.migrate_legacy()
    new_import = ledger.move(-2)
    ledger.cancel(new_import)  # new movement cannot be absorbed by a legacy observation
    assert ledger.stock == 10

    # Migration while already pending; recovery must replace its OLD time evidence too.
    ledger = Ledger()
    imported = ledger.move(-3)
    ledger.observe(10, time=Count(0, 1, 0))
    ledger.migrate_legacy()
    fresh = Count(25, 30, 1)
    ledger.recover_legacy_rollback(imported, 8, time=fresh)
    recount, basis = ledger.observations[-2:]
    assert basis.time == fresh and not basis.legacy
    assert basis.rebased_from == recount.order and basis.order > recount.order
    assert basis.cursor >= recount.cursor
    later_file = Source(2, 10, 40, True)
    assert classify(later_file, basis.time) == "unknown"  # old window would say AFTER
    ledger.cancel(imported)
    ledger.complete()
    assert ledger.stock == 8


if __name__ == "__main__":
    check_bounds()
    check_counterexamples()
    check_lifecycle()
    check_legacy_recovery()
    print("PASS: temporal bounds, causal receipt, zero-net split, revision, count/rollback lifecycle, legacy recovery")
