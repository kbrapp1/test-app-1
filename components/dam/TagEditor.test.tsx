/// <reference types="vitest/globals" />
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { TagEditor } from './TagEditor';
import type { Tag } from '@/lib/actions/dam/tag.actions';

// Mock server actions
const mockListTagsForOrganization = vi.fn();
const mockGetAllTagsForOrganizationInternal = vi.fn();
const mockCreateTag = vi.fn();
const mockAddTagToAsset = vi.fn();

vi.mock('@/lib/actions/dam/tag.actions', () => ({
  listTagsForOrganization: (...args: any[]) => mockListTagsForOrganization(...args),
  getAllTagsForOrganizationInternal: (...args: any[]) => mockGetAllTagsForOrganizationInternal(...args),
  createTag: (...args: any[]) => mockCreateTag(...args),
}));

vi.mock('@/lib/actions/dam/asset-crud.actions', () => ({
  addTagToAsset: (...args: any[]) => mockAddTagToAsset(...args),
}));

const mockOrgId = 'org-123';
const mockAssetId = 'asset-abc';

const mockTag1: Tag = { id: 'tag-1', name: 'Nature', organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() };
const mockTag2: Tag = { id: 'tag-2', name: 'Animal', organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() };
const mockTag3: Tag = { id: 'tag-3', name: 'Landscape', organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() };
const mockTag4: Tag = { id: 'tag-4', name: 'Urban', organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() };

const defaultCurrentTags: Tag[] = [mockTag1];
const allOrganizationTags: Tag[] = [mockTag1, mockTag2, mockTag3, mockTag4];

const defaultProps = {
  assetId: mockAssetId,
  organizationId: mockOrgId,
  currentTags: defaultCurrentTags,
  onTagAdded: vi.fn(),
};

const renderTagEditor = (props: Partial<typeof defaultProps> = {}) => {
  const user = userEvent.setup();
  const initialProps = { ...defaultProps, ...props };
  const view = render(<TagEditor {...initialProps} />);
  return {
    user,
    ...view,
    props: initialProps,
    rerenderWithProps: (newProps: Partial<typeof defaultProps>) => {
      const updatedProps = { ...defaultProps, ...initialProps, ...newProps };
      view.rerender(<TagEditor {...updatedProps} />);
      return { user, ...view, props: updatedProps }; // Return new state for chaining
    }
  };
};

describe('TagEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = vi.fn(); // Mock scrollIntoView
    mockListTagsForOrganization.mockResolvedValue({ success: true, data: [...allOrganizationTags] });
    mockGetAllTagsForOrganizationInternal.mockResolvedValue({ success: true, data: [...allOrganizationTags] });
    mockAddTagToAsset.mockResolvedValue({ success: true, data: { id: 'asset-tag-link-1' } });
    mockCreateTag.mockResolvedValue({ success: true, data: { id: 'tag-new', name: 'New Tag', organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() }});
  });

  it('renders the "Add Tag" button and popover is initially closed', () => {
    renderTagEditor();
    expect(screen.getByRole('button', { name: /Add Tag/i })).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Search or create tag.../i)).not.toBeInTheDocument();
  });

  describe('Popover Functionality', () => {
    it('opens popover on button click and calls listTagsForOrganization', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      expect(mockListTagsForOrganization).toHaveBeenCalledWith(mockOrgId);
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/Search or create tag.../i)).toBeInTheDocument();
      });
    });

    it('shows loading state while fetching tags', async () => {
      mockListTagsForOrganization.mockImplementationOnce(() => new Promise(() => {})); // Pending promise
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      await waitFor(() => {
        // CommandEmpty will show "Loading..."
        expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
      });
    });
    
    it('shows error message if fetching tags fails', async () => {
      mockListTagsForOrganization.mockResolvedValueOnce({ success: false, error: 'Fetch failed miserably' });
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/Error: Fetch failed miserably/i)).toBeInTheDocument();
      });
      await waitFor(() => {
        // CommandEmpty text when error and not loading, and not showCreateOption
        expect(screen.getByText(/No tags found./i)).toBeInTheDocument();
      });
    });

    it('closes popover and resets input when clicking trigger again', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton); 

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, "test input");
      expect(input).toHaveValue("test input");

      await user.click(addButton); // Close by clicking trigger again
      
      await waitFor(() => {
         expect(screen.queryByPlaceholderText(/Search or create tag.../i)).not.toBeInTheDocument();
      });
      
      // Re-open to check if input was reset
      await user.click(addButton);
       await waitFor(async () => {
        const reopenedInput = screen.getByPlaceholderText(/Search or create tag.../i);
        expect(reopenedInput).toHaveValue(""); 
      });
    });
  });

  describe('Tag Suggestions and Filtering', () => {
    it('displays available tags (excluding current asset tags) as suggestions', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      // User types to make suggestions appear
      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, 'a'); // Type something to trigger suggestions based on filtering

      await waitFor(() => {
        expect(screen.getByText(mockTag2.name)).toBeInTheDocument(); // Animal
        expect(screen.getByText(mockTag3.name)).toBeInTheDocument(); // Landscape
        expect(screen.getByText(mockTag4.name)).toBeInTheDocument(); // Urban
        expect(screen.queryByText(mockTag1.name)).not.toBeInTheDocument(); // Nature (already on asset)
      });
    });

    it('filters suggestions based on input', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, 'Land');

      await waitFor(() => {
        expect(screen.getByText(mockTag3.name)).toBeInTheDocument(); // Landscape
        expect(screen.queryByText(mockTag2.name)).not.toBeInTheDocument(); // Animal
        expect(screen.queryByText(mockTag4.name)).not.toBeInTheDocument(); // Urban
      });
    });
    
    it('shows "No existing tags match." if input filters out all suggestions and allows creation', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);
      
      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, 'NewUniqueTag');

      await waitFor(() => {
        expect(screen.getByText(/Create "NewUniqueTag"/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Selecting an Existing Tag', () => {
    it('calls addTagToAsset, onTagAdded, closes popover, and updates available tags', async () => {
      let currentTestTagsInScope = [...defaultCurrentTags];
      const mockOnTagAddedCb = vi.fn((newlyAddedTag, allCurrentTags) => {
        currentTestTagsInScope = allCurrentTags;
      });

      const { user, rerenderWithProps } = renderTagEditor({
        currentTags: currentTestTagsInScope,
        onTagAdded: mockOnTagAddedCb,
      });
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      // User types to make the specific tag appear
      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, 'Anima'); // Ensure "Animal" (mockTag2) is suggested

      const tagToAdd = mockTag2; // Animal
      const tagItem = await screen.findByText(tagToAdd.name);
      await user.click(tagItem);

      expect(mockAddTagToAsset).toHaveBeenCalledTimes(1);
      const formData = mockAddTagToAsset.mock.calls[0][0] as FormData;
      expect(formData.get('assetId')).toBe(mockAssetId);
      expect(formData.get('tagId')).toBe(tagToAdd.id);

      // onTagAdded callback is called with the newly added tag and the *new* full list of tags
      expect(mockOnTagAddedCb).toHaveBeenCalledWith(tagToAdd, [...defaultCurrentTags, tagToAdd]);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Search or create tag.../i)).not.toBeInTheDocument(); // Popover closed
      });

      // Simulate parent updating the prop based on the callback
      rerenderWithProps({ currentTags: currentTestTagsInScope });

      await user.click(addButton); // Re-open popover

      // User types again to make other suggestions appear after re-opening
      const reopenedInput = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(reopenedInput, 'Land'); // Type to make "Landscape" (mockTag3) appear

      await waitFor(() => {
        // After re-opening and typing, the listTagsForOrganization will be called (or rather, its data used),
        // and the component will filter displaySuggestions against the NEW currentTestTagsInScope prop and new inputValue.
        // So, tagToAdd (Animal) should not be in suggestions (if "Land" doesn't match "Animal").
        expect(screen.queryByText(tagToAdd.name)).not.toBeInTheDocument(); // Animal should not be there
        expect(screen.getByText(mockTag3.name)).toBeInTheDocument(); // Landscape should be there
      });
    });

    it('shows error if addTagToAsset fails', async () => {
      mockAddTagToAsset.mockResolvedValueOnce({ success: false, error: 'Failed to add existing tag' });
      const { user, props } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      // User types to make the specific tag appear
      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, 'Anima'); // Ensure "Animal" (mockTag2) is suggested

      const tagItem = await screen.findByText(mockTag2.name); // Animal
      await user.click(tagItem);

      await waitFor(() => {
        expect(screen.getByText(/Error: Failed to add existing tag/i)).toBeInTheDocument();
      });
      expect(props.onTagAdded).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/Search or create tag.../i)).toBeInTheDocument(); // Stays open
    });
  });

  describe('Creating and Adding a New Tag', () => {
    const newTagName = 'UniqueNewTag';
    const createdTagData: Tag = { id: 'tag-new-unique', name: newTagName, organization_id: mockOrgId, user_id: 'user-1', created_at: new Date().toISOString() };

    it('calls createTag, addTagToAsset, onTagAdded, and closes popover', async () => {
      mockCreateTag.mockResolvedValueOnce({ success: true, data: createdTagData });
      // addTagToAsset is mocked to succeed by default
      const { user, props } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, newTagName);
      
      const createOption = await screen.findByText(`Create "${newTagName}"`);
      await user.click(createOption);
      
      expect(mockCreateTag).toHaveBeenCalledTimes(1);
      const createFormData = mockCreateTag.mock.calls[0][0] as FormData;
      expect(createFormData.get('name')).toBe(newTagName);

      expect(mockAddTagToAsset).toHaveBeenCalledTimes(1);
      const addFormData = mockAddTagToAsset.mock.calls[0][0] as FormData;
      expect(addFormData.get('assetId')).toBe(mockAssetId);
      expect(addFormData.get('tagId')).toBe(createdTagData.id);
      
      expect(props.onTagAdded).toHaveBeenCalledWith(createdTagData, [...defaultCurrentTags, createdTagData]);
      
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/Search or create tag.../i)).not.toBeInTheDocument();
      });
    });
    
    it('does not show create option if tag name exists in suggestions', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      // mockTag2.name is 'Animal'
      await user.type(input, mockTag2.name); 

      await waitFor(() => {
        expect(screen.getByText(mockTag2.name)).toBeInTheDocument(); 
      });
      expect(screen.queryByText(`Create "${mockTag2.name}"`)).not.toBeInTheDocument();
    });

    it('does not show create option if tag name matches a current asset tag, shows "No tags found."', async () => {
      const { user } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      // defaultCurrentTags[0].name is 'Nature'
      await user.type(input, defaultCurrentTags[0].name); 

      await waitFor(() => {
        expect(screen.queryByText(defaultCurrentTags[0].name, { selector: 'div[cmdk-item]' })).not.toBeInTheDocument();
        expect(screen.queryByText(`Create "${defaultCurrentTags[0].name}"`)).not.toBeInTheDocument();
        // Corrected expectation based on previous analysis
        expect(screen.getByText(/No tags found./i)).toBeInTheDocument(); 
      });
    });
    
    it('shows error if createTag fails', async () => {
      mockCreateTag.mockResolvedValueOnce({ success: false, error: 'Tag creation utterly failed' });
      const { user, props } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, newTagName);
      
      const createOption = await screen.findByText(`Create "${newTagName}"`);
      await user.click(createOption);

      await waitFor(() => {
        expect(screen.getByText(/Error: Tag creation utterly failed/i)).toBeInTheDocument();
      });
      expect(mockAddTagToAsset).not.toHaveBeenCalled();
      expect(props.onTagAdded).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/Search or create tag.../i)).toBeInTheDocument(); 
    });

    it('shows error if addTagToAsset fails after successful createTag', async () => {
      mockCreateTag.mockResolvedValueOnce({ success: true, data: createdTagData });
      mockAddTagToAsset.mockResolvedValueOnce({ success: false, error: 'Association of new tag failed' });
      
      const { user, props } = renderTagEditor();
      const addButton = screen.getByRole('button', { name: /Add Tag/i });
      await user.click(addButton);

      const input = await screen.findByPlaceholderText(/Search or create tag.../i);
      await user.type(input, newTagName);
      
      const createOption = await screen.findByText(`Create "${newTagName}"`);
      await user.click(createOption);

      await waitFor(() => {
        // Match the text content flexibly due to potential newlines or structure within the <p> tag
        expect(screen.getByText((content, element) => 
          element?.tagName.toLowerCase() === 'p' && 
          content.startsWith('Error:') && 
          content.includes('Association of new tag failed')
        )).toBeInTheDocument();
      });
      expect(mockCreateTag).toHaveBeenCalledTimes(1);
      expect(mockAddTagToAsset).toHaveBeenCalledTimes(1);
      expect(props.onTagAdded).not.toHaveBeenCalled();
      expect(screen.getByPlaceholderText(/Search or create tag.../i)).toBeInTheDocument();
    });
  });
}); 