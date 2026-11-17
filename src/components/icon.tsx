const paths = {
  home: "M3 4h18v17H3z M3 9h18 M8 2v4 M16 2v4 M7 13h3 M14 13h3 M7 17h3",
  list: "M6 3h12v18H6z M9 7h6 M9 11h6 M9 15h6 M9 18h3",
  timeline: "M5 3v18 M5 6h14 M5 12h10 M5 18h14 M9 4v4 M9 10v4 M9 16v4",
  info: "M12 10v7 M12 6v1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
  plus: "M12 5v14 M5 12h14",
  arrow: "M5 12h14 M14 7l5 5-5 5",
  download: "M12 3v12 M7 10l5 5 5-5 M4 16v5h16v-5",
  check: "M5 12l4 4L19 6",
  search: "M21 21l-6-6 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  book: "M4 3h16v18H4z M8 3v18 M11 7h6 M11 11h6",
  clock: "M12 6v6l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
};
export function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
