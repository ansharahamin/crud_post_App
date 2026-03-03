import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
let supabase_URL = 'https://zbooamzlonhsrdtjgusc.supabase.co'
let Anon_key = 'sb_publishable_8G5VgXvfT5ALE0kIQgJKaA_K9dPBu42'
var supabase = createClient(supabase_URL,Anon_key)

export default supabase