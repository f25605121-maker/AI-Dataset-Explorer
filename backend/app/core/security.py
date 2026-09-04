import ipaddress
import re
import socket
from typing import Tuple
from urllib.parse import urlparse
from fastapi import HTTPException, status

# Private IP ranges per SSRF security rule in AGENTS.md
PRIVATE_NETWORKS = [
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?previous\s+instructions", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?prior\s+instructions", re.IGNORECASE),
    re.compile(r"system\s*prompt", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+a\b", re.IGNORECASE),
    re.compile(r"<\|im_start\|>|<\|im_end\|>", re.IGNORECASE),
    re.compile(r"assistant\s+override", re.IGNORECASE),
]


def validate_url_safe(url: str) -> bool:
    """
    Validates that a URL is safe to fetch (SSRF Prevention):
    - Scheme must be http or https
    - Hostname must resolve to a public, non-private IP
    """
    try:
        parsed = urlparse(url)
        if parsed.scheme.lower() not in ("http", "https"):
            return False
        
        hostname = parsed.hostname
        if not hostname:
            return False
        
        # Check if hostname directly is an IP
        try:
            ip = ipaddress.ip_address(hostname)
            for net in PRIVATE_NETWORKS:
                if ip in net:
                    return False
        except ValueError:
            # Resolve DNS
            addr_info = socket.getaddrinfo(hostname, None)
            for item in addr_info:
                ip_str = item[4][0]
                ip = ipaddress.ip_address(ip_str)
                for net in PRIVATE_NETWORKS:
                    if ip in net:
                        return False
        return True
    except Exception:
        return False


def sanitize_search_query(query: str, max_length: int = 2000) -> str:
    """
    Validates and cleans user search query input.
    """
    if not query or not query.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty."
        )
    
    cleaned = query.strip()
    if len(cleaned) > max_length:
        cleaned = cleaned[:max_length]
        
    return cleaned


def scan_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Scans text for adversarial prompt injection attempts.
    Returns (is_safe, reason).
    """
    for pattern in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            return False, "Security violation: potentially adversarial prompt instruction detected."
    return True, "Safe"
