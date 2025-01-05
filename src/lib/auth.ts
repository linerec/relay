import { supabase } from './supabase';

export const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    if (error.code === 'user_not_found') {
      return { success: true };
    }
    throw error;
  }
};

export const handleRegister = async (email: string, password: string, username: string) => {
  try {
    // 1. Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('User creation failed');

    // 2. Create profile using RPC instead of direct table insert
    const { error: profileError } = await supabase.rpc('create_profile', {
      user_id: authData.user.id,
      user_username: username,
      user_email: email
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Cleanup: Delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw new Error(profileError.message);
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};