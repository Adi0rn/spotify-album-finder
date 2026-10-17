import { notFound } from "next/navigation";
import { validAlbumId } from "@/lib/query";
import { AlbumView } from "@/components/album-view";
export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!validAlbumId(id)) notFound();
  return <AlbumView key={id} id={id} />;
}
