"use client";

import imageCompression from "browser-image-compression";
import { useRef } from "react";

export default function UploadButton() {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
    });

    const signRes = await fetch("/api/sign-upload", { method: "POST" });
    const { signature, timestamp, cloudName, apiKey } = await signRes.json();

    const formData = new FormData();
    formData.append("file", compressed);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );
    const uploaded = await uploadRes.json();

    await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploaded.secure_url }),
    });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="rounded bg-black px-4 py-2 text-white dark:bg-white dark:text-black"
      >
        Enviar Foto
      </button>
    </>
  );
}
