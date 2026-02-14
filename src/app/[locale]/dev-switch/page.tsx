'use client';

import { AppLayout } from '@/components/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUserProfile } from '@/hooks/use-user-profile';
import { ArrowLeftRight, User, Ship, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { notFound } from 'next/navigation';

function Unauthorized() {
    const router = useRouter();
    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/dashboard');
        }, 3000);
        return () => clearTimeout(timer);
    }, [router]);
    
    return (
        <div className="flex h-full items-center justify-center text-center p-8">
            <div className="flex flex-col items-center gap-4">
                <h1 className="text-2xl font-bold text-destructive">Unauthorized Access</h1>
                <p className="text-muted-foreground max-w-md">
                    This developer tool is restricted to Admins and Owners only. Redirecting...
                </p>
            </div>
        </div>
    );
}

export default function DevSwitchPage() {
    if (process.env.NODE_ENV !== 'development') {
        notFound();
    }

    const router = useRouter();
    const { profile, isLoading } = useUserProfile();

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex h-full flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p>Loading Developer Interface...</p>
                </div>
            </AppLayout>
        );
    }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
        return (
            <AppLayout>
                <Unauthorized />
            </AppLayout>
        );
    }
    
    return (
        <AppLayout>
            <div className="container mx-auto max-w-2xl p-4 md:p-8">
                <Card className="shadow-2xl border-accent">
                    <CardHeader className="text-center">
                        <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit">
                            <ArrowLeftRight className="h-8 w-8 text-accent" />
                        </div>
                        <CardTitle className="mt-4 text-2xl">Developer Control Panel</CardTitle>
                        <CardDescription>
                            Quickly switch between different user perspectives for testing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="h-24 flex-col gap-2"
                            onClick={() => router.push('/dashboard')}
                        >
                            <User className="h-6 w-6" />
                            <span className="font-bold">Traveler View</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            size="lg" 
                            className="h-24 flex-col gap-2"
                            onClick={() => router.push('/carrier')}
                        >
                            <Ship className="h-6 w-6" />
                             <span className="font-bold">Carrier View</span>
                        </Button>
                        <Button 
                            variant="default"
                            size="lg" 
                            className="h-24 flex-col gap-2 bg-primary hover:bg-primary/90"
                            onClick={() => router.push('/admin')}
                        >
                            <Shield className="h-6 w-6" />
                             <span className="font-bold">Admin View</span>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
