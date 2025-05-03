import React from 'react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouterProvider } from 'next-router-mock/MemoryRouterProvider';
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

// Mock the server actions module
vi.mock('@/lib/actions/dam', () => ({
    deleteAsset: vi.fn(), // Mock specific actions if needed, otherwise an empty object might suffice
    // Add mocks for other actions if AssetGallery uses them indirectly
}));

// Mock child thumbnail components
vi.mock('./AssetThumbnail', () => ({
    AssetThumbnail: (props: any) => <div data-testid="mock-asset-thumbnail" {...props}>Mock Asset</div>
}));
vi.mock('./FolderThumbnail', () => ({
    FolderThumbnail: (props: any) => <div data-testid="mock-folder-thumbnail" {...props}>Mock Folder</div>
}));

// Mock AssetGrid as well, since AssetGallery renders it
vi.mock('./AssetGrid', () => ({
    // AssetGrid expects assets, folders, currentFolderId, etc.
    // We can make it a simple mock that just displays children or a placeholder
    AssetGrid: (props: any) => (
        <div data-testid="mock-asset-grid">
            {/* Render mock thumbnails based on props to allow checking props */}
            {props.folders?.map((folder: any) => <div key={folder.id} data-testid="mock-folder-thumb-from-grid" {...folder}>Mock Folder</div>)}
            {props.assets?.map((asset: any) => <div key={asset.id} data-testid="mock-asset-thumb-from-grid" {...asset}>Mock Asset</div>)}
            {!props.folders?.length && !props.assets?.length && <div>Grid Empty</div>}
        </div>
    )
}));

// Define mock asset data - ADD folder_id
const mockAssets = [
    { id: 'uuid-1', name: 'image1.png', storage_path: 'user/path/image1.png', mime_type: 'image/png', size: 1024, created_at: new Date().toISOString(), user_id: 'user-abc', folder_id: null },
    { id: 'uuid-2', name: 'image2.jpg', storage_path: 'user/path/image2.jpg', mime_type: 'image/jpeg', size: 2048, created_at: new Date().toISOString(), user_id: 'user-abc', folder_id: null },
];

// Define mock Supabase client functions
const mockSupabase = {
    // Mock 'from' to return specific mock objects based on table name
    from: vi.fn().mockImplementation((tableName: string) => {
        if (tableName === 'assets') {
            return mockAssetsQuery;
        } else if (tableName === 'folders') {
            return mockFoldersQuery;
        } else if (tableName === 'storage.assets') { // Handle storage bucket
            return mockStorageFrom;
        }
        // Default fallback (though we should cover all expected tables)
        return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            eq: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
        };
    }),
    storage: {
        from: vi.fn().mockReturnThis(), // Keep this for initial storage access
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://mock.url/default.jpg' } })
    }
};

// Specific mock objects for asset and folder queries
const mockAssetsQuery = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }), // Default: no assets
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
};
const mockFoldersQuery = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: [], error: null }), // Default: no folders
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
};

// Mock object for storage.from('assets')
const mockStorageFrom = {
    getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://mock.url/default.jpg' } })
};

// Import the mocked createClient function after the mock setup
import { createClient } from '@/lib/supabase/server';


describe('AssetGallery Component', () => {

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();

        // Setup the mock createClient to return our mock Supabase instance
        (createClient as Mock).mockReturnValue(mockSupabase);

        // Reset individual mocks on the query objects
        mockAssetsQuery.select.mockReturnThis();
        mockAssetsQuery.eq.mockReturnThis();
        mockAssetsQuery.is.mockReturnThis();

        mockFoldersQuery.select.mockReturnThis();
        mockFoldersQuery.eq.mockReturnThis();
        mockFoldersQuery.is.mockReturnThis();

        // Reset storage mocks
        // The outer storage mock setup
        mockSupabase.storage.from.mockImplementation((bucketName: string) => {
             if (bucketName === 'assets') {
                 return mockStorageFrom;
             }
             return { getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'http://mock.url/error.jpg' } }) }; // Default/error case
         });
        // Reset the specific mock on the returned object
        mockStorageFrom.getPublicUrl.mockReturnValue({ data: { publicUrl: 'http://mock.url/default.jpg' } });
    });

    it('should render without crashing', async () => {
        const GalleryServerComponent = await AssetGallery({ currentFolderId: null });
        const { container } = render(<MemoryRouterProvider>{GalleryServerComponent}</MemoryRouterProvider>);
        expect(container).toBeInTheDocument();
    });

    // --- Add more tests here ---

    it('should display "No assets found" message when there are no assets', async () => {
        const GalleryServerComponent = await AssetGallery({ currentFolderId: null });
        render(<MemoryRouterProvider>{GalleryServerComponent}</MemoryRouterProvider>);
        expect(await screen.findByText(/this folder is empty/i)).toBeInTheDocument();
    });

    it('should fetch assets and folders and render AssetGrid', async () => {
        // Setup mock data 
        const mockAssetsResult = { data: mockAssets, error: null };
        const mockFoldersResult = { data: [], error: null };
        
        // --- Simplified Mock Setup for this test ---
        const specificMockAssetsQuery = {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue(mockAssetsResult) // Mock order directly
        };
        const specificMockFoldersQuery = {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue(mockFoldersResult)
        };

        // Temporarily override the main 'from' mock for this test
        const originalFromMock = mockSupabase.from;
        (mockSupabase.from as Mock).mockImplementation((tableName: string) => {
            if (tableName === 'assets') return specificMockAssetsQuery;
            if (tableName === 'folders') return specificMockFoldersQuery;
            // Basic fallback
            return { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        });
        // --- End Simplified Mock Setup ---

        // Setup URL mocks
        mockStorageFrom.getPublicUrl
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image1.png' } })
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image2.jpg' } });

        // Fetch the Server Component part
        const GalleryServerComponent = await AssetGallery({ currentFolderId: null });
        
        // Render within the router provider
        render(<MemoryRouterProvider>{GalleryServerComponent}</MemoryRouterProvider>);

        // Wait for the client component wrapper (mocked AssetGrid) to render
        await waitFor(() => {
            // Just check if the mock grid itself is rendered
            expect(screen.getByTestId('mock-asset-grid')).toBeInTheDocument(); 
        });

        // Verify Supabase calls from the Server Component part
        expect(mockSupabase.from).toHaveBeenCalledWith('folders');
        expect(specificMockFoldersQuery.select).toHaveBeenCalledWith('*');
        expect(specificMockFoldersQuery.is).toHaveBeenCalledWith('parent_folder_id', null);
        expect(specificMockFoldersQuery.order).toHaveBeenCalledWith('name', { ascending: true });

        expect(mockSupabase.from).toHaveBeenCalledWith('assets');
        expect(specificMockAssetsQuery.select).toHaveBeenCalledWith('*');
        expect(specificMockAssetsQuery.is).toHaveBeenCalledWith('folder_id', null);
        expect(specificMockAssetsQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });

        expect(mockSupabase.storage.from).toHaveBeenCalledWith('assets');
        expect(mockStorageFrom.getPublicUrl).toHaveBeenCalledTimes(mockAssets.length);
        expect(mockStorageFrom.getPublicUrl).toHaveBeenCalledWith(mockAssets[0].storage_path);
        expect(mockStorageFrom.getPublicUrl).toHaveBeenCalledWith(mockAssets[1].storage_path);

        // Check that the mocked AssetGrid component was rendered 
        // (implying data was passed, even if we can't easily check internal rendering)
        const mockGrid = await screen.findByTestId('mock-asset-grid');
        expect(mockGrid).toBeInTheDocument();

        // We can no longer reliably check props passed to the internal divs 
        // of the mocked AssetGrid easily with this setup.
        // Commenting out the detailed prop checks for now.
        /*
        const thumbnails = await screen.findAllByTestId('mock-asset-thumb-from-grid');
        expect(thumbnails).toHaveLength(mockAssets.length);

        // Check props passed to the mocked AssetThumbnail (now divs within the mocked grid)
        expect(thumbnails[0]).toHaveAttribute('src', 'http://mock.url/image1.png');
        expect(thumbnails[0]).toHaveAttribute('alt', mockAssets[0].name);
        expect(thumbnails[0]).toHaveAttribute('assetId', mockAssets[0].id);
        expect(thumbnails[0]).toHaveAttribute('storagePath', mockAssets[0].storage_path);
        // Check folderId (should be null as per updated mock data)
        // Note: getAttribute might return "null" as a string, or the attribute might be absent.
        // Let's check for absence or string "null". Adjust if needed.
        const folderIdAttr = thumbnails[0].getAttribute('folderId');
        expect([null, 'null']).toContain(folderIdAttr);
        expect(thumbnails[0]).toHaveAttribute('type', 'asset');

        expect(thumbnails[1]).toHaveAttribute('src', 'http://mock.url/image2.jpg');
        const folderIdAttr1 = thumbnails[1].getAttribute('folderId');
        expect([null, 'null']).toContain(folderIdAttr1);
        */
    });

     it('should pass correct props to AssetThumbnail within AssetGrid', async () => {
        // Setup mock data
        const mockAssetsResult = { data: mockAssets, error: null };
        const mockFoldersResult = { data: [], error: null };

        // --- Simplified Mock Setup for this test ---
        const specificMockAssetsQuery = {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue(mockAssetsResult) // Mock order directly
        };
        const specificMockFoldersQuery = {
            select: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue(mockFoldersResult)
        };

        // Temporarily override the main 'from' mock for this test
        const originalFromMock = mockSupabase.from;
        (mockSupabase.from as Mock).mockImplementation((tableName: string) => {
            if (tableName === 'assets') return specificMockAssetsQuery;
            if (tableName === 'folders') return specificMockFoldersQuery;
             // Basic fallback
            return { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        });
         // --- End Simplified Mock Setup ---

        // Setup URL mocks
        mockStorageFrom.getPublicUrl
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image1.png' } })
            .mockReturnValueOnce({ data: { publicUrl: 'http://mock.url/image2.jpg' } });

        const GalleryServerComponent = await AssetGallery({ currentFolderId: null });
        
        // Render within the router provider
        render(<MemoryRouterProvider>{GalleryServerComponent}</MemoryRouterProvider>);

        const thumbnails = await screen.findAllByTestId('mock-asset-thumb-from-grid');
        expect(thumbnails).toHaveLength(mockAssets.length);

        // Check props passed to the mocked AssetThumbnail
        expect(thumbnails[0]).toHaveAttribute('src', 'http://mock.url/image1.png');
        expect(thumbnails[0]).toHaveAttribute('alt', mockAssets[0].name);
        expect(thumbnails[0]).toHaveAttribute('assetId', mockAssets[0].id);
        expect(thumbnails[0]).toHaveAttribute('storagePath', mockAssets[0].storage_path);
        // Check folderId (should be null as per updated mock data)
        // Note: getAttribute might return "null" as a string, or the attribute might be absent.
        // Let's check for absence or string "null". Adjust if needed.
        const folderIdAttr = thumbnails[0].getAttribute('folderId');
        expect([null, 'null']).toContain(folderIdAttr);
        expect(thumbnails[0]).toHaveAttribute('type', 'asset');

        expect(thumbnails[1]).toHaveAttribute('src', 'http://mock.url/image2.jpg');
        const folderIdAttr1 = thumbnails[1].getAttribute('folderId');
        expect([null, 'null']).toContain(folderIdAttr1);
    });

}); 