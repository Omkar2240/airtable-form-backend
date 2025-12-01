import axios from "axios";
import ResponseModel from "../models/Response.js";
import Form from "../models/Form.js";
import User from "../models/User.js";

export async function airtableWebhookHandler(req, res) {
  try {
    const body = req.body;

    // 1️⃣ Handle Webhook Challenge Handshake FIRST
    if (body.challenge) {
      console.log("🔐 Airtable Challenge:", body.challenge);
      return res.json({ challenge: body.challenge });
    }

    // 2️⃣ Handle Webhook Ping Events
    if (body.webhook && body.base) {
      console.log("📡 Received Airtable Ping:", body);

      // Respond quickly so Airtable doesn't retry, then fetch payloads async
      res.status(200).json({ success: true, message: "Webhook ping received" });

      (async () => {
        try {
          const baseId = body.base?.id;
          const webhookId = body.webhook?.id;
          if (!baseId || !webhookId) {
            console.log('Ping missing base or webhook id, skipping payload fetch');
            return;
          }

          const form = await Form.findOne({ airtableBaseId: baseId, webhookId: webhookId });
          if (!form) {
            console.log('No form found for webhook/base:', webhookId, baseId);
            return;
          }

          let owner = await User.findById(form.ownerUserId);
          if (!owner) owner = await User.findOne({ airtableUserId: form.ownerUserId });
          if (!owner) {
            console.log('No owner found for form; cannot fetch webhook payloads');
            return;
          }

          const listUrl = `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads`;
          const listRes = await axios.get(listUrl, {
            headers: { Authorization: `Bearer ${owner.accessToken}` }
          });

          const payloads = listRes.data?.payloads || listRes.data?.data || listRes.data || [];
          for (const p of payloads) {
            const changes = p?.changes || p?.payload?.changes || [];
            await processEvents(changes);
          }
        } catch (err) {
          console.error('Error fetching webhook payloads:', err?.response?.data || err.message);
        }
      })();

      return; // already responded
    }

    // 3️⃣ Handle Record Updates/Deletes
    const { event, recordId, fields } = body;

    if (!recordId) {
      return res.json({ ok: true, message: "Ignoring event with no recordId" });
    }

    const doc = await ResponseModel.findOne({ airtableRecordId: recordId });

    if (!doc) return res.status(404).json({ error: "Record not found locally" });

    if (event === "update") {
      doc.answers = { ...doc.answers, ...fields };
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ ok: true, updated: doc._id });
    }

    if (event === "delete") {
      doc.deletedInAirtable = true;
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ ok: true, deleted: doc._id });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// Helper: process an array of Airtable change events and update local DB
async function processEvents(events) {
  if (!Array.isArray(events)) return;

  for (const evt of events) {
    try {
      if (evt.path === "/tables" || (evt.path || '').includes("records")) {
        const record = evt.record;
        if (!record) continue;

        const recordId = record.id;
        const localDoc = await ResponseModel.findOne({ airtableRecordId: recordId });
        if (!localDoc) {
          console.log("Record not found locally:", recordId);
          continue;
        }

        if (evt.action === "update") {
          localDoc.answers = { ...localDoc.answers, ...(record.fields || {}) };
          localDoc.updatedAt = new Date();
          await localDoc.save();
          console.log('Updated local record from webhook:', recordId);
        }

        if (evt.action === "delete") {
          localDoc.deletedInAirtable = true;
          localDoc.updatedAt = new Date();
          await localDoc.save();
          console.log('Marked local record deleted from webhook:', recordId);
        }
      }
    } catch (err) {
      console.error('Error processing event:', err?.message || err);
    }
  }
}
