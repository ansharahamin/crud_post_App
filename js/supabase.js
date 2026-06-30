import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'
let supabase_URL = 'https://phgbkzvxbefidcrtagbt.supabase.co'
let Anon_key = 'sb_publishable_xbv5T3RlyRtRymBO3pY69A_lTr1vU0s'
var supabase = createClient(supabase_URL,Anon_key)

export default supabase