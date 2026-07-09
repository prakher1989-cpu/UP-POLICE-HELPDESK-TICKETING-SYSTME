import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const supabaseUrl = 'https://iokmquslburktttwmmnf.supabase.co';
const supabaseKey = 'sb_publishable__aw3f4SJQ2u0CLmoi3oTRQ_VgJpzqCn';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- ROUTES ---

// 1. Root route
app.get('/', (req, res) => {
  res.json({ message: 'Supabase API is running.' });
});

// 1.5 Get Users
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, role');
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 2. Login User
app.post('/api/users/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    return res.status(400).json({ error: 'User ID and password are required' });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Invalid User ID or Password' });
    }

    if (data.password === password) {
      res.json({ name: data.name, role: data.role });
    } else {
      res.status(401).json({ error: 'Invalid User ID or Password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// 3. Change Password
app.patch('/api/users/password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  
  try {
    // Verify old password
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== oldPassword) {
      return res.status(401).json({ error: 'Incorrect old password' });
    }

    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ password: newPassword })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update password' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Get Tickets
app.get('/api/tickets', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch tickets' });
    }
    
    // Format response to match frontend expectations
    const tickets = data.map(t => ({
      ...t,
      assignedTo: t.assigned_to,
      resolvedBy: t.resolved_by,
      timestamp: t.created_at,
      ipAddress: t.ip_address,
      district: t.district,
      policeStation: t.police_station,
      designation: t.designation,
      attachmentUrl: t.attachment_url
    }));

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Create Ticket
app.post('/api/tickets', async (req, res) => {
  const ticketData = req.body;
  
  // Create a unique ticket ID (TKT-12345)
  const ticketId = `TKT-${Math.floor(Math.random() * 90000) + 10000}`;
  
  const newTicket = {
    id: ticketId,
    title: ticketData.title,
    description: ticketData.description,
    category: ticketData.category,
    priority: ticketData.priority,
    status: 'Open',
    assigned_to: null,
    resolved_by: null,
    name: ticketData.name || '',
    mobile: ticketData.mobile || '',
    ip_address: ticketData.ipAddress || '',
    district: ticketData.district || 'Unspecified',
    police_station: ticketData.policeStation || 'N/A',
    designation: ticketData.designation || 'Unspecified',
    attachment_url: ticketData.attachmentUrl || null
  };

  try {
    const { data, error } = await supabase
      .from('tickets')
      .insert([newTicket])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: 'Failed to create ticket' });
    }

    const formattedData = {
      ...data,
      assignedTo: data.assigned_to,
      resolvedBy: data.resolved_by,
      timestamp: data.created_at
    };

    // Log creation history
    const historyEntry = {
      ticket_id: ticketId,
      action: 'Ticket Created',
      updated_by: ticketData.name || 'Unknown User'
    };
    await supabase.from('ticket_history').insert([historyEntry]);

    res.status(201).json(formattedData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Update Ticket Status / Assignee
app.patch('/api/tickets/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updatedBy = updates.updatedBy || 'System';
  
  const dbUpdates = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
  if (updates.resolvedBy !== undefined) dbUpdates.resolved_by = updates.resolvedBy;
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority;

  try {
    const { data, error } = await supabase
      .from('tickets')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update ticket' });
    }

    // Determine what action was taken for the log
    let actionStr = 'Ticket Updated';
    if (updates.status !== undefined) actionStr = `Status changed to ${updates.status}`;
    else if (updates.assignedTo !== undefined) actionStr = `Assigned to ${updates.assignedTo}`;
    else if (updates.resolvedBy !== undefined) actionStr = `Resolved by ${updates.resolvedBy}`;
    
    const historyEntry = {
      ticket_id: id,
      action: actionStr,
      updated_by: updatedBy
    };
    await supabase.from('ticket_history').insert([historyEntry]);

    const formattedData = {
      ...data,
      assignedTo: data.assigned_to,
      resolvedBy: data.resolved_by,
      timestamp: data.created_at
    };

    res.json(formattedData);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Get Ticket History
app.get('/api/tickets/:id/history', async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from('ticket_history')
      .select('*')
      .eq('ticket_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch history' });
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 8. Get Dashboard Stats (Advanced Analytics via SQL)
app.get('/api/stats', async (req, res) => {
  const { userRole, userName } = req.query;
  
  try {
    const { data, error } = await supabase
      .rpc('get_dashboard_stats', { 
        p_role: userRole || 'admin', 
        p_username: userName || '' 
      });

    if (error) {
      console.error('Stats Error:', error);
      return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
    
    // The RPC function returns a single JSON object with all stats
    res.json(data || {});
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

app.listen(port, () => {
  console.log(`Backend Server connected to Supabase and running on port ${port}`);
});
