type FilterChipsProps = {
  filters: string[];
};

export function FilterChips({ filters }: FilterChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <span
          key={filter}
          className="rounded-full border border-[#1E1E1E]/15 bg-white px-3 py-1 text-xs font-medium text-[#1E1E1E]/80"
        >
          {filter}
        </span>
      ))}
    </div>
  );
}
