'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, where, orderBy, doc, documentId, limit, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Search, ShipWheel, Filter, Car, Bus, LayoutGrid, Calendar as CalendarIcon, Send, ChevronsUpDown, Check, PlaneTakeoff, PlaneLanding } from 'lucide-react';
import { ScheduledTripCard } from '@/components/scheduled-trip-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import { BookingDialog } from '@/components/booking-dialog';
import { RequestDialog } from '@/components/requests/request-dialog';
import { AuthRedirectDialog } from '@/components/auth-redirect-dialog';
import { CITIES, getCityName } from '@/lib/constants';
import type { Trip, UserProfile, Booking, PassengerDetails, CarrierTier } from '@/lib/data';
import { addDocumentNonBlocking } from '@/firebase';
import { serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from "@/components/ui/toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarPicker } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/app-layout';

// [SC-078] Tier Weight Helper for Sorting
const getTierWeight = (tier?: string) => {
    switch (tier) {
        case 'PLATINUM': return 4;
        case 'GOLD': return 3;
        case 'SILVER': return 2;
        default: return 1;
    }
};

type TripDisplayResult = {
  filtered: Trip[];
  showNoResultsMessage: boolean;
};

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  // [SC-169] Smart Resume Protocol: Active State Detection
  const activeBookingsQuery = useMemo(() => {
    if (!firestore || !user?.uid) return null;
    return query(
        collection(firestore, 'bookings'),
        where('userId', '==', user.uid),
        where('status', 'in', ['Pending-Payment', 'Pending-Carrier-Confirmation', 'Confirmed'])
    );
  }, [firestore, user]);

  const activeRequestsQuery = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return query(
          collection(firestore, 'trips'), 
          where('userId', '==', user.uid),
          where('status', '==', 'Awaiting-Offers')
      );
  }, [firestore, user]);

  const { data: activeBookings, isLoading: isLoadingBookings } = useCollection(activeBookingsQuery);
  const { data: activeRequests, isLoading: isLoadingActiveRequests } = useCollection(activeRequestsQuery);

  // [SC-169] The Redirect Execution
  useEffect(() => {
    const isCheckingState = isLoadingBookings || isLoadingActiveRequests;
    if (isCheckingState) return;

    const hasActiveProcess = (activeBookings && activeBookings.length > 0) || (activeRequests && activeRequests.length > 0);

    if (hasActiveProcess) {
        router.replace('/history');
    }
  }, [activeBookings, activeRequests, isLoadingBookings, isLoadingActiveRequests, router]);


  // Search State
  const [searchOriginCountry, setSearchOriginCountry] = useState('');
  const [searchOriginCity, setSearchOriginCity] = useState('');
  const [searchDestinationCountry, setSearchDestinationCountry] = useState('');
  const [searchDestinationCity, setSearchDestinationCity] = useState('');
  const [searchDate, setSearchDate] = useState<Date>();
  const [searchSeats, setSearchSeats] = useState(1);
  const [searchVehicleType, setSearchVehicleType] = useState<'any' | 'small' | 'bus'>('any');
  const [searchMode, setSearchMode] = useState<'all-carriers' | 'specific-carrier'>('all-carriers');
  const [selectedCarrier, setSelectedCarrier] = useState<UserProfile | null>(null);

  // [SC-162] Rescue Modes: 'none' (Strict) | 'time' (+3 Days) | 'location' (Country-wide)
  const [rescueMode, setRescueMode] = useState<'none' | 'time' | 'location'>('none');


  // [SC-014] State for Comboboxes
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDest, setOpenDest] = useState(false);
  // [SC-015] Logic Injection: Carrier Popover State
  const [openCarrier, setOpenCarrier] = useState(false);


  // Dialogs State
  const [selectedTripForBooking, setSelectedTripForBooking] = useState<Trip | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAuthRedirectOpen, setIsAuthRedirectOpen] = useState(false);
  const [isCheckingActiveBooking, setIsCheckingActiveBooking] = useState(false);

  // [SC-223] Performance Fix: Limit initial trip query (PROTOCOL 88 COMPLIANT)
  const tripsQuery = useMemo(() => {
    if (!firestore) return null;

    let dynamicConstraints: any[] = [
        where('status', '==', 'Planned'),
    ];

    // [SC-162] Logic: Apply constraints based on Rescue Mode
    if (rescueMode === 'time' && searchDate) {
        const startOfDay = new Date(searchDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfRange = new Date(searchDate);
        endOfRange.setDate(endOfRange.getDate() + 3);
        endOfRange.setHours(23, 59, 59, 999);

        dynamicConstraints.push(where('departureDate', '>=', startOfDay.toISOString()));
        dynamicConstraints.push(where('departureDate', '<=', endOfRange.toISOString()));
        if (searchDestinationCity) dynamicConstraints.push(where('destination', '==', searchDestinationCity));

    } else if (rescueMode === 'location' && searchDestinationCity) {
        const targetCountryKey = Object.keys(CITIES).find(key => 
            (CITIES as any)[key].cities.includes(searchDestinationCity)
        );

        if (targetCountryKey) {
            const citiesInCountry = (CITIES as any)[targetCountryKey].cities;
            const safeCitiesList = citiesInCountry.slice(0, 10);
            
            dynamicConstraints.push(where('destination', 'in', safeCitiesList));
            
            if (searchDate) {
                 const start = new Date(searchDate); start.setHours(0,0,0,0);
                 const end = new Date(searchDate); end.setHours(23,59,59,999);
                 dynamicConstraints.push(where('departureDate', '>=', start.toISOString()));
                 dynamicConstraints.push(where('departureDate', '<=', end.toISOString()));
            }
        }
    } else {
        // Strict Mode (Default)
        if (searchDate) {
            const start = new Date(searchDate); start.setHours(0,0,0,0);
            const end = new Date(searchDate); end.setHours(23,59,59,999);
            dynamicConstraints.push(where('departureDate', '>=', start.toISOString()));
            dynamicConstraints.push(where('departureDate', '<=', end.toISOString()));
        } else {
            dynamicConstraints.push(where('departureDate', '>=', new Date().toISOString()));
        }
        
        if (searchDestinationCity) dynamicConstraints.push(where('destination', '==', searchDestinationCity));
        if (searchVehicleType !== 'any') dynamicConstraints.push(where('vehicleCategory', '==', searchVehicleType));
    }
    
    if (searchOriginCity) dynamicConstraints.push(where('origin', '==', searchOriginCity));
    if (searchSeats > 1) dynamicConstraints.push(where('availableSeats', '>=', searchSeats));

     if (searchMode === 'specific-carrier' && selectedCarrier) {
      dynamicConstraints.push(where('carrierId', '==', selectedCarrier.id));
    }


    return query(collection(firestore, 'trips'), ...dynamicConstraints, limit(5));
  }, [firestore, searchOriginCity, searchDestinationCity, searchDate, searchVehicleType, searchMode, selectedCarrier, searchSeats, rescueMode]);


  const { data: allTrips, isLoading: isLoadingTrips } = useCollection<Trip>(tripsQuery);
   
  // [SC-226 CLEANUP] Optimized Carrier Fetching: Only fetch if user searches specific carrier
  const carriersQuery = useMemo(() => {
      if (!firestore || searchMode !== 'specific-carrier') return null;
      return query(collection(firestore, 'users'), where('role', '==', 'carrier'));
  }, [firestore, searchMode]);

  const { data: allCarriersData, isLoading: isLoadingCarriers } = useCollection<UserProfile>(carriersQuery);
  const allCarriers = useMemo(() => allCarriersData?.filter(carrier => !carrier.isDeactivated) || [], [allCarriersData]);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
      setRescueMode('none');
  }, [searchOriginCity, searchDestinationCity, searchDate, searchVehicleType]);

  useEffect(() => {
    setSearchOriginCity('');
    setSearchDestinationCountry('');
    setSearchDestinationCity('');
  }, [searchOriginCountry]);

  useEffect(() => {
    setSearchDestinationCity('');
  }, [searchDestinationCountry]);

  const availableDestinations = useMemo(() => {
    if (!searchOriginCountry || !allTrips) return [];
    const reachableCountries = new Set<string>();
    const validDestinations = allTrips
        .filter(trip => CITIES[searchOriginCountry as keyof typeof CITIES]?.cities.includes(trip.origin)) 
        .map(trip => trip.destination);
    validDestinations.forEach(city => {
        const countryKey = Object.keys(CITIES).find(key => (CITIES as any)[key].cities.includes(city));
        if (countryKey && countryKey !== searchOriginCountry) {
            reachableCountries.add(countryKey);
        }
    });
    return Array.from(reachableCountries);
  }, [searchOriginCountry, allTrips]);


    const tripDisplayResult = useMemo((): TripDisplayResult => {
        const isSearching = !!(searchOriginCity || searchDestinationCity || searchDate || (searchMode === 'specific-carrier' && selectedCarrier));
        return { 
            filtered: allTrips || [], 
            showNoResultsMessage: isSearching && (!allTrips || allTrips.length === 0)
        };
    }, [allTrips, searchOriginCity, searchDestinationCity, searchDate, searchMode, selectedCarrier]);

  const visibleCarrierIds = useMemo(() => {
      if (!tripDisplayResult?.filtered) return [];
      const ids = tripDisplayResult.filtered.map(t => t.carrierId).filter(Boolean) as string[];
      return [...new Set(ids)].slice(0, 10);
  }, [tripDisplayResult]);
  
  const tierQuery = useMemo(() => {
      if (!firestore || visibleCarrierIds.length === 0) return null;
      return query(collection(firestore, 'users'), where(documentId(), 'in', visibleCarrierIds));
  }, [firestore, visibleCarrierIds]);
  
  const { data: visibleCarriersData } = useCollection<UserProfile>(tierQuery);
  
  const carrierTierMap = useMemo(() => {
      const map = new Map<string, CarrierTier>();
      visibleCarriersData?.forEach((c) => {
          if (c.id && c.ratingStats?.tier) map.set(c.id, c.ratingStats.tier);
      });
      return map;
  }, [visibleCarriersData]);
  
  const sortedTrips = useMemo(() => {
      if (!tripDisplayResult?.filtered) return [];
      return [...tripDisplayResult.filtered].sort((a, b) => {
          const tierA = carrierTierMap.get(a.carrierId || '') || 'BRONZE';
          const tierB = carrierTierMap.get(b.carrierId || '') || 'BRONZE';
          const weightDiff = getTierWeight(tierB) - getTierWeight(tierA);
          if (weightDiff !== 0) return weightDiff;
          return new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime();
      });
  }, [tripDisplayResult.filtered, carrierTierMap]);

  const handleBookNowClick = async (trip: Trip) => {
      if (!user) { setIsAuthRedirectOpen(true); return; }
      if (!firestore) return;

      setIsCheckingActiveBooking(true);
      try {
        const activeBookingsQuery = query(
            collection(firestore, 'bookings'),
            where('userId', '==', user.uid),
            where('status', 'in', ['Pending-Carrier-Confirmation', 'Pending-Payment', 'Confirmed'])
        );
        const snapshot = await getDocs(activeBookingsQuery);

        if (!snapshot.empty) {
            toast({
                variant: "destructive",
                title: "عذراً، لديك رحلة سارية",
                description: "سياسة المنصة لا تسمح بتعدد الحجوزات النشطة. يرجى إتمام رحلتك الحالية أو إلغاؤها أولاً.",
                duration: 5000,
            });
            return;
        }

        setSelectedTripForBooking(trip);
        setIsBookingOpen(true);

      } catch (error) {
          console.error("Error checking active bookings:", error);
          toast({ variant: "destructive", title: "خطأ", description: "حدث خطأ أثناء التحقق من بياناتك." });
      } finally {
          setIsCheckingActiveBooking(false);
      }
  };
   
  const handleConfirmBooking = async (passengers: PassengerDetails[]): Promise<void> => {
    if (!firestore || !user || !selectedTripForBooking) throw new Error("Missing required data.");
    
    const trip = selectedTripForBooking;
    if ((trip.availableSeats || 0) < searchSeats) throw new Error("Not enough available seats.");

    try {
        const bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'consentTimestamp'> = {
            tripId: trip.id,
            userId: user.uid,
            carrierId: trip.carrierId!,
            seats: searchSeats,
            passengersDetails: passengers,
            status: 'Pending-Carrier-Confirmation',
            totalPrice: (trip.price || 0) * searchSeats,
            currency: trip.currency as Booking['currency'],
        };
        await addDocumentNonBlocking(collection(firestore, 'bookings'), { ...bookingData, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        
        setIsBookingOpen(false);
        toast({ title: "تم إرسال طلب الحجز بنجاح!", description: "جاري نقلك إلى صفحة حجوزاتك للمتابعة." });
        router.push('/history'); 

    } catch (error) {
        console.error("Booking failed:", error);
        toast({ variant: "destructive", title: "فشل إرسال طلب الحجز" });
        throw error;
    }
  };

  const handleRequestAction = () => {
    if (!user) { 
      setIsAuthRedirectOpen(true); 
      return; 
    }
    
    const missingFields = [];
    if (!searchOriginCity) missingFields.push("مدينة الانطلاق");
    if (!searchDestinationCity) missingFields.push("مدينة الوصول");
    if (!searchDate) missingFields.push("تاريخ السفر");

    if (missingFields.length > 0) {
        toast({ 
            variant: "destructive", 
            title: "بيانات الطلب غير مكتملة", 
            description: `لا يمكن تحويل البحث إلى طلب رسمي بدون تحديد: ${missingFields.join('، ')}.` 
        });
        return;
    }

    setIsRequestOpen(true);
  };

  const handleRequestSent = () => {
    toast({ 
        title: "تم نشر طلبك في سوق الفرص!", 
        description: "يرجى متابعة حالة الطلب في صفحة 'حجوزاتي'. إذا لم تتلقَ عروضاً خلال ساعة، سنقترح عليك حلولاً بديلة.",
        duration: 6000,
        action: <ToastAction altText="الذهاب لطلباتي" onClick={() => router.push('/history')}>متابعة الطلب</ToastAction>
    });
    router.push('/history');
  };
  
  const isLoadingScreen = isUserLoading || isLoadingBookings || isLoadingActiveRequests;
  if (isLoadingScreen) {
      return (
          <AppLayout>
              <div className="flex h-[70vh] items-center justify-center">
                  <p className="animate-pulse font-semibold text-muted-foreground">جاري تأمين المسار...</p>
              </div>
          </AppLayout>
      );
  }

  const isLoading = isLoadingTrips || isLoadingCarriers || isCheckingActiveBooking;

  return (
    <AppLayout>
      <div className="space-y-4">
        <Accordion type="single" collapsible className="w-full bg-card rounded-lg border shadow-sm" defaultValue={!tripDisplayResult.filtered ? 'search-filter' : undefined}>
          <AccordionItem value="search-filter" className="border-none">
            <AccordionTrigger className="p-4 hover:no-underline font-semibold text-sm">
              <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-primary"/><span>فلترة البحث وتحديد الوجهة</span></div>
              {(searchOriginCity || searchDestinationCity) && (<Badge variant="secondary" className="mr-auto text-[10px] font-normal">{getCityName(searchOriginCity) || 'الكل'} <span className="mx-1">→</span> {getCityName(searchDestinationCity) || 'الكل'}</Badge>)}
            </AccordionTrigger>
            <AccordionContent className="p-4 pt-0 border-t">
                <div className="grid grid-cols-1 gap-4 pt-4">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg"><Button variant={searchMode === 'all-carriers' ? 'default' : 'ghost'} size="sm" onClick={() => setSearchMode('all-carriers')} className="text-xs rounded-md shadow-none">كل الناقلين</Button><Button variant={searchMode === 'specific-carrier' ? 'default' : 'ghost'} size="sm" onClick={() => setSearchMode('specific-carrier')} className="text-xs rounded-md shadow-none">ناقل محدد</Button></div>
                  
                  {searchMode === 'specific-carrier' && (
                    <Popover open={openCarrier} onOpenChange={setOpenCarrier}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCarrier}
                          className="w-full justify-between h-12 bg-card/50 border-muted"
                        >
                          {selectedCarrier
                            ? `${selectedCarrier.firstName} ${selectedCarrier.lastName}`
                            : "ابحث عن ناقل..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="اكتب اسم الناقل..." />
                          <CommandEmpty>لم يتم العثور على ناقل.</CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {isLoadingCarriers ? (
                                <div className="p-2 text-sm text-muted-foreground text-center">جاري التحميل...</div>
                              ) : (
                                allCarriers?.map((carrier) => (
                                  <CommandItem
                                    key={carrier.id}
                                    value={`${carrier.firstName} ${carrier.lastName}`}
                                    onSelect={() => {
                                      setSelectedCarrier(carrier);
                                      setOpenCarrier(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedCarrier?.id === carrier.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {carrier.firstName} {carrier.lastName}
                                  </CommandItem>
                                ))
                              )}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <PlaneTakeoff className="h-4 w-4 text-primary" /> من دولة
                        </Label>
                        <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openOrigin}
                              className="w-full justify-between h-12 bg-card/50 border-muted"
                            >
                              {searchOriginCountry
                                ? CITIES[searchOriginCountry as keyof typeof CITIES].name
                                : "اختر دولة الانطلاق..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ابحث عن الدولة..." />
                              <CommandEmpty>لا توجد دولة بهذا الاسم.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                    {Object.entries(CITIES).map(([key, { name }]) => (
                                    <CommandItem
                                        key={key}
                                        value={name}
                                        onSelect={() => {
                                        setSearchOriginCountry(key);
                                        setSearchOriginCity(""); 
                                        setOpenOrigin(false);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            searchOriginCountry === key ? "opacity-100" : "opacity-0"
                                        )}
                                        />
                                        {name}
                                    </CommandItem>
                                    ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <span className="opacity-0">.</span>
                          </Label>
                        <Select onValueChange={setSearchOriginCity} value={searchOriginCity} disabled={!searchOriginCountry}><SelectTrigger className="h-12 bg-card/50 border-muted"><SelectValue placeholder="من (مدينة)" /></SelectTrigger><SelectContent>{searchOriginCountry && (CITIES as any)[searchOriginCountry]?.cities.map((c: string) => (<SelectItem key={c} value={c}>{getCityName(c)}</SelectItem>))}</SelectContent></Select>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground flex items-center gap-2">
                          <PlaneLanding className="h-4 w-4 text-primary" /> إلى دولة
                        </Label>
                        <Popover open={openDest} onOpenChange={setOpenDest}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openDest}
                              disabled={!searchOriginCountry || availableDestinations.length === 0}
                              className="w-full justify-between h-12 bg-card/50 border-muted disabled:opacity-50"
                            >
                              {searchDestinationCountry
                                ? CITIES[searchDestinationCountry as keyof typeof CITIES]?.name
                                : (!searchOriginCountry ? "حدد الانطلاق أولاً" : "اختر دولة الوصول...")}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="ابحث عن الدولة..." />
                              <CommandEmpty>لا توجد وجهات متاحة من دولتك.</CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                    {availableDestinations.map((key) => (
                                    <CommandItem
                                        key={key}
                                        value={CITIES[key as keyof typeof CITIES].name}
                                        onSelect={() => {
                                        setSearchDestinationCountry(key);
                                        setSearchDestinationCity("");
                                        setOpenDest(false);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            searchDestinationCountry === key ? "opacity-100" : "opacity-0"
                                        )}
                                        />
                                        {CITIES[key as keyof typeof CITIES].name}
                                    </CommandItem>
                                    ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <span className="opacity-0">.</span>
                          </Label>
                        <Select onValueChange={setSearchDestinationCity} value={searchDestinationCity} disabled={!searchDestinationCountry}><SelectTrigger className="h-12 bg-card/50 border-muted"><SelectValue placeholder="إلى (مدينة)" /></SelectTrigger><SelectContent>{searchDestinationCountry && (CITIES as any)[searchDestinationCountry]?.cities.map((c: string) => (<SelectItem key={c} value={c}>{getCityName(c)}</SelectItem>))}</SelectContent></Select>
                      </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal",!searchDate&&"text-muted-foreground")}><CalendarIcon className="ml-2 h-4 w-4"/>{searchDate?format(searchDate,"PPP", {locale: arSA}):"تاريخ السفر"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CalendarPicker mode="single" selected={searchDate} onSelect={setSearchDate}/></PopoverContent></Popover><Select onValueChange={(v) => setSearchSeats(parseInt(v))} value={String(searchSeats)}><SelectTrigger><SelectValue placeholder="عدد المقاعد" /></SelectTrigger><SelectContent>{Array.from({length:9},(_,i)=>i+1).map(n=><SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2"><label className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Car className="h-3 w-3" /> نوع المركبة</label><div className="grid grid-cols-3 gap-2 p-1 bg-muted/50 rounded-lg border"><Button variant={searchVehicleType === 'any' ? 'default' : 'ghost'} size="sm" onClick={() => setSearchVehicleType('any')} className="text-xs h-8 shadow-none"><LayoutGrid className="w-3 h-3 ml-1" /> الكل</Button><Button variant={searchVehicleType === 'small' ? 'default' : 'ghost'} size="sm" onClick={() => setSearchVehicleType('small')} className="text-xs h-8 shadow-none"><Car className="w-3 h-3 ml-1" /> سيارة</Button><Button variant={searchVehicleType === 'bus' ? 'default' : 'ghost'} size="sm" onClick={() => setSearchVehicleType('bus')} className="text-xs h-8 shadow-none"><Bus className="w-3 h-3 ml-1" /> حافلة</Button></div></div>
                </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="space-y-6">
          {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-48 w-full rounded-lg" />)}
              </div>
          ) : tripDisplayResult.showNoResultsMessage || (sortedTrips.length === 0 && rescueMode !== 'none') ? (
              <div className="flex flex-col items-center justify-center text-center py-10 px-4 border-2 border-dashed rounded-lg bg-secondary/5 text-muted-foreground animate-in zoom-in-95 duration-300">
                <div className="bg-background p-3 rounded-full mb-3 shadow-sm">
                    {rescueMode === 'none' ? <ShipWheel className="h-6 w-6 text-primary/60" /> : <Search className="h-6 w-6 text-orange-500" />}
                </div>
                
                <h3 className="text-lg font-bold text-foreground mb-1">
                    {rescueMode === 'none' ? 'لا توجد رحلات مطابقة تماماً' : 'لا توجد نتائج حتى مع البحث الموسع'}
                </h3>
                
                <p className="text-xs max-w-xs mx-auto mb-6 text-muted-foreground">
                    {rescueMode === 'none' 
                        ? 'لم نجد رحلة تطابق شروطك 100%. يمكنك البحث بمرونة أكبر أو إنشاء طلب خاص.'
                        : 'يبدو أن الضغط عالٍ. الخيار الأفضل الآن هو إنشاء طلب رسمي ليصل للناقلين.'}
                </p>
                
                <div className="flex flex-col w-full max-w-sm gap-3">
                    {rescueMode === 'none' && (
                        <>
                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2 h-10 border-blue-200 hover:bg-blue-50 text-blue-700 transition-all"
                                onClick={() => setRescueMode('location')}
                            >
                                <LayoutGrid className="h-4 w-4" />
                                <span>بحث شامل في كل {searchDestinationCity ? 'الدولة' : 'المنطقة'} (نفس اليوم)</span>
                            </Button>

                            <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2 h-10 border-orange-200 hover:bg-orange-50 text-orange-700 transition-all"
                                onClick={() => setRescueMode('time')}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                <span>بحث في الأيام الـ 3 القادمة (نفس المدينة)</span>
                            </Button>
                        </>
                    )}

                    <Button 
                        className={cn("w-full justify-start gap-2 h-10 shadow-sm", rescueMode !== 'none' ? "bg-primary" : "mt-2 bg-slate-900 text-white hover:bg-slate-800")}
                        onClick={handleRequestAction}
                    >
                        <Send className="h-4 w-4" />
                        <span>{rescueMode === 'none' ? 'إنشاء طلب خاص (الحل الجذري)' : 'إرسال طلب للمواصفات الأصلية'}</span>
                    </Button>
                    
                    {rescueMode !== 'none' && (
                        <Button variant="ghost" size="sm" onClick={() => setRescueMode('none')} className="text-xs text-muted-foreground">
                            العودة للبحث الدقيق
                        </Button>
                    )}
                </div>
              </div>
          ) : sortedTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed rounded-lg bg-secondary/10 text-muted-foreground animate-in zoom-in-95 duration-500">
                  <div className="bg-background p-4 rounded-full mb-4 shadow-sm">
                        <PlaneTakeoff className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2">السوق بانتظارك</h3>
                  <p className="text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                      لا توجد رحلات مجدولة حالياً في هذا المسار. كن المبادر واطلب رحلتك الآن ليقوم الناقلون بتقديم عروضهم لك.
                  </p>
                  <Button size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all" onClick={handleRequestAction}>
                      <Send className="h-5 w-5" />
                      إنشاء أول طلب
                  </Button>
              </div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-in slide-in-from-bottom-4 duration-500">
                  {sortedTrips.map(trip => (
                      <ScheduledTripCard key={trip.id} trip={trip} onBookNow={handleBookNowClick} />
                  ))}
              </div>
          )}
        </div>
      </div>
       
      <AuthRedirectDialog isOpen={isAuthRedirectOpen} onOpenChange={setIsAuthRedirectOpen} />
      {selectedTripForBooking && <BookingDialog isOpen={isBookingOpen} onOpenChange={setIsBookingOpen} trip={selectedTripForBooking} seatCount={searchSeats} onConfirm={handleConfirmBooking} />}
      <RequestDialog isOpen={isRequestOpen} onOpenChange={setIsRequestOpen} searchParams={{origin:searchOriginCity, destination:searchDestinationCity, departureDate:searchDate, passengers:searchSeats, requestType:searchMode==='specific-carrier'&&selectedCarrier?'Direct':'General', targetCarrierId:selectedCarrier?.id}} onSuccess={handleRequestSent}/>
    </AppLayout>
  );
}
