'use server';

// --- Import the usecase ---
import { getGalleryItemsUsecase } from '@/lib/usecases/dam/getGalleryItemsUsecase'; 
import { CombinedItem } from '@/types/dam'; // Type needed for return signature

// Action to fetch combined assets and folders for the gallery view
export async function getAssetsAndFoldersForGallery(
  currentFolderId: string | null
): Promise<{ success: boolean; data?: { combinedItems: CombinedItem[] }; error?: string }> {
  console.log(`[Action] Fetching gallery via usecase for folder: ${currentFolderId}`);
  try {
    // Delegate directly to the usecase
    const usecaseResult = await getGalleryItemsUsecase({ currentFolderId });

    if (!usecaseResult.success) {
      // Log the error from the action perspective
      console.error('getAssetsAndFoldersForGallery Action: Usecase Error', usecaseResult.error);
      // Return the result directly as it contains the error message
      return usecaseResult;
    }

    // No need for revalidatePath here as this is a read operation
    // console.log(`[Action] Fetched items successfully for folder: ${currentFolderId}`);
    return usecaseResult; // Return the successful result from the usecase

  } catch (err: any) {
    // Catch unexpected errors *within the action itself* (should be rare if usecase handles errors)
    console.error('getAssetsAndFoldersForGallery Action: Unexpected Error', err);
    return { success: false, error: err.message || 'An unexpected error occurred fetching gallery data.' };
  }
} 