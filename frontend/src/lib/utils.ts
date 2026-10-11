import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper for deterministic gradient generation
export const generateGradient = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Avalanche so names differing by one trailing char still get distinct hues
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  hash ^= hash >>> 16;

  const h1 = Math.abs(hash % 360);
  const h2 = Math.abs((hash >> 8) % 360);
  const h3 = Math.abs((hash >> 16) % 360);

  // Muted, dark "aurora" so thumbnails sit quietly on the near-black theme
  const c1 = `hsl(${h1}, 55%, 42%)`;
  const c2 = `hsl(${h2}, 60%, 35%)`;
  const c3 = `hsl(${h3}, 45%, 28%)`;

  return {
    background: `
      radial-gradient(at top left, ${c1}, transparent 70%),
      radial-gradient(at bottom right, ${c2}, transparent 70%),
      radial-gradient(at center, ${c3}, transparent 50%),
      #0d0d0d
    `,
    backgroundSize: '150% 150%', // To allow for some blurry overlap
  };
};
