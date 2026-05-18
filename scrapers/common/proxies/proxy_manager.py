"""Proxy rotation manager with health checks and fallback."""
import asyncio
import random
import time
from dataclasses import dataclass, field
from typing import Optional
from loguru import logger
import httpx
import os


@dataclass
class Proxy:
    host: str
    port: int
    username: Optional[str] = None
    password: Optional[str] = None
    failures: int = 0
    last_used: float = field(default_factory=time.time)
    response_time: float = 0.0

    @property
    def url(self) -> str:
        if self.username:
            return f"http://{self.username}:{self.password}@{self.host}:{self.port}"
        return f"http://{self.host}:{self.port}"

    @property
    def is_healthy(self) -> bool:
        return self.failures < 5


class ProxyManager:
    """Manages a pool of rotating proxies with health checking."""

    def __init__(self):
        self._proxies: list[Proxy] = []
        self._lock = asyncio.Lock()
        self._current_index = 0
        self._load_proxies()

    def _load_proxies(self):
        proxy_list = os.getenv("RESIDENTIAL_PROXY_LIST", "").split(",")
        for proxy_str in proxy_list:
            if not proxy_str.strip():
                continue
            parts = proxy_str.strip().split(":")
            if len(parts) >= 2:
                proxy = Proxy(
                    host=parts[0],
                    port=int(parts[1]),
                    username=parts[2] if len(parts) > 2 else None,
                    password=parts[3] if len(parts) > 3 else None,
                )
                self._proxies.append(proxy)
        logger.info(f"Loaded {len(self._proxies)} proxies")

    async def get_proxy(self) -> Optional[Proxy]:
        """Get next healthy proxy using round-robin with health filtering."""
        async with self._lock:
            if not self._proxies:
                return None

            healthy = [p for p in self._proxies if p.is_healthy]
            if not healthy:
                # Reset failures if all proxies are down
                for p in self._proxies:
                    p.failures = 0
                healthy = self._proxies

            # Sort by least recently used
            healthy.sort(key=lambda p: p.last_used)
            proxy = healthy[0]
            proxy.last_used = time.time()
            return proxy

    def mark_failed(self, proxy: Proxy):
        proxy.failures += 1
        logger.warning(f"Proxy {proxy.host}:{proxy.port} failed ({proxy.failures} times)")

    def mark_success(self, proxy: Proxy, response_time: float):
        proxy.failures = max(0, proxy.failures - 1)
        proxy.response_time = response_time

    async def check_proxy(self, proxy: Proxy, test_url: str = "https://httpbin.org/ip") -> bool:
        """Check if proxy is alive."""
        try:
            start = time.time()
            async with httpx.AsyncClient(proxies=proxy.url, timeout=10) as client:
                resp = await client.get(test_url)
                elapsed = time.time() - start
                if resp.status_code == 200:
                    self.mark_success(proxy, elapsed)
                    return True
        except Exception:
            self.mark_failed(proxy)
        return False

    async def get_proxied_client(self, timeout: int = 30) -> httpx.AsyncClient:
        """Get httpx client configured with a rotating proxy."""
        proxy = await self.get_proxy()
        if proxy:
            return httpx.AsyncClient(
                proxies=proxy.url,
                timeout=timeout,
                headers={"User-Agent": self._random_ua()},
                follow_redirects=True,
            )
        return httpx.AsyncClient(
            timeout=timeout,
            headers={"User-Agent": self._random_ua()},
            follow_redirects=True,
        )

    @staticmethod
    def _random_ua() -> str:
        uas = [
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
        ]
        return random.choice(uas)


# Singleton instance
proxy_manager = ProxyManager()
