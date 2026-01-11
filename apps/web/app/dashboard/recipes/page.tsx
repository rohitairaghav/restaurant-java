import { Metadata } from 'next';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import RecipeList from '@/components/recipes/RecipeList';

export const metadata: Metadata = {
  title: 'Recipes - Restaurant Inventory',
  description: 'Manage your restaurant recipes and ingredients',
};

export default function RecipesPage() {
  return (
    <ProtectedRoute>
      <div className="p-4 sm:p-6">
        <RecipeList />
      </div>
    </ProtectedRoute>
  );
}
