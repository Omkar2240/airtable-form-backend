import ResponseModel from '../models/Response.js';

export async function airtableWebhookHandler(req, res) {
  try {
    const body = req.body;
    
    if (body.webhook && body.base) {
      console.log('Received Airtable Webhook Ping:', body);
      return res.json({ success: true, message: 'Webhook received' });
    }

    const { event, recordId, fields } = body;
    
    if (!recordId) return res.json({ ok: true, message: 'No recordId' });

    const doc = await ResponseModel.findOne({ airtableRecordId: recordId });

    if (!doc) return res.status(404).json({ error: 'Record not found locally' });

    if (event === 'update') {
      doc.answers = { ...doc.answers, ...fields };
      doc.updatedAt = new Date();
      await doc.save();
      return res.json({ ok: true, updated: doc._id });
    }

    if (event === 'delete') {
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
