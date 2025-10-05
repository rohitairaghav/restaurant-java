import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { defineAbilitiesFor, PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { UserCreateSchema } from '@restaurant-inventory/shared';

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic';

/**
 * POST /api/users - Create a new user
 * Requires manager role
 */
export async function POST(request: Request) {
  try {
    const supabase = createServerClient();

    // 1. Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Check permissions
    const ability = defineAbilitiesFor(userProfile);
    if (!ability.can('create', 'UserProfile')) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.MANAGER_ONLY },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();

    // Ensure email is properly formatted before validation
    if (body.email) {
      body.email = body.email.trim().toLowerCase();
    }

    console.log('Validating user creation with data:', { ...body, password: '[REDACTED]' });

    const validatedData = UserCreateSchema.parse(body);

    // 5. Ensure user is added to the same restaurant
    if (validatedData.restaurant_id !== userProfile.restaurant_id) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.WRONG_RESTAURANT },
        { status: 403 }
      );
    }

    // 6. Check if email already exists
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('email')
      .eq('email', validatedData.email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // 7. Create user in Supabase Auth using sign-up (alternative to admin API)
    // Note: This creates the user but they need to confirm email or we bypass it
    const { data: newAuthUser, error: signUpError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          role: validatedData.role,
          restaurant_id: validatedData.restaurant_id,
        },
        emailRedirectTo: undefined, // Disable email confirmation for now
      },
    });

    if (signUpError) {
      console.error('Supabase signUp error:', signUpError);

      // Provide better error messages
      let errorMessage = signUpError.message;

      if (signUpError.message.includes('already registered')) {
        errorMessage = 'A user with this email already exists';
      } else if (signUpError.message.includes('invalid') || signUpError.message.includes('Invalid')) {
        errorMessage = `Invalid email format. Please use a valid email address like user@example.com`;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    if (!newAuthUser.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // 7. Create or update user profile
    const { data: profile, error: insertError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: newAuthUser.user.id,
          email: validatedData.email,
          role: validatedData.role,
          restaurant_id: validatedData.restaurant_id,
        },
        { onConflict: 'id' }
      )
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: profile }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating user:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users - Get all users in the restaurant
 * Requires manager role
 */
export async function GET(request: Request) {
  try {
    const supabase = createServerClient();

    // 1. Get authenticated user
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // 2. Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 3. Check permissions
    const ability = defineAbilitiesFor(userProfile);
    if (!ability.can('read', 'UserProfile')) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.MANAGER_ONLY },
        { status: 403 }
      );
    }

    // 4. Fetch users from the same restaurant
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('restaurant_id', userProfile.restaurant_id)
      .order('created_at', { ascending: false });

    if (usersError) {
      return NextResponse.json(
        { error: usersError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
