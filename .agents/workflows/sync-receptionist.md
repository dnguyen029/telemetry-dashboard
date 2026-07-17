---
description: Deploy and sync the Receptionist ADK logic to the live telephony environment.
---

When the user types `/sync-receptionist`, coordinate the agents as follows:

1. **Acknowledge**: Inform the user that you are deploying the latest ADK logic from `/home/dnguyen029/antigravity-project/app_build/receptionist` to the Google Agent Platform to sync the live phone number.
2. **Execute Deployment**: Run the deployment command in the background (ensuring we copy the latest prompts first!):
   ```bash
   cp /home/dnguyen029/antigravity-project/.agents/agents/*.txt /home/dnguyen029/antigravity-project/app_build/receptionist/app/agents/ && cd /home/dnguyen029/antigravity-project/app_build/receptionist && agents-cli deploy --region us-central1 --project arielcsx --no-confirm-project --no-wait
   ```
3. **Check Status**: Use `agents-cli deploy --status` to check if it has finished. Inform the user that the deployment typically takes 5-10 minutes and that they can test the live phone line once the status reports a success.
