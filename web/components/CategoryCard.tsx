import Link from "next/link";

interface CategoryCardProps {
  category: {
    slug: string;
    name: string;
    icon: string;
    color: string;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/listings?category=${category.slug}`}
      className={`flex flex-col items-center justify-center p-6 rounded-2xl ${category.color} hover:scale-105 transition-transform`}
    >
      <span className="text-3xl mb-2">{category.icon}</span>
      <span className="font-medium text-sm text-center">{category.name}</span>
    </Link>
  );
}
