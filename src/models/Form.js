import { Schema as _Schema, model } from 'mongoose';
const Schema = _Schema;

const ConditionSchema = new Schema({
  questionKey: String,
  operator: { type: String, enum: ['equals','notEquals','contains'] },
  value: Schema.Types.Mixed
}, { _id: false });

const RulesSchema = new Schema({
  logic: { type: String, enum: ['AND','OR'], default: 'AND' },
  conditions: [ConditionSchema]
}, { _id: false });

const QuestionSchema = new Schema({
  questionKey: String,
  airtableFieldId: String,
  label: String,
  type: String,
  required: { type: Boolean, default: false },
  conditionalRules: { type: RulesSchema, default: null },
  // store options for select fields for validation
  options: [String]
}, { _id: false });

const FormSchema = new Schema({
  ownerUserId: String,
  airtableBaseId: String,
  webhookId: String,
  airtableTableId: String,
  title: String,
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now }
});

export default model('Form', FormSchema);
