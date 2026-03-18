import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://smoymneoixyntxgsvynt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtb3ltbmVvaXh5bnR4Z3N2eW50Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4Mjg4OTgsImV4cCI6MjA4OTQwNDg5OH0.9A2VHjYRaXVIsyWjVVfY4jUFZjPPWTH8jub_47vCZe8";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);