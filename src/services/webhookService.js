import axios from "axios";

export async function registerWebhook(user, baseId) {
  const url = `https://api.airtable.com/v0/bases/${baseId}/webhooks`;

  const notifyUrl = process.env.WEBHOOK_URL;

  if (!notifyUrl) {
    throw new Error('Missing WEBHOOK_URL environment variable. Set WEBHOOK_URL to the public HTTPS URL for your webhook endpoint.');
  }

  if (!/^https:\/\//i.test(notifyUrl)) {
    throw new Error('WEBHOOK_URL must be an HTTPS URL starting with "https://"');
  }

  try {
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
  } catch (err) {
    // Log useful details from Airtable so debugging is easier
    console.error('Error registering webhook:', err.message);
    if (err.response) {
      console.error('Airtable response status:', err.response.status);
      console.error('Airtable response data:', JSON.stringify(err.response.data, null, 2));
    }
    // If we've hit Airtable's limit for webhooks created by this OAuth integration
    // in this base, try to list existing webhooks and reuse one instead of failing.
    const errType = err.response?.data?.error?.type;
    if (errType === 'TOO_MANY_WEBHOOKS_BY_OAUTH_INTEGRATION_IN_BASE') {
      try {
        console.log('Attempting to list existing webhooks to reuse one...');
        const listRes = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            "Content-Type": "application/json"
          }
        });

        const payload = listRes.data || {};
        // Airtable may return { webhooks: [...] } or { data: [...] }
        const items = payload.webhooks || payload.data || payload;

        const arr = Array.isArray(items) ? items : [];
        if (arr.length === 0) {
          console.error('No existing webhooks found to reuse. Manual cleanup required.');
          throw err;
        }

        // Prefer a webhook that already targets our notification URL
        const notifyUrl = process.env.WEBHOOK_URL;
        const match = arr.find(w => w.notificationUrl === notifyUrl) || arr[0];

        console.log('Reusing existing webhook:', match.id || match);
        return match;
      } catch (listErr) {
        console.error('Failed to list or reuse webhooks:', listErr.response?.data || listErr.message);
        throw err;
      }
    }

    throw err;
  }
}
