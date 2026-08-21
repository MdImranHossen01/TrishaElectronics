import { CategorySelector } from '@/components/templates/Registry';

export function CategoryShowcase({ style = 'v1', categories }: { style?: string, categories: any[] }) {
  // Only showcase the main categories (no parent category) on the homepage showcase
  const mainCategories = categories.filter(cat => !cat.parentCategory);

  return <CategorySelector style={style} categories={mainCategories} />;
}
