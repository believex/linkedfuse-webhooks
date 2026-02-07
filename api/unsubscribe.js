import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;
    
    // Beehiiv sends the email in data.email
    const email = data?.email;
    
    if (!email) {
      return res.status(400).json({ error: 'Email not provided' });
    }

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Find user by email and set access_enabled to false
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers();
    
    if (fetchError) throw fetchError;

    const user = users.users.find(u => u.email === email);
    
    if (user) {
      // Update user metadata to disable access
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { user_metadata: { access_enabled: false } }
      );
      
      if (updateError) throw updateError;
    }

    return res.status(200).json({ success: true, message: 'Access revoked' });

  } catch (error) {
    console.error('Unsubscribe webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}