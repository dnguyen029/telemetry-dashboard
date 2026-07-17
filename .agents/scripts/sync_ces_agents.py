import urllib.request
import json
import subprocess
import os

token_cmd = "gcloud auth print-access-token 2>/dev/null || gcloud auth application-default print-access-token 2>/dev/null"
token = subprocess.check_output(token_cmd, shell=True).decode('utf-8').strip()

app_name = "projects/arielcsx/locations/us/apps/f65b3a44-7067-4a78-8d7e-3e3ebefdcfd3"

def get_agents():
    url = f"https://ces.googleapis.com/v1/{app_name}/agents"
    req = urllib.request.Request(url)
    req.add_header('Authorization', f'Bearer {token}')
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode()).get('agents', [])

def update_agent_instruction(agent_name, new_instruction):
    url = f"https://ces.googleapis.com/v1/{agent_name}?updateMask=instruction"
    payload = json.dumps({"instruction": new_instruction}).encode('utf-8')
    req = urllib.request.Request(url, data=payload, method='PATCH')
    req.add_header('Authorization', f'Bearer {token}')
    req.add_header('Content-Type', 'application/json')
    with urllib.request.urlopen(req) as response:
        print(f"Updated {agent_name} successfully.")

def read_file(filepath):
    with open(filepath, 'r') as f:
        return f.read()

agents = get_agents()
mapping = {
    "After Hours Specialist": "/home/dnguyen029/antigravity-project/.agents/agents/receptionist.txt"
}

for agent in agents:
    display_name = agent['displayName']
    name = agent['name']
    
    if display_name in mapping:
        path = mapping[display_name]
        if os.path.exists(path):
            new_inst = read_file(path)
            print(f"Updating {display_name} with contents of {path}...")
            update_agent_instruction(name, new_inst)
        else:
            print(f"File {path} not found for {display_name}")

print("Done sync.")
