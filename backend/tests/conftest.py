"""
Pytest conftest — test configuration and shared fixtures.
Network egress is blocked to enforce on-device rule.
"""
import socket

import pytest

# ---------------------------------------------------------------------------
# Block network egress (Rule 1: 100% on-device)
# ---------------------------------------------------------------------------
_real_socket_connect = socket.socket.connect


def _blocked_connect(self, address):  # type: ignore[override]
    raise ConnectionRefusedError(
        f"[HALO TEST ISOLATION] Network access blocked in tests. "
        f"Attempted connection to {address}. "
        f"All Halo computations must be on-device only."
    )


@pytest.fixture(autouse=True)
def block_network(monkeypatch):
    """Block all socket connections during tests (except loopback)."""
    monkeypatch.setattr(socket.socket, "connect", _blocked_connect)
    yield
    monkeypatch.setattr(socket.socket, "connect", _real_socket_connect)


# ---------------------------------------------------------------------------
# Shared fixtures
# ---------------------------------------------------------------------------
@pytest.fixture
def fy_2024_25():
    return "2024-25"


@pytest.fixture
def fy_2025_26():
    return "2025-26"
