import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 260,
          background: "linear-gradient(135deg, #FFE082 0%, #D4AF37 50%, #B38F24 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "black",
          fontFamily: "sans-serif",
          fontWeight: "900",
          borderRadius: "110px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        }}
      >
        L
      </div>
    ),
    {
      ...size,
    }
  );
}
