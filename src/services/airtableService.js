import axios from 'axios';

export async function listBases(user) {
  const res = await axios.get('https://api.airtable.com/v0/meta/bases', {
    headers: { Authorization: `Bearer ${user.accessToken}` }
  });
  return res.data.bases;
}

export async function listTables(user, baseId) {
  const res = await axios.get(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
    headers: { Authorization: `Bearer ${user.accessToken}` }
  });
  return res.data.tables;
}

export async function listFields(user, baseId, tableId) {
  try {
    const tables = await listTables(user, baseId);
    const table = tables.find(t => t.id === tableId);
    return table ? table.fields : [];
  } catch (e) {
    console.error('Error fetching fields:', e);
    return [];
  }
}

export async function createRecord(user, baseId, tableNameOrId, recordObj) {
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableNameOrId)}`;
  const res = await axios.post(url, { fields: recordObj }, {
    headers: { Authorization: `Bearer ${user.accessToken}`, 'Content-Type': 'application/json' }
  });
  return res.data;
}


