'use client';

import { useState, useMemo } from 'react';
import { Offer, Trip, UserProfile } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, Star, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';
import { OfferCard } from '@/components/offer-card'; // Import the unified component
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';

interface SortChipProps {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: React.ElementType;
}

function SortChip({ active, label, onClick, icon: Icon }: SortChipProps) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center gap-1.5",
                active 
                    ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                    : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
        >
            <Icon className="h-4 w-4" />
            {label}
        </button>
    )
}

interface OfferDecisionRoomProps {
  trip: Trip;
  offers: Offer[];
  onAcceptOffer: (trip: Trip, offer: Offer) => void;
  isProcessing: boolean;
  onBack: () => void;
}

export function OfferDecisionRoom({ trip, offers, onAcceptOffer, isProcessing, onBack }: OfferDecisionRoomProps) {
  const [sortMode, setSortMode] = useState<'recommended' | 'price' | 'rating'>('recommended');
  const firestore = useFirestore();

  const carrierIds = useMemo(() => [...new Set(offers.map(o => o.carrierId))], [offers]);
  const carriersQuery = useMemo(() => {
    if (!firestore || carrierIds.length === 0) return null;
    return query(collection(firestore, 'users'), where(documentId(), 'in', carrierIds));
  }, [firestore, carrierIds]);
  const { data: carriers, isLoading: isLoadingCarriers } = useCollection<UserProfile>(carriersQuery);
  const carriersMap = useMemo(() => {
    const map = new Map<string, UserProfile>();
    carriers?.forEach(c => map.set(c.id, c));
    return map;
  }, [carriers]);

  const processedOffers = useMemo(() => {
    if (isLoadingCarriers || carriersMap.size === 0) return [];
    
    const enrichedOffers = offers
      .map(offer => {
        const carrier = carriersMap.get(offer.carrierId);
        return carrier ? {
          ...offer,
          carrierRating: carrier.ratingStats?.average || 0,
          carrierTier: carrier.ratingStats?.tier || 'BRONZE',
        } : null;
      })
      .filter((offer): offer is NonNullable<typeof offer> => offer !== null);

    const minPrice = Math.min(...enrichedOffers.map(o => o.price).filter(p => p > 0));
    
    const sorted = [...enrichedOffers].sort((a, b) => {
      if (sortMode === 'price') return a.price - b.price;
      if (sortMode === 'rating') return b.carrierRating - a.carrierRating;
      
      const scoreA = (a.carrierRating || 0) * 10 - a.price; 
      const scoreB = (b.carrierRating || 0) * 10 - b.price;
      return scoreB - scoreA;
    });

    return sorted.map(offer => ({
      ...offer,
      isBestValue: offer.price === minPrice,
      isTopTier: offer.carrierTier === 'PLATINUM' || offer.carrierTier === 'GOLD'
    }));
  }, [offers, sortMode, carriersMap, isLoadingCarriers]);
  
  if (isLoadingCarriers && offers.length > 0) {
      return (
          <div className="flex justify-center items-center p-4">
               <Skeleton className="h-[450px] w-full max-w-[350px] rounded-xl" />
          </div>
      );
  }

  if (!offers.length && !isLoadingCarriers) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Clock className="h-12 w-12 mb-4 animate-pulse opacity-20" />
        <p>بانتظار وصول العروض...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1 pl-0 text-muted-foreground">
          <ArrowRight className="h-4 w-4" /> رجوع
        </Button>
        <div className="flex gap-2">
            <SortChip active={sortMode === 'price'} label="الأوفر" icon={DollarSign} onClick={() => setSortMode('price')} />
            <SortChip active={sortMode === 'rating'} label="الأفضل" icon={Star} onClick={() => setSortMode('rating')} />
        </div>
      </div>

      <Carousel
        opts={{ align: "start", direction: 'rtl' }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {processedOffers.map((offer) => {
            const carrier = carriersMap.get(offer.carrierId);
            if (!carrier) return null;
            return (
              <CarouselItem key={offer.id} className="pl-4 basis-4/5 md:basis-1/2 lg:basis-1/3">
                  <OfferCard 
                    offer={offer} 
                    carrier={carrier}
                    onAccept={() => onAcceptOffer(trip, offer)}
                    isAccepting={isProcessing}
                  />
              </CarouselItem>
            )
          })}
        </CarouselContent>
        <CarouselPrevious className="right-0 -top-10 left-auto disabled:hidden" />
        <CarouselNext className="left-0 -top-10 right-auto disabled:hidden"/>
      </Carousel>

      {offers.length > 0 && (
        <div className="text-center text-xs text-muted-foreground">
            اسحب للمقارنة بين {offers.length} عروض
        </div>
      )}
    </div>
  );
}