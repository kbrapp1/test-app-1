import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DamSearchBar } from './DamSearchBar';

// Mocks
const mockUseRouter = vi.fn();
const mockUseSearchParams = vi.fn();
const mockUseDamSearchInput = vi.fn();
const mockUseDamSearchDropdown = vi.fn();
const mockUseDamUrlManager = vi.fn();
const mockUseDamTagFilterHandler = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
  useSearchParams: () => mockUseSearchParams(),
}));

vi.mock('./hooks/useDamSearchInput', () => ({
  useDamSearchInput: (...args: any[]) => mockUseDamSearchInput(...args),
}));

vi.mock('./hooks/useDamSearchDropdown', () => ({
  useDamSearchDropdown: (...args: any[]) => mockUseDamSearchDropdown(...args),
}));

vi.mock('@/lib/hooks/useDamUrlManager', () => ({
  useDamUrlManager: () => mockUseDamUrlManager(),
}));

vi.mock('./hooks/useDamTagFilterHandler', () => ({
  useDamTagFilterHandler: (...args: any[]) => mockUseDamTagFilterHandler(...args),
}));

vi.mock('./SearchDropdownMenu', () => ({
  SearchDropdownMenu: vi.fn(({ items, isLoading, onSelect, onViewAllResults, closeDropdown, searchTermForDisplay }) => (
    <div data-testid="search-dropdown-menu">
      <button data-testid="dropdown-view-all" onClick={() => onViewAllResults()}></button>
      <button data-testid="dropdown-close" onClick={() => closeDropdown()}></button>
      {items.map((item: any, index: number) => (
        <button key={index} data-testid={`dropdown-item-${item.id || index}`} onClick={() => onSelect(item)}>{item.name}</button>
      ))}
      {isLoading && <p>Loading...</p>}
      <p>Search term: {searchTermForDisplay}</p>
    </div>
  )),
}));

vi.mock('./DamTagFilter', () => ({
  DamTagFilter: vi.fn(({ activeOrgId, initialSelectedTagIdsFromUrl, onFilterChange }) => (
    <div data-testid="dam-tag-filter">
      <p>Org ID: {activeOrgId}</p>
      <button data-testid="tag-filter-change" onClick={() => onFilterChange(new Set(['tag1']))}></button>
      <p>Selected Tags: {Array.from(initialSelectedTagIdsFromUrl).join(',')}</p>
    </div>
  )),
}));

vi.mock('./DamUploadButton', () => ({
  DamUploadButton: vi.fn(({ currentFolderId }) => (
    <div data-testid="dam-upload-button">
      <p>Folder ID: {currentFolderId}</p>
    </div>
  )),
}));

// Mock lucide-react icons
vi.mock('lucide-react', async () => {
  const actual = await vi.importActual('lucide-react');
  return {
    ...actual,
    Search: () => <div data-testid="search-icon" />,
    UploadCloud: () => <div data-testid="upload-icon" />,
    XIcon: () => <div data-testid="x-icon" />,
  };
});

// Default mock implementations
let mockRouterPush = vi.fn();
let mockSetSearchInputTerm = vi.fn();
let mockSetDebouncedSearchTerm = vi.fn();
let mockSetIsDropdownOpen = vi.fn();
let mockSetSearchAndFolder = vi.fn();
let mockClearSearchPreserveContext = vi.fn();
let mockNavigateToFolder = vi.fn();
let mockSetTagsPreserveContext = vi.fn();
let mockHandleTagFilterChange = vi.fn();

describe('DamSearchBar', () => {
  const defaultProps = {
    currentFolderId: 'folder123',
    gallerySearchTerm: '',
  };

  beforeEach(() => {
    mockRouterPush = vi.fn();
    mockSetSearchInputTerm = vi.fn();
    mockSetDebouncedSearchTerm = vi.fn();
    mockSetIsDropdownOpen = vi.fn();
    mockSetSearchAndFolder = vi.fn();
    mockClearSearchPreserveContext = vi.fn();
    mockNavigateToFolder = vi.fn();
    mockSetTagsPreserveContext = vi.fn();
    mockHandleTagFilterChange = vi.fn();

    mockUseRouter.mockReturnValue({ push: mockRouterPush });
    mockUseSearchParams.mockReturnValue(new URLSearchParams()); // Default empty search params

    mockUseDamSearchInput.mockReturnValue({
      searchInputTerm: '',
      setSearchInputTerm: mockSetSearchInputTerm,
      debouncedSearchTerm: '',
      setDebouncedSearchTerm: mockSetDebouncedSearchTerm,
    });

    mockUseDamSearchDropdown.mockReturnValue({
      isDropdownOpen: false,
      dropdownResults: [],
      isDropdownLoading: false,
      setIsDropdownOpen: mockSetIsDropdownOpen,
    });

    mockUseDamUrlManager.mockReturnValue({
      setSearchAndFolder: mockSetSearchAndFolder,
      clearSearchPreserveContext: mockClearSearchPreserveContext,
      navigateToFolder: mockNavigateToFolder,
      setTagsPreserveContext: mockSetTagsPreserveContext,
    });

    mockUseDamTagFilterHandler.mockReturnValue({
      activeOrgId: 'org123',
      selectedTagIdsFromUrl: new Set(),
      handleTagFilterChange: mockHandleTagFilterChange,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders correctly with initial props', () => {
    render(<DamSearchBar {...defaultProps} />);
    expect(screen.getByPlaceholderText('Search all assets & folders...')).toBeInTheDocument();
    expect(screen.getByTestId('dam-tag-filter')).toBeInTheDocument();
    expect(screen.getByTestId('dam-upload-button')).toBeInTheDocument();
    expect(screen.getByTestId('search-icon')).toBeInTheDocument();
  });

  describe('Search Input interactions', () => {
    it('updates search input term on change and calls setSearchInputTerm', () => {
      render(<DamSearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search all assets & folders...');
      fireEvent.change(input, { target: { value: 'test search' } });
      expect(mockSetSearchInputTerm).toHaveBeenCalledWith('test search');
    });

    it('calls handleClearSearch when input is cleared by typing', () => {
      // Simulate initial state with some search term
      mockUseDamSearchInput.mockReturnValueOnce({
        searchInputTerm: 'initial',
        setSearchInputTerm: mockSetSearchInputTerm,
        debouncedSearchTerm: 'initial',
        setDebouncedSearchTerm: mockSetDebouncedSearchTerm,
      });
      render(<DamSearchBar {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search all assets & folders...');
      fireEvent.change(input, { target: { value: '' } }); 
      // handleClearSearch calls these
      expect(mockSetSearchInputTerm).toHaveBeenCalledWith(''); // From the input change itself
      expect(mockSetSearchInputTerm).toHaveBeenCalledTimes(2); // Once for direct input, once from handleClearSearch
      expect(mockSetDebouncedSearchTerm).toHaveBeenCalledWith('');
      expect(mockSetIsDropdownOpen).toHaveBeenCalledWith(false);
      expect(mockClearSearchPreserveContext).toHaveBeenCalledWith(defaultProps.currentFolderId);
    });

    it('shows clear button when searchInputTerm is present and calls handleClearSearch on click', () => {
      mockUseDamSearchInput.mockReturnValueOnce({
        searchInputTerm: 'test search',
        setSearchInputTerm: mockSetSearchInputTerm,
        debouncedSearchTerm: 'test search',
        setDebouncedSearchTerm: mockSetDebouncedSearchTerm,
      });
      render(<DamSearchBar {...defaultProps} />);
      const clearButton = screen.getByRole('button', { name: 'Clear search' });
      expect(clearButton).toBeInTheDocument();
      fireEvent.click(clearButton);

      expect(mockSetSearchInputTerm).toHaveBeenCalledWith('');
      expect(mockSetDebouncedSearchTerm).toHaveBeenCalledWith('');
      expect(mockSetIsDropdownOpen).toHaveBeenCalledWith(false);
      expect(mockClearSearchPreserveContext).toHaveBeenCalledWith(defaultProps.currentFolderId);
    });

    it('does not show clear button when searchInputTerm is empty', () => {
      render(<DamSearchBar {...defaultProps} />);
      expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    });

    it('calls handleMainSearch on form submit', () => {
      const searchTerm = 'submitted search';
      mockUseDamSearchInput.mockReturnValueOnce({
        searchInputTerm: searchTerm,
        setSearchInputTerm: mockSetSearchInputTerm,
        debouncedSearchTerm: searchTerm, // Assume debounced is same for simplicity here
        setDebouncedSearchTerm: mockSetDebouncedSearchTerm,
      });
      render(<DamSearchBar {...defaultProps} />);
      const form = screen.getByRole('searchbox').closest('form') as HTMLFormElement;
      fireEvent.submit(form);

      expect(mockSetSearchInputTerm).toHaveBeenCalledWith(searchTerm.trim());
      expect(mockSetDebouncedSearchTerm).toHaveBeenCalledWith(searchTerm.trim());
      expect(mockSetIsDropdownOpen).toHaveBeenCalledWith(false);
      // expect(mockSetInputFocused).toHaveBeenCalledWith(false); // Cannot directly test useState setters unless exposed
      // expect(mockSetDropdownDisabled).toHaveBeenCalledWith(true); // Cannot directly test useState setters
      expect(mockSetSearchAndFolder).toHaveBeenCalledWith(searchTerm.trim(), defaultProps.currentFolderId);
    });
  });

  // More tests will go here
}); 