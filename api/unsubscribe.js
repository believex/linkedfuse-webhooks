import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log the full payload to see Beehiiv's structure
    console.log('Webhook payload:', JSON.stringify(req.body));
    
    // Try multiple possible email locations in the payload
    const email = req.body?.data?.email 
      || req.body?.email 
      || req.body?.data?.subscriber?.email;
    
    if (!email) {
      console.log('No email found in payload');
      return res.status(400).json({ error: 'Email not provided' });
    }

    console.log('Processing unsubscribe for:', email);

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Use filter instead of listing all users
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers({
      filter: { email: email }
    });
    
    if (fetchError) throw fetchError;

    if (users && users.length > 0) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        users[0].id,
        { user_metadata: { access_enabled: false } }
      );
      
      if (updateError) throw updateError;
      console.log('Access revoked for:', email);
    } else {
      console.log('No user found for:', email);
    }

    return res.status(200).json({ success: true, message: 'Access revoked' });

  } catch (error) {
    console.error('Unsubscribe webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}