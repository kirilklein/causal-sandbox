"""Independent targeting check: python3 tests/tmle-reference.py."""

import json
import math
import subprocess
from decimal import Decimal, getcontext
from pathlib import Path
from random import Random


def reference(data, fits):
    """Minimize the loss directly; do not use the normal-equation formula."""
    probabilities = [
        max(Decimal("0.02"), min(Decimal("0.98"), Decimal(str(p))))
        for p in fits["propensities"]
    ]
    m0, m1 = (
        [Decimal(str(value)) for value in fits[key]] for key in ("m0", "m1")
    )
    h = [
        1 / p if row["A"] else -1 / (1 - p)
        for row, p in zip(data, probabilities, strict=True)
    ]
    residual = [
        Decimal(str(row["Y"])) - (m1[i] if row["A"] else m0[i])
        for i, row in enumerate(data)
    ]

    def loss(epsilon):
        return sum(
            (r - epsilon * direction) ** 2 for r, direction in zip(residual, h)
        )

    # Every individual quadratic is minimized at r/H; their sum's minimizer
    # lies between the smallest and largest of those individual minimizers.
    centers = [r / direction for r, direction in zip(residual, h)]
    low, high = min(centers), max(centers)
    ratio = (Decimal(5).sqrt() - 1) / 2
    for _ in range(200):
        left, right = high - ratio * (high - low), low + ratio * (high - low)
        if loss(left) < loss(right):
            high = right
        else:
            low = left
    epsilon = (low + high) / 2
    updated0 = [q - epsilon / (1 - p) for q, p in zip(m0, probabilities)]
    updated1 = [q + epsilon / p for q, p in zip(m1, probabilities)]
    ate = sum(q1 - q0 for q0, q1 in zip(updated0, updated1)) / len(data)
    return {
        "epsilon": float(epsilon),
        "estimate": float(ate),
        "m0": list(map(float, updated0)),
        "m1": list(map(float, updated1)),
    }


def fixtures():
    yield {
        "data": [{"A": 0, "Y": 1}, {"A": 1, "Y": 4}],
        "fits": {"m0": [0, 1], "m1": [2, 3], "propensities": [0.25, 0.5]},
    }
    rng = Random(871)
    for strength in (0, 1, 8):
        data, fits = [], {"m0": [], "m1": [], "propensities": []}
        for _ in range(120):
            w = rng.uniform(-2, 2)
            p = 1 / (1 + math.exp(-strength * w))
            a = int(rng.random() < p)
            data.append({"A": a, "Y": 2 * w + (2 + w) * a + rng.gauss(0, 1)})
            fits["m0"].append(0.5 * w)
            fits["m1"].append(0.5 * w + 1)
            fits["propensities"].append(p)
        yield {"data": data, "fits": fits}
    yield {
        "data": [{"A": i % 2, "Y": i - 2} for i in range(6)],
        "fits": {
            "m0": [0] * 6,
            "m1": [1] * 6,
            "propensities": [0, 1, 0.01, 0.99, 0.02, 0.98],
        },
    }


def main():
    getcontext().prec = 80
    cases = list(fixtures())
    script = """
import { readFileSync } from 'node:fs';
import { targetContinuousAte } from './src/tmle.js';
const cases = JSON.parse(readFileSync(0, 'utf8'));
const results = cases.map(({data, fits}) => targetContinuousAte(data, fits));
console.log(JSON.stringify(results));
"""
    process = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=Path(__file__).resolve().parents[1],
        input=json.dumps(cases),
        capture_output=True,
        text=True,
        check=True,
    )
    actual = json.loads(process.stdout)
    max_error = 0
    for index, (case, result) in enumerate(zip(cases, actual, strict=True)):
        if result["status"] != "ok":
            raise AssertionError((index, result))
        expected = reference(case["data"], case["fits"])
        for key in expected:
            values = (
                zip(result[key], expected[key], strict=True)
                if isinstance(expected[key], list)
                else [(result[key], expected[key])]
            )
            for observed, wanted in values:
                max_error = max(max_error, abs(observed - wanted))
                if not math.isclose(
                    observed, wanted, rel_tol=1e-10, abs_tol=1e-11
                ):
                    raise AssertionError((index, key, observed, wanted))
    print(
        f"{len(cases)} independent decimal loss-minimization checks passed; "
        f"max absolute error {max_error:.3g}"
    )


if __name__ == "__main__":
    main()
