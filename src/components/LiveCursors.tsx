import { useOthers } from "../liveblocks.config";

export function LiveCursors() {
  const others = useOthers();

  return (
    <>
      {others.map(({ connectionId, presence }) => {
        if (!presence.cursor) return null;

        return (
          <div
            key={connectionId}
            style={{
              position: "fixed",
              left: presence.cursor.x,
              top: presence.cursor.y,
              pointerEvents: "none",
              zIndex: 600,
              transform: "translate(-2px, -2px)", // align SVG tip to coords
            }}
          >
            {/* Cursor arrow tinted with the player's color */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 2L16 10L9.5 11.5L7 17L4 2Z"
                fill={presence.color}
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>

            {/* Pill-shaped username tag */}
            <div
              style={{
                marginTop: 4,
                marginLeft: 12,
                backgroundColor: presence.color,
                color: "#fff",
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                fontFamily: "sans-serif",
              }}
            >
              {presence.username}
            </div>
          </div>
        );
      })}
    </>
  );
}
