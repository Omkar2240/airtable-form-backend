import axios from "axios";

export async function registerWebhook(user, baseId) {
  const url = `https://api.airtable.com/v0/bases/${baseId}/webhooks`;

  const notifyUrl = process.env.WEBHOOK_URL;

  const res = await axios.post(
    url,
    {
      notificationUrl: notifyUrl, 
      specification: {
        options: {
          filters: {
            dataTypes: ["tableData"]
          }
        }
      }
    },
    {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
        "Content-Type": "application/json"
      }
    }
  );

  console.log("Webhook registered:", res.data);
  return res.data; // webhook ID returned
}
