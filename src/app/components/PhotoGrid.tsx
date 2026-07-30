type Photo = {
  id: string;
  url: string;
};

export default function PhotoGrid({ photos }: { photos: Photo[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="group relative">
          <img
            src={photo.url}
            alt=""
            className="aspect-square w-full rounded object-cover"
          />
          <a
            href={photo.url}
            download
            className="absolute bottom-2 right-2 rounded bg-black/70 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
          >
            Baixar
          </a>
        </div>
      ))}
    </div>
  );
}
