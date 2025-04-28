import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { UploadCloud } from 'lucide-react';
import { AssetGallery } from "@/components/dam/AssetGallery";

// Force dynamic rendering for this page because Supabase client uses cookies
export const dynamic = 'force-dynamic';

export default function DamGalleryPage() {
    return (
        <div className="container mx-auto p-4">
            <div className="mb-4 flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Asset Library</h1>
                <Link href="/dam/upload" passHref legacyBehavior>
                    <Button asChild>
                        <a>
                            <UploadCloud className="mr-2 h-4 w-4" /> Upload Assets
                        </a>
                    </Button>
                </Link>
            </div>
            {/* Using a simple fallback for now */}
            <Suspense fallback={<p className="text-center">Loading assets...</p>}>
                <AssetGallery />
            </Suspense>
        </div>
    );
}