"use client";

import { useState } from "react";

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [convertedImages, setConvertedImages] = useState<{ [key: string]: string }>({});
  const [file, setFile] = useState<File | null>(null);

  const types = ["protanopia", "deuteranopia", "tritanopia"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0]);
  };

  const handleConvert = async () => {
    if (!file) return;

    setConvertedImages({}); // 초기화

    const results: { [key: string]: string } = {};

    await Promise.all(
      types.map(async (type) => {
        const res = await fetch(`/api/colorblind?type=${type}&alpha=1`, {
          method: "POST",
          body: file,
        });
        const blob = await res.blob();
        results[type] = URL.createObjectURL(blob);
      })
    );

    setConvertedImages(results);
    setImageUrl(URL.createObjectURL(file));
  };

  return (
    <div className="p-8">
      <input type="file" onChange={handleFileChange} />
      <button
        onClick={handleConvert}
        className="ml-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        변환
      </button>

      {imageUrl && (
        <div className="mt-4 flex flex-col gap-4">
          <div className="flex flex-row gap-4">
            <img className="w-[1000px] h-[800px] object-contain" src={imageUrl} alt="원본 이미지" />
          </div>

          <div className="flex flex-row gap-4">
            {types.map((type) => (
              <div key={type} className="flex flex-col items-center">
                <img
                  className="w-[1000px] h-[800px] object-contain"
                  src={convertedImages[type]}
                  alt={`${type} 변환 이미지`}
                />
                <span className="mt-2">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
