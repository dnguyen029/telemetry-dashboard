"""
TOON (Token-Optimized Object Notation) Converter
Converts verbose JSON structures to compact TOON format for reduced token consumption.
Utilizes the 'toon' library for Protocol 2.0 support.
"""

import json
from typing import Any

import toon

from .config import CHARS_PER_TOKEN, MAX_DEPTH


class TOONConverter:
    """
    Converts JSON to TOON format and vice versa using the toon library.
    """

    def __init__(self, aggressive: bool = False, max_depth: int = MAX_DEPTH):
        """
        Initialize TOON converter.

        Args:
            aggressive: If True, uses advanced compression strategies.
            max_depth: Maximum recursion depth (enforced by the library).
        """
        self.aggressive = aggressive
        self.max_depth = max_depth

    def json_to_toon(self, data: dict | list | str) -> str:
        """
        Convert JSON to TOON format using toon.encoder.encode().

        Args:
            data: JSON data (dict, list, or JSON string)

        Returns:
            TOON formatted string
        """
        if isinstance(data, str):
            data = json.loads(data)

        # Enforce recursion depth limit manually
        data = self._cap_depth(data, self.max_depth)

        # TOON 2.0 encoding
        options = {
            "delimiter": "|",
            "key_folding": "safe" if self.aggressive else "off"
        }
        return toon.encode(data, options=options)

    def _cap_depth(self, data: Any, depth: int) -> Any:
        """Recursively cap object depth."""
        if depth <= 0:
            if isinstance(data, (dict, list)):
                return "<MAX_DEPTH>"
            return data

        if isinstance(data, dict):
            return {k: self._cap_depth(v, depth - 1) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._cap_depth(item, depth - 1) for item in data]
        return data

    def toon_to_json(self, toon_str: str) -> str:
        """
        Convert TOON format back to JSON using toon.decoder.decode().

        Args:
            toon_str: TOON formatted string

        Returns:
            Standard JSON string
        """
        # TOON 2.0 decoding
        json_data = toon.decode(toon_str, options={"default_delimiter": "|"})
        return json.dumps(json_data, indent=2)

    def calculate_savings(self, original_json: str, toon_str: str) -> dict[str, Any]:
        """
        Calculate token savings from TOON conversion.
        """
        original_chars = len(original_json)
        toon_chars = len(toon_str)
        original_tokens = max(1, original_chars // CHARS_PER_TOKEN)
        toon_tokens = max(1, toon_chars // CHARS_PER_TOKEN)
        tokens_saved = original_tokens - toon_tokens
        savings_percent = (tokens_saved / original_tokens * 100) if original_tokens > 0 else 0

        return {
            'original_chars': original_chars,
            'toon_chars': toon_chars,
            'original_tokens': original_tokens,
            'toon_tokens': toon_tokens,
            'tokens_saved': tokens_saved,
            'savings_percent': round(savings_percent, 2),
            'compression_ratio': round(toon_chars / original_chars, 3) if original_chars > 0 else 0,
        }


def convert_json_to_toon(json_data: dict | list | str, aggressive: bool = False) -> str:
    """
    Convenience function to convert JSON to TOON.
    """
    converter = TOONConverter(aggressive=aggressive)
    return converter.json_to_toon(json_data)


def convert_toon_to_json(toon_str: str) -> str:
    """
    Convenience function to convert TOON to JSON.
    """
    converter = TOONConverter()
    return converter.toon_to_json(toon_str)
