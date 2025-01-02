from __future__ import annotations

import json
import pathlib
import typing
from collections import OrderedDict
from datetime import date, timedelta

import matplotlib.dates as mdates
import matplotlib.pyplot as plt

if typing.TYPE_CHECKING:
    from collections.abc import Iterable

REPO = pathlib.Path(__file__).parent
TOML = REPO / "data.json"


def main() -> None:
    with TOML.open("rb") as f:
        data = json.load(f)["completed"]

    data = [{"date": date(2024, 12, 31), "pushups": 0}] + data
    data = sorted(data, key=lambda row: row["date"])
    pushups = {row["date"]: row["pushups"] for row in data}

    # fill in any gaps
    first = min(pushups)
    final = max(pushups)

    for delta in range((final - first).days):
        current = first + timedelta(days=delta)
        if current not in pushups:
            pushups[current] = 0

    # replace values with running total
    total = 0
    pushups = OrderedDict(sorted(pushups.items(), key=lambda pair: pair[0]))

    for key, value in pushups.items():
        total += value
        pushups[key] = total

    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter("%Y-%m-%d"))
    plt.gca().xaxis.set_major_locator(mdates.DayLocator(interval=5))
    plt.plot(pushups.keys(), pushups.values(), color="blue", label="completed")
    plt.gcf().autofmt_xdate()
    plot_burndown(pushups)
    plot_prediction(pushups)
    plt.legend()
    plt.show()


def plot_burndown(pushups: Iterable[date]):
    """Plot the required burndown for our exercise plan"""
    dates = _build_out_dates(pushups)
    burn = [3 * x for x in range(len(dates))]
    plt.plot(dates, burn, color="gray", linestyle="dashed", label="burndown")


def plot_prediction(pushups: dict[date, int]):
    """Plot how we will do by the end of the year at current rates"""
    days = len(pushups) - 1
    total = max(pushups.values())
    per_day = total / days

    dates = _build_out_dates(pushups)
    values = [per_day * x for x in range(len(dates))]
    plt.plot(dates, values, color="red", linestyle="dotted", label="prediction")


def _build_out_dates(pushups: Iterable[date], horizon: int = 30) -> list[date]:
    dates = list(pushups)
    for _ in range(horizon):
        if (new := dates[-1] + timedelta(days=1)) < date(2026, 1, 1):
            dates.append(new)
    return dates


if __name__ == "__main__":
    main()
