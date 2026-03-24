type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: SectionHeaderProps) {
  return (
    <div className="space-y-3.5">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#D97A2B]">{eyebrow}</p>
      ) : null}
      <h2 className="text-[1.85rem] font-semibold tracking-tight text-[#1E1E1E] leading-[1.15] md:text-[2.15rem]">{title}</h2>
      {description ? <p className="max-w-2xl text-base leading-7 text-[#1E1E1E]/75">{description}</p> : null}
    </div>
  );
}
