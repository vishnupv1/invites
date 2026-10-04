import "./favorite-heart.css";

export function FavoriteHeart({
  liked,
  name,
  onClick,
  className = "",
}: {
  liked: boolean;
  name: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={`fav-heart${liked ? " on" : ""}${className ? ` ${className}` : ""}`}
      aria-pressed={liked}
      aria-label={liked ? `Remove ${name} from favorites` : `Save ${name}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <span aria-hidden="true">♥</span>
    </button>
  );
}
