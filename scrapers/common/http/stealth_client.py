"""
Stealth HTTP client com múltiplas estratégias anti-bot:
1. FlareSolverr (bypassa Cloudflare - GRÁTIS via Docker)
2. curl-cffi (fingerprint TLS de browser real)
3. nodriver (Chrome não detectável)
4. Rotação de User-Agent
"""
import httpx
import json
import random
import asyncio
from typing import Optional
from loguru import logger
from fake_useragent import UserAgent
from curl_cffi import requests as cffi_requests

FLARESOLVERR_URL = "http://localhost:8191/v1"
ua = UserAgent()

BROWSER_FINGERPRINTS = [
    {"impersonate": "chrome120"},
    {"impersonate": "chrome119"},
    {"impersonate": "chrome116"},
    {"impersonate": "edge120"},
    {"impersonate": "firefox121"},
]


class StealthClient:
    """
    Client HTTP com múltiplas camadas anti-detecção.
    Ordem de tentativa: curl-cffi → FlareSolverr → httpx fallback
    """

    def __init__(self, use_flaresolverr: bool = True):
        self.use_flaresolverr = use_flaresolverr
        self.session_id: Optional[str] = None

    def _get_headers(self) -> dict:
        return {
            "User-Agent": ua.random,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Cache-Control": "max-age=0",
        }

    def get_with_cffi(self, url: str, **kwargs) -> Optional[cffi_requests.Response]:
        """Usa curl-cffi com fingerprint TLS de browser real — contorna a maioria dos WAFs."""
        fp = random.choice(BROWSER_FINGERPRINTS)
        try:
            resp = cffi_requests.get(
                url,
                impersonate=fp["impersonate"],
                headers=self._get_headers(),
                timeout=30,
                **kwargs,
            )
            if resp.status_code == 200:
                return resp
        except Exception as e:
            logger.warning(f"cffi failed for {url}: {e}")
        return None

    def get_with_flaresolverr(self, url: str, wait_ms: int = 3000) -> Optional[dict]:
        """
        Usa FlareSolverr (Docker) para bypass de Cloudflare.
        Inicia uma sessão reutilizável para evitar criar nova instância a cada request.
        """
        if not self.use_flaresolverr:
            return None

        try:
            # Cria sessão reutilizável se não existir
            if not self.session_id:
                r = httpx.post(
                    FLARESOLVERR_URL,
                    json={"cmd": "sessions.create"},
                    timeout=30,
                )
                if r.status_code == 200:
                    self.session_id = r.json().get("session")

            payload = {
                "cmd": "request.get",
                "url": url,
                "maxTimeout": 60000,
                "waitMs": wait_ms,
            }
            if self.session_id:
                payload["session"] = self.session_id

            r = httpx.post(FLARESOLVERR_URL, json=payload, timeout=70)
            data = r.json()

            if data.get("status") == "ok":
                solution = data["solution"]
                return {
                    "html": solution.get("response", ""),
                    "cookies": solution.get("cookies", []),
                    "status": solution.get("status", 200),
                    "url": solution.get("url", url),
                }
        except Exception as e:
            logger.warning(f"FlareSolverr failed for {url}: {e}")
        return None

    def get(self, url: str, use_flare_for_cloudflare: bool = False) -> Optional[str]:
        """
        Método principal: tenta cffi primeiro, depois FlareSolverr se necessário.
        """
        # Tenta curl-cffi (rápido, bypassa maioria)
        resp = self.get_with_cffi(url)
        if resp:
            # Verifica se caiu em página de challenge do Cloudflare
            if "cf-browser-verification" not in resp.text and "Just a moment" not in resp.text:
                return resp.text

        # Se detectou Cloudflare ou falhou, usa FlareSolverr
        if use_flare_for_cloudflare or not resp:
            logger.info(f"Falling back to FlareSolverr for {url}")
            result = self.get_with_flaresolverr(url)
            if result:
                return result["html"]

        # Último recurso: httpx simples
        try:
            r = httpx.get(url, headers=self._get_headers(), timeout=30, follow_redirects=True)
            if r.status_code == 200:
                return r.text
        except Exception as e:
            logger.error(f"All methods failed for {url}: {e}")

        return None

    def destroy_session(self):
        """Destrói a sessão FlareSolverr ao finalizar."""
        if self.session_id:
            try:
                httpx.post(
                    FLARESOLVERR_URL,
                    json={"cmd": "sessions.destroy", "session": self.session_id},
                    timeout=10,
                )
            except Exception:
                pass
            self.session_id = None
