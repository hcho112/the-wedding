"use client";

type NameTagProps = {
  name: string;
  role: string;
};

export default function NameTag({ name, role }: NameTagProps) {
  return (
    <div
      className="
        px-4 py-2
        bg-black/85 backdrop-blur-md
        rounded-lg
        text-center
        whitespace-nowrap
        shadow-xl
        border border-white/10
      "
    >
      <p className="text-white text-sm sm:text-base font-medium tracking-wide">
        {name}
      </p>
      <p className="text-white/60 text-xs sm:text-sm font-light tracking-wider">
        {role}
      </p>
    </div>
  );
}
