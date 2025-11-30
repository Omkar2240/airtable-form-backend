import Form from "../models/Form.js";
import ResponseModel from "../models/Response.js";
import { createRecord } from "../services/airtableService.js";
import User from "../models/User.js";
import { registerWebhook } from "../services/webhookService.js";

async function getUser(req) {
  const userId = req.headers["x-user-id"];
  if (!userId) throw new Error("User not authenticated");

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  return user;
}

export async function createForm(req, res) {
  try {
    const form = new Form(req.body);
    // create webhook before form saving
    const user = await getUser(req);
    const airtableBaseId = form.airtableBaseId;
    const webhook = await registerWebhook(user, airtableBaseId);
    form.webhookId = webhook.id;
    await form.save();
    res.json(form);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: err.message });
  }
}

export async function getForm(req, res) {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ error: "Form not found" });
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function submitForm(req, res) {
  try {
    const form = await Form.findById(req.params.formId);
    if (!form) return res.status(404).json({ error: "Form not found" });

    const answers = req.body.answers || {};

    for (const q of form.questions) {
      const val = answers[q.questionKey];

      if (
        q.required &&
        (val === undefined ||
          val === "" ||
          val === null ||
          (Array.isArray(val) && val.length === 0))
      ) {
        return res
          .status(400)
          .json({ error: `Missing required field: ${q.label}` });
      }

      if (val && (q.type === "singleSelect" || q.type === "multipleSelects")) {
        const options = q.options || [];
        const values = Array.isArray(val) ? val : [val];
        for (const v of values) {
          if (!options.includes(v)) {
            return res
              .status(400)
              .json({ error: `Invalid option '${v}' for field ${q.label}` });
          }
        }
      }
    }

    const airtableFields = {};
    for (const q of form.questions) {
      if (answers[q.questionKey] !== undefined) {
        airtableFields[q.label] = answers[q.questionKey];
      }
    }

    let owner = await User.findById(form.ownerUserId);
    if (!owner) {
      owner = await User.findOne({ airtableUserId: form.ownerUserId });
    }

    if (!owner) {
      return res.status(500).json({ error: "Form owner not found" });
    }

    const record = await createRecord(
      owner,
      form.airtableBaseId,
      form.airtableTableId,
      airtableFields
    );

    const response = new ResponseModel({
      formId: form._id,
      airtableRecordId: record.id,
      answers,
      createdAt: new Date(),
    });
    await response.save();

    res.json({ success: true, recordId: record.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

export async function listResponses(req, res) {
  try {
    const responses = await ResponseModel.find({
      formId: req.params.formId,
    }).sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
