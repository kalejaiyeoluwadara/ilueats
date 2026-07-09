"use client";

/**
 * Animated, pseudo-3D bowl of jollof — replaces the plain profile glyph on the
 * account page. Depth comes from layered radial/linear gradients (bowl sheen,
 * mounded rice, pepper flecks); life comes from a slow bob plus three staggered
 * steam wisps. Honours prefers-reduced-motion via the global animation clamp.
 */
export function FoodAvatar({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        "relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
        "bg-[radial-gradient(120%_120%_at_30%_20%,#fef1e8_0%,#fbdcc8_100%)]",
        "ring-1 ring-inset ring-[var(--color-primary)]/10",
        className,
      )}
    >
      <svg
        viewBox="0 0 48 48"
        className="h-11 w-11 animate-food-bob overflow-visible drop-shadow-[0_4px_6px_rgba(196,62,4,0.25)]"
        aria-hidden
      >
        <defs>
          {/* Ceramic bowl body */}
          <linearGradient id="fa-bowl" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#fbeee6" />
            <stop offset="1" stopColor="#f0cdb6" />
          </linearGradient>
          {/* Rice mound — brand palm-oil gradient */}
          <radialGradient id="fa-rice" cx="0.38" cy="0.25" r="0.9">
            <stop offset="0" stopColor="#ffb072" />
            <stop offset="0.5" stopColor="#f96e22" />
            <stop offset="1" stopColor="#c43e04" />
          </radialGradient>
          {/* Inner shadow where rice meets bowl */}
          <radialGradient id="fa-inner" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0.6" stopColor="#00000000" />
            <stop offset="1" stopColor="#8a2c02" stopOpacity="0.35" />
          </radialGradient>
        </defs>

        {/* Steam wisps (behind the bowl top) */}
        <g fill="none" stroke="#ffffff" strokeWidth="2.1" strokeLinecap="round">
          <path
            className="animate-steam"
            style={{ animationDelay: "0s" }}
            d="M18 15 q-2.4 -3 0 -6 q2.4 -3 0 -6"
          />
          <path
            className="animate-steam"
            style={{ animationDelay: "0.9s" }}
            d="M24 14 q-2.4 -3 0 -6 q2.4 -3 0 -6"
          />
          <path
            className="animate-steam"
            style={{ animationDelay: "1.7s" }}
            d="M30 15 q-2.4 -3 0 -6 q2.4 -3 0 -6"
          />
        </g>

        {/* Bowl body */}
        <path
          d="M6 26 C 7 42, 41 42, 42 26 A 18 5.2 0 0 1 6 26 Z"
          fill="url(#fa-bowl)"
        />
        {/* Rim highlight */}
        <ellipse
          cx="24"
          cy="26"
          rx="18"
          ry="5.2"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.4"
          opacity="0.7"
        />

        {/* Rice mound */}
        <path
          d="M8.5 26 Q 24 12.5 39.5 26 Q 24 33 8.5 26 Z"
          fill="url(#fa-rice)"
        />
        <path
          d="M8.5 26 Q 24 12.5 39.5 26 Q 24 33 8.5 26 Z"
          fill="url(#fa-inner)"
        />

        {/* Pepper flecks + a stray grain for texture */}
        <g>
          <circle cx="19" cy="22" r="1.1" fill="#7a1f02" />
          <circle cx="28" cy="20.5" r="1" fill="#efa00b" />
          <circle cx="31" cy="24" r="1.1" fill="#7a1f02" />
          <circle cx="22" cy="25" r="0.9" fill="#ffd9b0" />
          <circle cx="25" cy="23" r="0.85" fill="#ffe9d3" />
        </g>

        {/* Front sheen on the bowl */}
        <path
          d="M11 30 Q 24 34 37 30"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}

/** Local class joiner — keeps the component dependency-free. */
function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
