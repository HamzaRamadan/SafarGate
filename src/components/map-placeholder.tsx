import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function MapPlaceholder() {
  const mapImage = PlaceHolderImages.find(
    (img) => img.id === 'map-placeholder'
  );

  return (
    <Card className="h-full min-h-[400px] lg:min-h-0 overflow-hidden shadow-lg">
      <div className="relative h-full w-full">
        {mapImage ? (
          <Image
            src={mapImage.imageUrl}
            alt={mapImage.description}
            fill
            className="object-cover"
            data-ai-hint={mapImage.imageHint}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <p>Map loading...</p>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/20 via-transparent to-transparent" />
      </div>
    </Card>
  );
}
