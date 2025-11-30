import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const ResponseSchema = new Schema({
  formId: { type: Schema.Types.ObjectId, ref: 'Form' },
  airtableRecordId: String,
  answers: Schema.Types.Mixed,
  status: { type: String, default: 'ok' },
  deletedInAirtable: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: Date
});

export default model('Response', ResponseSchema);
