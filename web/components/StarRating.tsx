interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
}

export function StarRating({ rating, size = "md" }: StarRatingProps) {
  const stars = Math.round(rating);
  const sizeClass = size === "sm" ? "text-sm" : "text-base";

  return (
    <span className={`${sizeClass}`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < stars ? "text-yellow-400" : "text-gray-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
