import { Schema as _Schema, model } from 'mongoose';

const Schema = _Schema;

const UserSchema = new Schema({
  airtableUserId: String,
  accessToken: String,
  refreshToken: String,
  tokenExpiresAt: Date,
  profile: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

export default model('User', UserSchema);