import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, type Mock } from 'vitest';
import { DamPageClientView } from './DamPageClientView';
import type { BreadcrumbItemData } from './dam-breadcrumbs';
import type { SortByValue, SortOrderValue } from './hooks/useDamFilters';

// Mock next/navigation
const mockRouterPush = vi.fn();
const mockSearchParamsGet = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: mockSearchParamsGet,
    toString: vi.fn(() => ''),
  }),
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
  }),
  usePathname: () => '/',
}));

// Mock child components
vi.mock('./dam-breadcrumbs', () => ({
  DamBreadcrumbs: ({ path }: { path: BreadcrumbItemData[] }) => (
    <div data-testid="dam-breadcrumbs">{path?.map(p => p.name).join('/')}</div>
  ),
}));

vi.mock('./AssetGalleryClient', () => ({
  AssetGalleryClient: (props: any) => <div data-testid="asset-gallery-client">ViewMode: {props.viewMode} Folder: {props.currentFolderId} Search: {props.searchTerm}</div>,
}));

// Mock functions for useDamFilters return values - defined before child component mocks that might use them.
const mockSetFilterType = vi.fn();
const mockSetFilterCreationDateOption = vi.fn();
const mockSetFilterOwnerId = vi.fn();
const mockSetFilterSizeOption = vi.fn();
const mockSetSortBy = vi.fn();
const mockSetSortOrder = vi.fn();
const mockClearAllFilters = vi.fn();

vi.mock('./filters/TypeFilter', () => ({
  TypeFilter: ({ selectedType }: any) => ( // onTypeChange prop is passed by component, but mock calls global mockSetFilterType
    <button data-testid="type-filter" onClick={() => mockSetFilterType('image')}>
      Type: {selectedType || 'any'}
    </button>
  ),
}));

vi.mock('./filters/CreationDateFilter', () => ({
  CreationDateFilter: ({ selectedOption }: any) => ( // onOptionChange prop is passed, mock calls global mockSetFilterCreationDateOption
    <button data-testid="date-filter" onClick={() => mockSetFilterCreationDateOption('today')}>
      Date: {selectedOption || 'anytime'}
    </button>
  ),
}));

vi.mock('./filters/OwnerFilter', () => ({
  OwnerFilter: ({ selectedOwnerId }: any) => ( // onOwnerChange prop is passed, mock calls global mockSetFilterOwnerId
    <button data-testid="owner-filter" onClick={() => mockSetFilterOwnerId('owner1')}>
      Owner: {selectedOwnerId || 'anyone'}
    </button>
  ),
}));

vi.mock('./filters/SizeFilter', () => ({
  SizeFilter: ({ selectedOption }: any) => ( // onOptionChange prop is passed, mock calls global mockSetFilterSizeOption
    <button data-testid="size-filter" onClick={() => mockSetFilterSizeOption('small')}>
      Size: {selectedOption || 'anysize'}
    </button>
  ),
}));

vi.mock('./filters/SortControl', () => ({
  SortControl: ({ currentSortBy, currentSortOrder }: any) => ( // onSortChange prop is passed, mock calls global mockSetSortBy/Order
    <button data-testid="sort-control" onClick={() => { mockSetSortBy('name'); mockSetSortOrder('asc'); }}>
      Sort: {currentSortBy || 'default'} - {currentSortOrder || 'default'}
    </button>
  ),
}));

// Define a more accurate type for the mock, aligning with UseDamFiltersReturn
type MockUseDamFiltersReturn = {
  filterType: string | undefined;
  setFilterType: (value: string | undefined) => void;
  filterCreationDateOption: string | undefined;
  setFilterCreationDateOption: (option: string | undefined, startDate?: string, endDate?: string) => void;
  filterDateStart: string | undefined;
  filterDateEnd: string | undefined;
  filterOwnerId: string | undefined;
  setFilterOwnerId: (value: string | undefined) => void;
  filterSizeOption: string | undefined;
  setFilterSizeOption: (option: string | undefined, minSize?: number, maxSize?: number) => void;
  filterSizeMin: string | undefined;
  filterSizeMax: string | undefined;
  sortBy: SortByValue | undefined;
  setSortBy: (value: SortByValue | undefined) => void;
  sortOrder: SortOrderValue | undefined;
  setSortOrder: (value: SortOrderValue | undefined) => void;
  currentTagIds: string | undefined;
  isAnyFilterActive: boolean;
  clearAllFilters: () => void;
};

// Declare mockUseDamFilters before vi.mock
let mockUseDamFilters: Mock; // Use the imported Mock type

vi.mock('./hooks/useDamFilters', () => ({
  useDamFilters: (...args: any[]) => mockUseDamFilters(...args), // Ensure it's callable like the original hook
}));

// Mock localStorage
const mockLocalStorageGetItem = vi.fn();
const mockLocalStorageSetItem = vi.fn();
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: mockLocalStorageGetItem,
    setItem: mockLocalStorageSetItem,
  },
  writable: true,
});

// Mock global fetch
let mockedFetch: Mock;

describe('DamPageClientView', () => {
  const initialProps = {
    initialCurrentFolderId: 'root',
    initialCurrentSearchTerm: '',
    breadcrumbPath: [{ id: 'root', name: 'Root', href: '/dam?folderId=root' }],
  };

  beforeEach(() => {
    vi.clearAllMocks(); 

    mockUseDamFilters = vi.fn((): MockUseDamFiltersReturn => ({
      filterType: undefined,
      setFilterType: mockSetFilterType,
      filterCreationDateOption: undefined,
      setFilterCreationDateOption: mockSetFilterCreationDateOption,
      filterDateStart: undefined,
      filterDateEnd: undefined,
      filterOwnerId: undefined,
      setFilterOwnerId: mockSetFilterOwnerId,
      filterSizeOption: undefined,
      setFilterSizeOption: mockSetFilterSizeOption,
      filterSizeMin: undefined,
      filterSizeMax: undefined,
      sortBy: undefined,
      setSortBy: mockSetSortBy,
      sortOrder: undefined,
      setSortOrder: mockSetSortOrder,
      currentTagIds: undefined,
      isAnyFilterActive: false,
      clearAllFilters: mockClearAllFilters,
    }));

    mockedFetch = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).endsWith('/api/team/members')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ members: [{ id: 'member1', name: 'Team Member 1' }] }),
        } as Response);
      }
      return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({error: 'Not found'}) } as Response);
    });
    vi.stubGlobal('fetch', mockedFetch);
    
    mockLocalStorageGetItem.mockReturnValue(null); 
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders initial layout and fetches members', async () => {
    render(<DamPageClientView {...initialProps} />);

    await waitFor(() => expect(screen.getByTestId('dam-breadcrumbs')).toHaveTextContent('Root'));
    await waitFor(() => expect(screen.getByTestId('asset-gallery-client')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('type-filter')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('date-filter')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('owner-filter')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('size-filter')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByTestId('sort-control')).toBeInTheDocument());

    await waitFor(() => {
      expect(mockedFetch).toHaveBeenCalledWith('/api/team/members');
    });
    await waitFor(() => expect(mockUseDamFilters).toHaveBeenCalled()); 
    await waitFor(() => expect(mockLocalStorageGetItem).toHaveBeenCalledWith('damViewMode'));
  });
  
  test('displays search term results instead of breadcrumbs when searchTerm is present', async () => {
    render(<DamPageClientView {...initialProps} initialCurrentSearchTerm="cats" />);
    await waitFor(() => expect(screen.queryByTestId('dam-breadcrumbs')).not.toBeInTheDocument());
    
    await waitFor(() => {
      const searchResultsTextContainer = screen.getByText((content, node) => {
        const hasText = (n: Element) => n.textContent === 'Showing search results for "cats".Clear search';
        const nodeHasText = node ? hasText(node) : false;
        const childrenDontHaveText = Array.from(node?.children || []).every(child => !hasText(child));
        return nodeHasText && childrenDontHaveText;
      });
      expect(searchResultsTextContainer).toBeInTheDocument();
    });
    await waitFor(() => expect(screen.getByText('Clear search').closest('a')).toHaveAttribute('href', '/dam?folderId=root'));
  });
  
  test('initializes viewMode from localStorage if present', async () => {
    mockLocalStorageGetItem.mockReturnValue('list');
    render(<DamPageClientView {...initialProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('asset-gallery-client')).toHaveTextContent('ViewMode: list');
    });
  });

  test('defaults to grid viewMode if localStorage is empty', async () => {
    render(<DamPageClientView {...initialProps} />);
    await waitFor(() => {
      expect(screen.getByTestId('asset-gallery-client')).toHaveTextContent('ViewMode: grid');
    });
  });
  
  test('clicking type filter calls setFilterType from useDamFilters', async () => {
    render(<DamPageClientView {...initialProps} />);
    fireEvent.click(screen.getByTestId('type-filter'));
    await waitFor(() => expect(mockSetFilterType).toHaveBeenCalledWith('image'));
  });

  test('clicking date filter calls setFilterCreationDateOption from useDamFilters', async () => {
    render(<DamPageClientView {...initialProps} />);
    fireEvent.click(screen.getByTestId('date-filter'));
    await waitFor(() => expect(mockSetFilterCreationDateOption).toHaveBeenCalledWith('today'));
  });
  
  test('clicking owner filter calls setFilterOwnerId from useDamFilters', async () => {
    render(<DamPageClientView {...initialProps} />);
    fireEvent.click(screen.getByTestId('owner-filter'));
    await waitFor(() => expect(mockSetFilterOwnerId).toHaveBeenCalledWith('owner1'));
  });

  test('clicking size filter calls setFilterSizeOption from useDamFilters', async () => {
    render(<DamPageClientView {...initialProps} />);
    fireEvent.click(screen.getByTestId('size-filter'));
    await waitFor(() => expect(mockSetFilterSizeOption).toHaveBeenCalledWith('small'));
  });
  
  test('clicking sort control calls setSortBy and setSortOrder via handleSortChange', async () => {
    render(<DamPageClientView {...initialProps} />);
    fireEvent.click(screen.getByTestId('sort-control'));
    await waitFor(() => expect(mockSetSortBy).toHaveBeenCalledWith('name'));
    await waitFor(() => expect(mockSetSortOrder).toHaveBeenCalledWith('asc'));
  });

  test('clear all filters button calls clearAllFilters from useDamFilters when active', async () => {
    mockUseDamFilters.mockImplementation((): MockUseDamFiltersReturn => ({
      filterType: 'image', 
      setFilterType: mockSetFilterType,
      filterCreationDateOption: undefined,
      setFilterCreationDateOption: mockSetFilterCreationDateOption,
      filterDateStart: undefined,
      filterDateEnd: undefined,
      filterOwnerId: undefined,
      setFilterOwnerId: mockSetFilterOwnerId,
      filterSizeOption: undefined,
      setFilterSizeOption: mockSetFilterSizeOption,
      filterSizeMin: undefined,
      filterSizeMax: undefined,
      sortBy: undefined,
      setSortBy: mockSetSortBy,
      sortOrder: undefined,
      setSortOrder: mockSetSortOrder,
      currentTagIds: undefined,
      isAnyFilterActive: true, 
      clearAllFilters: mockClearAllFilters,
    }));

    render(<DamPageClientView {...initialProps} />);
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    expect(clearButton).toBeInTheDocument();
    fireEvent.click(clearButton);
    await waitFor(() => expect(mockClearAllFilters).toHaveBeenCalledTimes(1));
  });

  test('clear all filters button is not present when no filters are active', async () => {
    render(<DamPageClientView {...initialProps} />); 
    await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument();
    });
  });

}); 