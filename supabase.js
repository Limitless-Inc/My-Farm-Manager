const SUPA_URL = 'https://znchlwpfpgeatlwanrir.supabase.co';
const SUPA_KEY = 'sb_publishable_-sxPcBCfjOIzbsCbb4LoGw_YaiuJFP0';
const sb = supabase.createClient(SUPA_URL, SUPA_KEY);

// Expose supabase client globally for auth pages
window.supabase = sb;

/* Map storage keys to table names */
const TABLE = {
  mf_records:     'records',
  mf_innovations: 'innovations',
  mf_news:        'news',
  mf_products:    'products'
};

/* Authentication functions */
async function signUp(email, password, name) {
  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password
  });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

async function getCurrentUser() {
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

async function onAuthStateChange(callback) {
  return sb.auth.onAuthStateChange(callback);
}

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

  // Add user ownership for authenticated users
  const user = await getCurrentUser();
  if (user) {
    item.user_id = user.id;
    item.author_name = user.user_metadata?.name || user.email;
  }

  const { data, error } = await sb.from(table).insert(item).select();
  if (error) throw error;
  return data[0];
}

async function dbDelete(key, id) {
  const table = TABLE[key];
  if (!table) return;

  const user = await getCurrentUser();
  if (!user) throw new Error('Must be logged in to delete');

  const { error } = await sb.from(table).delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

async function dbUpdate(key, id, patch) {
  const table = TABLE[key];
  if (!table) return;

  const user = await getCurrentUser();
  if (!user) throw new Error('Must be logged in to update');

  const { error } = await sb.from(table).update(patch).eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

async function dbLike(key, id) {
  const table = TABLE[key];
  if (!table) return;

  const user = await getCurrentUser();
  if (!user) throw new Error('Must be logged in to like');

  // Get current likes
  const { data: item } = await sb.from(table).select('likes').eq('id', id).single();
  if (!item) throw new Error('Item not found');

  const currentLikes = item.likes || 0;
  const { error } = await sb.from(table).update({ likes: currentLikes + 1 }).eq('id', id);
  if (error) throw error;
}
