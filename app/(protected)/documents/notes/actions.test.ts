import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { addNote, deleteNote, editNote, updateNoteOrder } from './actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { ErrorCodes } from '@/lib/errors/constants';
import { jwtDecode } from 'jwt-decode'; // Import for mocking

// Define a reusable structure for the mocks
const mockMatcher = {
    match: vi.fn(),
};
const mockQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn(),
    delete: vi.fn(() => mockMatcher),
    update: vi.fn(() => mockMatcher),
    upsert: vi.fn(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(),
    // Include match here as well, although delete/update return the specific matcher object
    match: mockMatcher.match, 
};
const mockAuth = {
    getUser: vi.fn(),
    getSession: vi.fn(), // Add getSession mock
};
const mockSupabaseClient = {
    auth: mockAuth,
    from: vi.fn(() => mockQueryBuilder),
};

// Mock Supabase server client factory
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock revalidatePath
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}));

// Mock jwt-decode
vi.mock('jwt-decode', () => ({
    jwtDecode: vi.fn(),
}));

// --- Test Setup --- (Keep helpers)
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
const mockFormData = (data: Record<string, string>): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) { // Ensure undefined doesn't cause issues
             formData.append(key, value);
        }
    });
    return formData;
};

describe('Notes Server Actions', () => {
    // Define mock variables accessible in the scope
    let mockGetUser: Mock;
    let mockFrom: Mock;
    let mockInsert: Mock;
    let mockDelete: Mock;
    let mockUpdate: Mock;
    let mockUpsert: Mock;
    let mockMatch: Mock;
    let mockMaybeSingle: Mock;
    let mockGetSession: Mock; // For getSession
    let mockJwtDecode: Mock; // For jwtDecode

    beforeEach(() => {
        // Reset all mocks defined in the mock factory structure
        vi.clearAllMocks(); // Clears call history etc.

        // Re-assign mocks from the central structure for clarity
        mockGetUser = mockAuth.getUser;
        mockFrom = mockSupabaseClient.from;
        mockInsert = mockQueryBuilder.insert;
        mockDelete = mockQueryBuilder.delete;
        mockUpdate = mockQueryBuilder.update;
        mockUpsert = mockQueryBuilder.upsert;
        mockMatch = mockMatcher.match;
        mockMaybeSingle = mockQueryBuilder.maybeSingle;
        mockGetSession = mockAuth.getSession as Mock; // Assign getSession mock
        mockJwtDecode = jwtDecode as Mock; // Assign jwtDecode mock
        
        // Default happy paths
        mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });
        // Default mock for getSession returning a valid session with an access token
        mockGetSession.mockResolvedValue({
            data: {
                session: {
                    access_token: 'mock.access.token',
                    user: mockUser,
                }
            },
            error: null,
        });
        // Default mock for jwtDecode returning the active_organization_id
        mockJwtDecode.mockReturnValue({
            custom_claims: {
                active_organization_id: 'test-org-id-from-jwt',
            },
        });

        mockInsert.mockResolvedValue({ error: null });
        mockMatch.mockResolvedValue({ error: null }); // Match resolves successfully by default
        mockUpsert.mockResolvedValue({ error: null });
        mockMaybeSingle.mockResolvedValue({ data: { position: 0 }, error: null });
    });

    // --- addNote Tests --- 
    describe('addNote', () => {
        it('should add a note successfully', async () => {
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('notes');
            expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({
                title: 'Test Note',
                content: 'Test Content',
                user_id: mockUser.id,
                organization_id: 'test-org-id-from-jwt', // Expect org id from JWT mock
                position: 1, // Assuming default max position was 0
                color_class: 'bg-yellow-200'
            }));
            expect(revalidatePath).toHaveBeenCalledWith('/documents/notes');
            expect(result).toEqual({ success: true, message: 'Note added successfully.' });
        });

        it('should return validation error if title is missing', async () => {
            const formData = mockFormData({ content: 'Test Content' }); // No title
            const result = await addNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Note title cannot be empty.',
                code: ErrorCodes.VALIDATION_ERROR 
            });
            expect(mockInsert).not.toHaveBeenCalled();
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should return auth error if user is not found', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Authentication error. Please log in again.',
                code: ErrorCodes.UNAUTHORIZED 
            });
        });

         it('should return auth error if getUser throws', async () => {
            mockGetUser.mockRejectedValueOnce(new Error('Auth fetch failed'));
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Could not verify authentication. Please try again.', 
                code: ErrorCodes.UNEXPECTED_ERROR 
            });
        });

        it('should return insert error if Supabase insert fails', async () => {
            mockInsert.mockReturnValueOnce({ error: new Error('Insert failed') });
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Failed to save the note. Please try again.',
                code: ErrorCodes.DATABASE_ERROR
            });
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should handle error when fetching max position', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'test-user-id' } }, error: null });
            mockMaybeSingle.mockReturnValueOnce({ data: null, error: new Error('DB connection failed') });
            
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);

            expect(result).toEqual({ 
                success: false, 
                message: 'Failed to prepare note saving. Please try again.', 
                code: ErrorCodes.DATABASE_ERROR
            });
            expect(mockInsert).not.toHaveBeenCalled(); 
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should return auth error if active_organization_id is not in JWT claims', async () => {
            mockJwtDecode.mockReturnValueOnce({ custom_claims: {} }); // No active_organization_id
            const formData = mockFormData({ title: 'Test Note', content: 'Test Content' });
            const result = await addNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            });
        });
    });

    // --- deleteNote Tests --- 
    describe('deleteNote', () => {
        it('should delete a note successfully', async () => {
            const formData = mockFormData({ note_id: 'note-123' });
            const result = await deleteNote(null, formData);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('notes');
            expect(mockDelete).toHaveBeenCalled();
            expect(mockMatch).toHaveBeenCalledWith({ id: 'note-123', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt' });
            expect(revalidatePath).toHaveBeenCalledWith('/documents/notes');
            expect(result).toEqual({ success: true, message: 'Note deleted.' });
        });

        it('should return error if note_id is missing', async () => {
            const formData = mockFormData({});
            const result = await deleteNote(null, formData);
            expect(result).toEqual({ success: false, message: 'Note ID missing.' });
        });

        it('should return auth error if user is not found', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const formData = mockFormData({ note_id: 'note-123' });
            const result = await deleteNote(null, formData);
            expect(result).toEqual({ success: false, message: 'Authentication error. Please log in again.' });
        });

        it('should return delete error if Supabase delete fails', async () => {
            const dbError = new Error('DB delete failed');
            mockMatch.mockResolvedValueOnce({ error: dbError }); // Mock error at the match step
            const formData = mockFormData({ note_id: 'note-123' });
            const result = await deleteNote(null, formData);
            expect(mockDelete).toHaveBeenCalled(); 
            expect(mockMatch).toHaveBeenCalledWith({ id: 'note-123', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt' });
            expect(result).toEqual({ success: false, message: 'Failed to delete the note. Please try again.' });
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should return auth error if active_organization_id is not in JWT claims', async () => {
            mockJwtDecode.mockReturnValueOnce({ custom_claims: {} }); // No active_organization_id
            const formData = mockFormData({ note_id: 'note-123' });
            const result = await deleteNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            });
        });
    });

     // --- editNote Tests --- 
    describe('editNote', () => {
        const validFormData = {
            note_id: 'note-456',
            title: 'Updated Title',
            content: 'Updated Content',
            color_class: 'bg-blue-200'
        };

        it('should edit a note successfully', async () => {
            const formData = mockFormData(validFormData);
            const result = await editNote(null, formData);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('notes');
            expect(mockUpdate).toHaveBeenCalledWith({
                title: 'Updated Title',
                content: 'Updated Content',
                color_class: 'bg-blue-200'
            });
            expect(mockMatch).toHaveBeenCalledWith({ id: 'note-456', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt' });
            expect(revalidatePath).toHaveBeenCalledWith('/documents/notes');
            expect(result).toEqual({ success: true, message: 'Note updated successfully.' });
        });

        it.each([
            ['note_id', { ...validFormData, note_id: '' }, 'Note ID missing.'],
            ['title', { ...validFormData, title: '' }, 'Note title cannot be empty.'],
            ['content', { ...validFormData, content: undefined }, 'Note content missing.'],
            ['color_class', { ...validFormData, color_class: '' }, 'Color selection missing.'],
        ])('should return validation error if %s is missing', async (_, data, expectedMessage) => {
            const formData = mockFormData(data as Record<string, string>); // Use helper, ensures undefined is handled
            const result = await editNote(null, formData);
            expect(result).toEqual({ success: false, message: expectedMessage });
            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockMatch).not.toHaveBeenCalled(); // Match shouldn't be called either
        });


        it('should return auth error if user is not found', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const formData = mockFormData(validFormData);
            const result = await editNote(null, formData);
            expect(result).toEqual({ success: false, message: 'Authentication error. Please log in again.' });
        });

        it('should return update error if Supabase update fails', async () => {
            const dbError = new Error('DB update failed');
            mockMatch.mockResolvedValueOnce({ error: dbError }); // Mock error at the match step
            const formData = mockFormData(validFormData);
            const result = await editNote(null, formData);
            expect(mockUpdate).toHaveBeenCalled();
            expect(mockMatch).toHaveBeenCalledWith({ id: 'note-456', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt' });
            expect(result).toEqual({ success: false, message: 'Failed to update the note. Please try again.' });
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should return auth error if active_organization_id is not in JWT claims', async () => {
            mockJwtDecode.mockReturnValueOnce({ custom_claims: {} }); // No active_organization_id
            const formData = mockFormData(validFormData);
            const result = await editNote(null, formData);
            expect(result).toEqual({ 
                success: false, 
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            });
        });
    });

    // --- updateNoteOrder Tests --- 
    describe('updateNoteOrder', () => {
        const orderedIds = ['note-3', 'note-1', 'note-2'];

        it('should update note order successfully', async () => {
            const result = await updateNoteOrder(orderedIds);

            expect(mockGetUser).toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('notes');
            expect(mockUpsert).toHaveBeenCalledWith(
                [
                    { id: 'note-3', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt', position: 0 },
                    { id: 'note-1', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt', position: 1 },
                    { id: 'note-2', user_id: mockUser.id, organization_id: 'test-org-id-from-jwt', position: 2 },
                ],
                { onConflict: 'id' }
            );
            expect(revalidatePath).toHaveBeenCalledWith('/documents/notes');
            expect(result).toEqual({ success: true, message: 'Note order updated.' });
        });

        it('should return validation error for invalid input', async () => {
            const result = await updateNoteOrder(null as any); // Test non-array input
            expect(result).toEqual({ success: false, message: 'Invalid order data.' });
            expect(mockUpsert).not.toHaveBeenCalled();
        });

        it('should return auth error if user is not found', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const result = await updateNoteOrder(orderedIds);
            expect(result).toEqual({ success: false, message: 'Authentication error. Please log in again.' });
        });

        it('should return update error if Supabase upsert fails', async () => {
            const dbError = new Error('DB upsert failed');
            mockUpsert.mockResolvedValueOnce({ error: dbError });
            const result = await updateNoteOrder(orderedIds);
            expect(result).toEqual({ success: false, message: 'Failed to update note order. Please try again.' });
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should handle unexpected errors during upsert', async () => {
            const unexpectedError = new Error('Something unexpected happened');
            mockUpsert.mockImplementationOnce(() => { throw unexpectedError; }); // Throw error 
            const result = await updateNoteOrder(orderedIds);
            expect(result).toEqual({ success: false, message: 'An unexpected error occurred while updating note order.' });
            expect(revalidatePath).not.toHaveBeenCalled();
        });

        it('should return auth error if active_organization_id is not in JWT claims', async () => {
            mockJwtDecode.mockReturnValueOnce({ custom_claims: {} }); // No active_organization_id
            const result = await updateNoteOrder(orderedIds);
            expect(result).toEqual({ 
                success: false, 
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            });
        });

        // Test for when getActiveOrganizationId (via jwtDecode) returns null for active_organization_id
        it('should return error if active_organization_id is not in JWT claims', async () => {
            mockJwtDecode.mockReturnValueOnce({ custom_claims: {} }); // No active_organization_id
            const orderedNoteIds = ['note-1', 'note-2'];
            const result = await updateNoteOrder(orderedNoteIds);
            expect(result).toEqual({ 
                success: false, 
                message: 'Active organization context is missing.',
                code: ErrorCodes.USER_NOT_IN_ORGANIZATION
            });
        });

        it('should return auth error if user is not found', async () => {
            mockGetUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const orderedNoteIds = ['note-1', 'note-2'];
            const result = await updateNoteOrder(orderedNoteIds);
            expect(result).toEqual({ success: false, message: 'Authentication error. Please log in again.' });
        });
    });
}); 