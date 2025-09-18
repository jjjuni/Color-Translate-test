// src/app/api/colorblind/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";
import chroma from "chroma-js";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "protanopia";
    const alpha = parseFloat(url.searchParams.get("alpha") || "1.0");

    const fileBuffer = Buffer.from(await req.arrayBuffer());

    // 이미지 RAW 데이터 읽기
    const { data, info } = await sharp(fileBuffer)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixels = new Uint8Array(data.length);

    for (let i = 0; i < data.length; i += 3) {
      // RGB 값 가져오기
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // LAB 색 공간 변환
      const lab = chroma([r, g, b]).lab(); // [L, a, b]

      const newLab = [...lab];

      switch (type) {
        case "protanopia":
          newLab[2] += alpha * lab[1]; // a* -> b* 매핑
          break;
        case "deuteranopia":
          newLab[2] += alpha * lab[1]; // a* -> b* 매핑
          break;
        case "tritanopia":
          newLab[1] += alpha * 0.3 * lab[2]; // b* -> a* 매핑
          break;
      }

      // 다시 RGB로 변환
      const [newR, newG, newB] = chroma.lab(newLab[0], newLab[1], newLab[2]).rgb();

      pixels[i] = Math.max(0, Math.min(255, Math.round(newR)));
      pixels[i + 1] = Math.max(0, Math.min(255, Math.round(newG)));
      pixels[i + 2] = Math.max(0, Math.min(255, Math.round(newB)));
    }

    // PNG로 변환
    const outputBuffer = await sharp(Buffer.from(pixels), {
      raw: { width: info.width, height: info.height, channels: 3 },
    })
      .png()
      .toBuffer();

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: { "Content-Type": "image/png" },
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "색각 변환 실패" }, { status: 500 });
  }
}
