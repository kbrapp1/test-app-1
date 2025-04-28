import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AssetGallery } from './AssetGallery'; // Use named import

// Mock the Supabase server client
// Adjust the path if your createClient is located elsewhere
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

// Mock the revalidatePath function from next/cache as it might be called indirectly
// (though likely not directly by the gallery itself, good practice if actions were involved)
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));


// Define mock asset data
const mockAssets = [
    { id: 'uuid-1', name: 'image1.png', storage_path: 'user/path/image1.png', mime_type: 'image/png', size: 1024, created_at: new Date().toISOString(), user_id: 'user-abc' },
    { id: 'uuid-2', name: 'image2.jpg', storage_path: 'user/path/image2.jpg', mime_type: 'image/jpeg', size: 2048, created_at: new Date().toISOString(), user_id: 'user-abc' },
];

// Define mock Supabase client functions
const mockSupabase = {
    from: vi.fn().mockReturnThis(), // Allows chaining .select, .order etc.
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }), // Default to no assets
    storage: {
        from: vi.fn().mockReturnThis(),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://mock.url/image.jpg' } }),
    }
};

// Import the mocked createClient function after the mock setup
import { createClient } from '@/lib/supabase/server';


describe('AssetGallery Component', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Setup the mock createClient to return our mock Supabase instance
        (createClient as Mock).mockReturnValue(mockSupabase);

        // Reset the specific mock implementations for Supabase methods if needed
        // Default setup: returns empty assets array
        mockSupabase.from.mockReturnThis();
        mockSupabase.select.mockReturnThis();
        mockSupabase.order.mockResolvedValue({ data: [], error: null });
        mockSupabase.storage.from.mockReturnThis();
        mockSupabase.storage.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://mock.url/default.jpg' } });

    });

    it('should render without crashing', async () => {
        // Since AssetGallery is likely an async Server Component, rendering involves promises
        const GalleryComponent = await AssetGallery();
        const { container } = render(GalleryComponent);
        // Basic check if the component renders anything
        expect(container).toBeInTheDocument();
    });

    // --- Add more tests here ---

    it('should display "No assets found" message when there are no assets', async () => {
        // Ensure the mock returns an empty array (default beforeEach setup)
        const GalleryComponent = await AssetGallery();
        render(GalleryComponent);

        // Use findByText which waits for the element to appear
        expect(await screen.findByText(/no assets found/i)).toBeInTheDocument();
    });

    it('should fetch assets and call getPublicUrl for each', async () => {
        // Setup mock to return assets
        mockSupabase.order.mockResolvedValueOnce({ data: mockAssets, error: null });
        // Setup mock for getPublicUrl to return distinct URLs if needed, or use the default
        mockSupabase.storage.getPublicUrl
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image1.png' } })
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image2.jpg' } });

        const GalleryComponent = await AssetGallery();
        render(GalleryComponent);

        // Wait for images to potentially render (adjust query based on actual render)
        await waitFor(() => {
            expect(screen.getAllByRole('img')).toHaveLength(mockAssets.length);
        });

        // Verify Supabase calls
        expect(createClient).toHaveBeenCalledTimes(1);
        expect(mockSupabase.from).toHaveBeenCalledWith('assets');
        expect(mockSupabase.select).toHaveBeenCalledWith('*');
        expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: false });

        // Verify getPublicUrl calls
        expect(mockSupabase.storage.from).toHaveBeenCalledWith('assets');
        expect(mockSupabase.storage.getPublicUrl).toHaveBeenCalledTimes(mockAssets.length);
        expect(mockSupabase.storage.getPublicUrl).toHaveBeenCalledWith(mockAssets[0].storage_path);
        expect(mockSupabase.storage.getPublicUrl).toHaveBeenCalledWith(mockAssets[1].storage_path);
    });

     it('should render the correct number of asset images', async () => {
        // Setup mock to return assets
        mockSupabase.order.mockResolvedValueOnce({ data: mockAssets, error: null });
        // Add the mock setup for getPublicUrl for this specific test
        mockSupabase.storage.getPublicUrl
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image1.png' } })
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image2.jpg' } });

        const GalleryComponent = await AssetGallery();
        render(GalleryComponent);

        // Use findAllByRole which waits for the elements
        const images = await screen.findAllByRole('img');
        expect(images).toHaveLength(mockAssets.length);

        // Optionally check src attributes
        expect(images[0]).toHaveAttribute('src', 'http://mock.url/image1.png');
        expect(images[1]).toHaveAttribute('src', 'http://mock.url/image2.jpg');
    });


}); 