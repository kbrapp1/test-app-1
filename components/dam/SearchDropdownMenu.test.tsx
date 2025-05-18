import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchDropdownMenu } from './SearchDropdownMenu';
import type { CombinedItem } from '@/types/dam';

const mockOnSelect = vi.fn();
const mockOnViewAllResults = vi.fn();
const mockCloseDropdown = vi.fn();

describe('SearchDropdownMenu', () => {
  const defaultProps = {
    items: [],
    onSelect: mockOnSelect,
    isLoading: false,
    searchTermForDisplay: '',
    onViewAllResults: mockOnViewAllResults,
    closeDropdown: mockCloseDropdown,
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
    mockOnViewAllResults.mockClear();
    mockCloseDropdown.mockClear();
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
        ownerName: 'Mock Owner',
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
        ownerName: 'Mock Owner',
        parentFolderName: null,
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
        ownerName: 'Mock Owner',
        parentFolderName: null,
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="click" />);
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Click Me.png' }));
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
        ownerName: 'Mock Owner',
        parentFolderName: null,
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
        ownerName: 'Mock Owner',
        parentFolderName: null,
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="Another" />);
    fireEvent.mouseDown(screen.getByText(/Search for/));
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
        ownerName: 'Mock Owner',
        parentFolderName: null,
      },
    ];
    render(<SearchDropdownMenu {...defaultProps} items={items} searchTermForDisplay="" />);
    expect(screen.queryByText(/Search for/)).toBeNull();
  });

});