import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { name, user_cap } = await request.json();

    // Generate a random access code
    const access_code = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the void
    const { data: void_, error } = await supabase
      .from('voids')
      .insert([
        {
          name: name || 'New Void',
          user_cap: user_cap || 50,
          created_by: null, // Set to null since we don't have user authentication yet
          access_code,
          is_private: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating void:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(void_);
  } catch (error) {
    console.error('Error in create void route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 