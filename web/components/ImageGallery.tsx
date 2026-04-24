"use client";

import { useState } from "react";

interface ImageGalleryProps {
  images: { url: string; alt?: string }[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selected, setSelected] = useState(0);

  if (images.length === 0) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
        Sin imágenes
      </div>
    );
  }

  return (
    <div>
      <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-4">
        <img
          src={images[selected].url}
          alt={images[selected].alt || ""}
          className="w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelected(i)}
              className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                selected === i ? "border-blue-500" : "border-transparent"
              }`}
            >
              <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
