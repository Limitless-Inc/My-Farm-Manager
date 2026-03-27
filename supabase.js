const SUPA_URL = 'https://znchlwpfpgeatlwanrir.supabase.co';
const SUPA_KEY = 'sb_publishable_-sxPcBCfjOIzbsCbb4LoGw_YaiuJFP0';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);

/* Map storage keys to table names */
const TABLE = {
  mf_records:     'records',
  mf_innovations: 'innovations',
  mf_news:        'news',
  mf_products:    'products'
};

async function dbLoad(key) {
  const table = TABLE[key];
  if (!table) return JSON.parse(localStorage.getItem(key) || '[]');
  const { data, error } = await sb.from(table).select('*').order('created', { ascending: false });
  if (error) { console.error(error); return []; }
  return data;
}

async function dbInsert(key, item) {
  const table = TABLE[key];
  if (!table) {
    const arr = JSON.parse(localStorage.getItem(key) || '[]');
    item.id = Date.now(); // add id for consistency
    arr.unshift(item);
    localStorage.setItem(key, JSON.stringify(arr));
    return item;
  }
  const { data, error } = await sb.from(table).insert(item).select();
  if (error) throw error;
  return data[0];
}

async function dbDelete(key, id) {
  const table = TABLE[key];
  if (!table) return;
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) throw error;
}

async function dbUpdate(key, id, patch) {
  const table = TABLE[key];
  if (!table) return;
  const { error } = await sb.from(table).update(patch).eq('id', id);
  if (error) throw error;
}
