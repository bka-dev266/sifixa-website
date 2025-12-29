import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://ybbdnyszdfvlbxlfdtvv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InliYmRueXN6ZGZ2bGJ4bGZkdHZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNjM3MzcsImV4cCI6MjA4MTkzOTczN30.YnwtSdn2LfPt6oEq6TilIGIdJ1qkUfhE-uDkhUI3R08';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
