from __future__ import annotations

import json
import pathlib
from datetime import date

from pydantic import BaseModel

REPO = pathlib.Path(__file__).parent
TOML = REPO / "data.json"


class _ComletedRecord(BaseModel):
    date: date
    pushups: int


class _DataFile(BaseModel):
    title: str
    completed: list[_ComletedRecord]


def test_json_spec() -> None:
    with TOML.open() as f:
        data = json.load(f)

    _DataFile.model_validate(data)

    # check the file is nonempty
    assert data["completed"], "completed should not be empty"
