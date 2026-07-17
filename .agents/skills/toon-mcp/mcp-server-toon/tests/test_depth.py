
import os
import sys
import json

# Add src to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.toon_converter import TOONConverter


def test_recursion_depth_protection():
    converter = TOONConverter(max_depth=5)

    # Create deeply nested dict
    nested = {"a": 1}
    for i in range(10):
        nested = {"next": nested}

    # Convert to TOON
    toon_str = converter.json_to_toon(nested)

    # Restore to JSON
    json_str = converter.toon_to_json(toon_str)
    toon_data = json.loads(json_str)

    # Traverse down
    curr = toon_data
    depth = 0
    while isinstance(curr, dict) and 'next' in curr:
        curr = curr['next']
        depth += 1

    assert curr == "<MAX_DEPTH>"
    assert depth == 5

def test_recursion_depth_protection_from_toon():
    # Test that we can decode a TOON string and get back a capped structure
    # if it was encoded with a cap.
    converter = TOONConverter(max_depth=5)

    # Create deeply nested dict
    nested = {"a": 1}
    for i in range(10):
        nested = {"next": nested}
    
    # Manually cap it for a "from_toon" test simulation
    capped_nested = converter._cap_depth(nested, 5)
    
    # Round-trip check
    toon_str = converter.json_to_toon(nested)
    json_res = converter.toon_to_json(toon_str)
    json_data = json.loads(json_res)
    
    curr = json_data
    depth = 0
    while isinstance(curr, dict) and "next" in curr:
        curr = curr["next"]
        depth += 1
    
    assert curr == "<MAX_DEPTH>"
    assert depth == 5
