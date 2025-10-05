import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import { defineAbilitiesFor, PERMISSION_ERRORS } from '@restaurant-inventory/shared';
import { UserUpdateSchema } from '@restaurant-inventory/shared';

// Mark route as dynamic to prevent caching
export const dynamic = 'force-dynamic';

/**
 * PATCH /api/users/[id] - Update a user
 * Requires manager role
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    if (!ability.can('update', 'UserProfile')) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.MANAGER_ONLY },
        { status: 403 }
      );
    }

    // 4. Parse and validate request body
    const body = await request.json();
    const validatedData = UserUpdateSchema.parse(body);

    // 5. Get the target user to verify same restaurant
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 6. Verify same restaurant
    if (targetUser.restaurant_id !== userProfile.restaurant_id) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.WRONG_RESTAURANT },
        { status: 403 }
      );
    }

    // 7. Cannot change own role (prevent privilege escalation/removal)
    if (params.id === authUser.id && validatedData.role && validatedData.role !== userProfile.role) {
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 403 }
      );
    }

    // 8. Update user profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 400 }
      );
    }

    // 9. Note: We cannot update auth email from client-side Supabase
    // The user would need to update their email through the auth flow
    // Or we would need server-side admin API access

    return NextResponse.json({ data: updatedProfile }, { status: 200 });
  } catch (error: any) {
    console.error('Error updating user:', error);

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
 * DELETE /api/users/[id] - Delete a user
 * Requires manager role
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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
    if (!ability.can('delete', 'UserProfile')) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.MANAGER_ONLY },
        { status: 403 }
      );
    }

    // 4. Cannot delete yourself
    if (params.id === authUser.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    // 5. Get the target user to verify same restaurant
    const { data: targetUser, error: targetError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', params.id)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // 6. Verify same restaurant
    if (targetUser.restaurant_id !== userProfile.restaurant_id) {
      return NextResponse.json(
        { error: PERMISSION_ERRORS.WRONG_RESTAURANT },
        { status: 403 }
      );
    }

    // 7. Delete user profile (auth user will be handled by cascade or trigger)
    const { error: deleteError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('id', params.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message },
        { status: 400 }
      );
    }

    // Note: We cannot delete the auth user from client-side
    // This would need to be handled by:
    // 1. Database trigger on user_profiles delete
    // 2. Server-side admin API
    // 3. Supabase Edge Function

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
