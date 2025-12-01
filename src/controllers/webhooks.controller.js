import axios from "axios";
import ResponseModel from "../models/Response.js";
import Form from "../models/Form.js";
import User from "../models/User.js";

export async function airtableWebhookHandler(req, res) {
  try {
    const body = req.body;

    if (body.challenge) {
      console.log("🔐 Airtable Challenge:", body.challenge);
      return res.json({ challenge: body.challenge });
    }

    if (body.webhook && body.base) {
      console.log("📡 Received Airtable Ping:", body);

      res.status(200).json({ success: true, message: "Webhook ping received" });

      (async () => {
        try {
          const baseId = body.base?.id;
          const webhookId = body.webhook?.id;
          if (!baseId || !webhookId) {
            console.log('[Webhook] Ping missing base or webhook id, skipping payload fetch');
            return;
          }

          const form = await Form.findOne({ airtableBaseId: baseId, webhookId: webhookId });
          if (!form) {
            console.log('[Webhook] No form found for webhook/base:', webhookId, baseId);
            return;
          }

          let owner = await User.findById(form.ownerUserId);
          if (!owner) owner = await User.findOne({ airtableUserId: form.ownerUserId });
          if (!owner) {
            console.log('[Webhook] No owner found for form; cannot fetch payloads');
            return;
          }

          const listUrl = `https://api.airtable.com/v0/bases/${baseId}/webhooks/${webhookId}/payloads`;
          const listRes = await axios.get(listUrl, {
            headers: { Authorization: `Bearer ${owner.accessToken}` }
          });

          const payloads = listRes.data?.payloads || listRes.data?.data || listRes.data || [];
          console.log(`[Webhook] Retrieved ${payloads.length} payload(s) for webhook ${webhookId}`);
          for (const payload of payloads) {
            if (Array.isArray(payload?.changes) && payload.changes.length) {
              await processEvents(payload.changes, form);
              continue;
            }

            if (payload?.changedTablesById) {
              await processChangedTablesPayload(payload.changedTablesById, form);
              continue;
            }

            console.log('[Webhook] Unrecognized payload shape:', JSON.stringify(payload).slice(0, 500));
          }
        } catch (err) {
          console.error('[Webhook] Error fetching webhook payloads:', err?.response?.data || err.message);
        }
      })();

      return; 
    }

    const { event, recordId, fields } = body;

    if (!recordId) {
      return res.json({ ok: true, message: "Ignoring event with no recordId" });
    }

    await applyRecordUpdate({ recordId, action: event, values: fields });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function processEvents(events, form) {
  if (!Array.isArray(events)) return;

  for (const evt of events) {
    try {
      if (evt.path === "/tables" || (evt.path || '').includes("records")) {
        const record = evt.record;
        if (!record) continue;

        await applyRecordUpdate({
          recordId: record.id,
          action: evt.action,
          values: record.fields || record.cellValuesByFieldId || {},
          form
        });
      }
    } catch (err) {
      console.error('Error processing event:', err?.message || err);
    }
  }
}

async function processChangedTablesPayload(changedTablesById, form) {
  const tables = Object.entries(changedTablesById || {});
  for (const [tableId, tablePayload] of tables) {
    console.log('[Webhook] Processing table payload', tableId);

    const created = tablePayload?.createdRecordsById || {};
    for (const [recordId, recordData] of Object.entries(created)) {
      await applyRecordUpdate({
        recordId,
        action: 'create',
        values: recordData?.cellValuesByFieldId || {},
        form
      });
    }

    const changed = tablePayload?.changedRecordsById || {};
    for (const [recordId, changeData] of Object.entries(changed)) {
      await applyRecordUpdate({
        recordId,
        action: 'update',
        values: changeData?.current?.cellValuesByFieldId || {},
        form
      });
    }

    const deleted = tablePayload?.deletedRecordsById || {};
    for (const recordId of Object.keys(deleted)) {
      await applyRecordUpdate({ recordId, action: 'delete', values: null, form });
    }
  }
}

async function applyRecordUpdate({ recordId, action, values, form }) {
  if (!recordId) return;

  const localDoc = await ResponseModel.findOne({ airtableRecordId: recordId });
  if (!localDoc) {
    console.log(`[Webhook] Response not found for Airtable record ${recordId} (action=${action})`);
    return;
  }

  let formDoc = form;
  if (!formDoc || (localDoc.formId && formDoc._id?.toString() !== localDoc.formId.toString())) {
    formDoc = await Form.findById(localDoc.formId);
  }

  if (action === 'delete') {
    localDoc.deletedInAirtable = true;
    localDoc.updatedAt = new Date();
    await localDoc.save();
    console.log(`[Webhook] Marked response ${localDoc._id} as deleted (record ${recordId})`);
    return;
  }

  const mappedValues = mapFieldsToQuestionKeys(formDoc, values);
  if (!Object.keys(mappedValues).length) {
    console.log('[Webhook] No mapped values for record', recordId, values);
    return;
  }

  localDoc.answers = { ...localDoc.answers, ...mappedValues };
  localDoc.updatedAt = new Date();
  await localDoc.save();
  console.log(`[Webhook] Updated response ${localDoc._id} from record ${recordId}`, mappedValues);
}

function mapFieldsToQuestionKeys(form, values) {
  if (!form || !values) return {};
  const result = {};
  const entries = Object.entries(values || {});

  for (const [fieldKey, rawValue] of entries) {
    const question = findQuestionForField(form, fieldKey);
    if (!question) continue;

    result[question.questionKey] = normalizeCellValue(rawValue);
  }

  return result;
}

function findQuestionForField(form, fieldKey) {
  if (!form || !Array.isArray(form.questions)) return null;
  const keyLower = (fieldKey || '').toLowerCase();
  return (
    form.questions.find(q => (q.airtableFieldId || '').toLowerCase() === keyLower) ||
    form.questions.find(q => (q.label || '').toLowerCase() === keyLower)
  );
}

function normalizeCellValue(raw) {
  if (raw === null || raw === undefined) return raw;

  if (Array.isArray(raw)) {
    return raw.map(item => normalizeCellValue(item)).filter(v => v !== undefined);
  }

  if (typeof raw === 'object') {
    if (Object.prototype.hasOwnProperty.call(raw, 'name')) {
      return raw.name;
    }
    if (Object.prototype.hasOwnProperty.call(raw, 'value')) {
      return raw.value;
    }
    return raw;
  }

  return raw;
}
