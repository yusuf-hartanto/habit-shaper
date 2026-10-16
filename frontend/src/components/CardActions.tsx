import { Pencil, Trash2 } from 'lucide-react';

interface CardActionsProps {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}

/** Edit/Delete icon buttons; always visible on touch, subtle until hover on desktop. */
export function CardActions({ label, onEdit, onDelete }: CardActionsProps) {
  return (
    <div className="-mr-2 -mt-2 flex shrink-0 items-center opacity-100 transition-opacity lg:opacity-60 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100">
      <button type="button" className="icon-btn" onClick={onEdit} aria-label={`Edit ${label}`} title="Edit">
        <Pencil className="size-4" />
      </button>
      <button
        type="button"
        className="icon-btn hover:bg-rose-50 hover:text-rose-600"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        title="Delete"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
