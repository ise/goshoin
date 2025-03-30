import { TriggerClient } from "@trigger.dev/sdk";
import { updateBookstores } from "@/trigger/update-bookstores";

const client = new TriggerClient({
  id: "proj_qmryethkfylqgamfxbdm",
  apiKey: process.env.TRIGGER_API_KEY!,
});
