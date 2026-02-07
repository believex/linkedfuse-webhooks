import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { firstName, email } = req.body;

    // Initialize Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // 1. Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { first_name: firstName }
    });

    if (authError) throw authError;

    // 2. Subscribe to Beehiiv
    const beehiivResponse = await fetch('https://api.beehiiv.com/v2/publications/pub_052d8f60-40c6-45de-a319-e994fa5dffff/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.BEEHIIV_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        reactivate_existing: false,
        send_welcome_email: false
      })
    });

    if (!beehiivResponse.ok) throw new Error('Beehiiv subscription failed');

    // 3. Send welcome email with token via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    await resend.emails.send({
      from: 'LinkedFuse <noreply@mail.linkedfuse.com>',
      to: email,
      subject: 'Welcome to LinkedFuse - Your Access Token',
      html: `
        <h2>Welcome ${firstName}!</h2>
        <p>Your LinkedFuse account has been created.</p>
        <p><strong>Your Access Token:</strong> ${authData.user.id}</p>
        <p>Download the software:</p>
        <ul>
          <li><a href="https://linkedfuse.com/thank-you">Windows</a></li>
          <li><a href="https://linkedfuse.com/thank-you">Mac</a></li>
        </ul>
      `
    });

    return res.status(200).json({ success: true, message: 'Signup successful' });

  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ error: error.message });
  }
}