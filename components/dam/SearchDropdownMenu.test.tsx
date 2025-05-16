import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import type { CombinedItem } from '@/types/dam';

const mockOnSelect = vi.fn();
const mockOnViewAllResults = vi.fn();

describe('SearchDropdownMenu', () => {
  const defaultProps = {
    items: [],
    onSelect: mockOnSelect,
    isLoading: false,
    searchTermForDisplay: '',
    onViewAllResults: mockOnViewAllResults,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnViewAllResults.mockClear();
  });

  test('renders loading state', () => {
    render(<SearchDropdownMenu {...defaultProps} isLoading={true} />);
    // Should display a loading indicator and text
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  test('renders no results message when searchTermForDisplay is present and items are empty', () => {
    render(<SearchDropdownMenu {...defaultProps} searchTermForDisplay="testquery" items={[]} />);
    // No results message should appear
    expect(screen.getByText(/No results found for/)).toBeInTheDocument();
    // The query should be highlighted in bold span
    const boldSpan = screen.getByText('testquery');
    expect(boldSpan).toHaveClass('font-semibold');
  });

  test('does not render no results message if searchTermForDisplay is empty', () => {
    render(<SearchDropdownMenu {...defaultProps} searchTermForDisplay="" items={[]} />);
    expect(screen.queryByText(/No results found for/)).toBeNull();
  });

  test('renders list of items (folders and assets)', () => {
    // Provide minimal valid CombinedItem objects
    const items: CombinedItem[] = [
      {
        id: 'folder1',
        name: 'My Folder',
        type: 'folder',
        user_id: 'user1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        parent_folder_id: null,
      },
      {
        id: 'file1',
        name: 'My File.jpg',
        type: 'asset',
        user_id: 'user1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/path',
        mime_type: 'image/jpeg',
        size: 123,
        folder_id: null,
        publicUrl: 'http://example.com/file',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="my" />);
    // Both item names should be rendered as buttons
    expect(screen.getByRole('button', { name: 'My Folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'My File.jpg' })).toBeInTheDocument();
    // There should be two selectable buttons
    const list = screen.getByRole('list');
    const buttons = within(list).getAllByRole('button', { name: /My /i });
    expect(buttons).toHaveLength(2);
  });

  test('calls onSelect when a dropdown item is clicked', () => {
    const items: CombinedItem[] = [
      {
        id: 'file1',
        name: 'Click Me.png',
        type: 'asset',
        user_id: 'user1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/click.png',
        mime_type: 'image/png',
        size: 123,
        folder_id: null,
        publicUrl: 'http://example.com/click.png',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="click" />);
    fireEvent.click(screen.getByRole('button', { name: 'Click Me.png' }));
    expect(mockOnSelect).toHaveBeenCalledTimes(1);
    expect(mockOnSelect).toHaveBeenCalledWith(items[0]);
  });

  test('renders search-all button when items are present and searchTermForDisplay has value', () => {
    const items: CombinedItem[] = [
      {
        id: 'file1',
        name: 'A File.txt',
        type: 'asset',
        user_id: 'u1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/afile.txt',
        mime_type: 'text/plain',
        size: 1,
        folder_id: null,
        publicUrl: 'http://example.com/afile.txt',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="A File" />);
    // Should render a search-for button
    expect(screen.getByText(/Search for/)).toBeInTheDocument();
  });

  test('calls onViewAllResults when "Search for" button is clicked', () => {
    const items: CombinedItem[] = [
      {
        id: 'file1',
        name: 'Another File.pdf',
        type: 'asset',
        user_id: 'u1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/another.pdf',
        mime_type: 'application/pdf',
        size: 1,
        folder_id: null,
        publicUrl: 'http://example.com/another.pdf',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="Another" />);
    fireEvent.click(screen.getByText(/Search for/));
    expect(mockOnViewAllResults).toHaveBeenCalledTimes(1);
  });

  test('does not render "Search for" button if searchTermForDisplay is empty', () => {
    const items: CombinedItem[] = [
      {
        id: 'file1',
        name: 'A File.txt',
        type: 'asset',
        user_id: 'u1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/afile.txt',
        mime_type: 'text/plain',
        size: 1,
        folder_id: null,
        publicUrl: 'http://example.com/afile.txt',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="" />);
    expect(screen.queryByText(/Search for/)).toBeNull();
  });

  test('highlights matching part of the item name', () => {
    const items: CombinedItem[] = [
      {
        id: 'file1',
        name: 'Important Document.pdf',
        type: 'asset',
        user_id: 'u1',
        organization_id: 'org1',
        created_at: '2021-01-01T00:00:00Z',
        storage_path: '/important.pdf',
        mime_type: 'application/pdf',
        size: 1,
        folder_id: null,
        publicUrl: 'http://example.com/important.pdf',
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="Doc" />);

    // Check that the full item name is rendered correctly with the highlighted part
    const fullItemNameButton = screen.getByRole('button', { name: /^Important Doc ument\.pdf$/i });
    
    // Get the span.truncate directly from the button
    const truncateSpan = fullItemNameButton.querySelector('span.truncate');
    expect(truncateSpan).toBeInTheDocument(); // Make sure it exists

    if (truncateSpan) {
        const childNodes = Array.from(truncateSpan.childNodes);
        
        // Expected: [TextNode("Important "), <span.font-semibold>Doc</span>, TextNode("ument.pdf")]
        expect(childNodes.length).toBe(3); // Ensure exactly 3 children

        // Child 0: TextNode "Important "
        expect(childNodes[0].nodeType).toBe(Node.TEXT_NODE);
        expect(childNodes[0].textContent).toBe('Important ');

        // Child 1: ElementNode <span class="font-semibold">Doc</span>
        expect(childNodes[1].nodeType).toBe(Node.ELEMENT_NODE);
        const highlightedSpan = childNodes[1] as HTMLElement;
        expect(highlightedSpan.tagName).toBe('SPAN');
        expect(highlightedSpan).toHaveClass('font-semibold');
        expect(highlightedSpan.textContent).toBe('Doc');

        // Child 2: TextNode "ument.pdf"
        expect(childNodes[2].nodeType).toBe(Node.TEXT_NODE);
        expect(childNodes[2].textContent).toBe('ument.pdf');
    } else {
        // This case should ideally not be reached if the previous expect(truncateSpan).toBeInTheDocument() passes.
        // But as a fallback, fail the test explicitly.
        throw new Error('span.truncate not found within the button');
    }
  });

});