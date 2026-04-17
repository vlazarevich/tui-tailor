import type { BlockDefinition, BlockInstance } from "../lib/types";

interface Props {
  instance: BlockInstance;
  def: BlockDefinition;
  onGearClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export default function BlockTag({ instance, def, onGearClick }: Props) {
  return (
    <span className="inline-flex items-center gap-[1ch] bg-surface-elevated px-[1ch] py-0 leading-normal">
      <button
        onClick={onGearClick}
        className="text-text-muted hover:text-text-secondary cursor-pointer"
        title="Block settings"
      >
        ⚙
      </button>
      <span style={{ color: `var(--tt-color-${def.themeSlot})` }}>{def.name}</span>
      <span className="text-text-muted">{instance.style}</span>
    </span>
  );
}
