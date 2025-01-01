from __future__ import annotations

import pathlib
from datetime import date

try:
    import tomllib
except ImportError:
    import tomli as tomllib

REPO = pathlib.Path(__file__).parent
TOML = REPO / "finished.toml"


def test_toml_spec() -> None:
    # NOTE: could just use pydantic or similar
    with TOML.open("rb") as f:
        data = tomllib.load(f)

    assert isinstance(data, dict)
    assert "completed" in data

    data = data["completed"]
    assert isinstance(data, list)
    assert data

    spec = {"date": date, "pushups": int}
    for row in data:
        assert isinstance(row, dict)
        for key, type_ in spec.items():
            assert key in row
            assert isinstance(row[key], type_)
