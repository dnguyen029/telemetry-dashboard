import json

from toon_converter import TOONConverter


def test():
    converter = TOONConverter()
    data = {"name": "Antigravity", "v": 2.0, "active": True, "tags": ["AI", "Swarm"]}

    print("Original data:", data)

    # Encode
    toon_str = converter.json_to_toon(data)
    print("TOON string:", toon_str)

    # Decode
    json_str = converter.toon_to_json(toon_str)
    decoded_data = json.loads(json_str)
    print("Decoded data:", decoded_data)

    # Verify
    assert data == decoded_data
    print("Verification SUCCESSFUL")

    # Test savings
    savings = converter.calculate_savings(json.dumps(data), toon_str)
    print("Savings statistics:", savings)

if __name__ == "__main__":
    test()
