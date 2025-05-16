import React from 'react';
import { vi } from 'vitest';
// Mock child components before importing the component under test
vi.mock('./DamSearchBar', () => {
  const React = require('react');
  return {
    DamSearchBar: (props: any) => <div data-testid="search-bar" data-current-folder-id={props.currentFolderId ?? ''} data-gallery-search-term={props.gallerySearchTerm} />,
  };
});
vi.mock('./AssetGalleryClient', () => {
  const React = require('react');
  return {
    AssetGalleryClient: (props: any) => <div data-testid="gallery" data-view-mode={props.viewMode} />,
  };
});
import { render, screen, fireEvent } from '@testing-library/react';
import { DamPageClientView } from './DamPageClientView';

describe('DamPageClientView', () => {
  beforeEach(() => {
    // Clear mock state if needed
  });

  test('renders DamSearchBar and AssetGalleryClient', () => {
    render(<DamPageClientView initialCurrentFolderId={null} initialCurrentSearchTerm="" />);
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('gallery')).toBeInTheDocument();
  });

  test('toggles view mode between list and grid', () => {
    render(<DamPageClientView initialCurrentFolderId={null} initialCurrentSearchTerm="" />);
    const listButton = screen.getByRole('radio', { name: /list view/i });
    const gridButton = screen.getByRole('radio', { name: /grid view/i });
    const gallery = screen.getByTestId('gallery');

    // Default view is grid: check data attribute on gallery
    expect(gallery).toHaveAttribute('data-view-mode', 'grid');

    // Click list view and assert gallery updates
    fireEvent.click(listButton);
    expect(gallery).toHaveAttribute('data-view-mode', 'list');

    // Click grid view and assert gallery updates
    fireEvent.click(gridButton);
    expect(gallery).toHaveAttribute('data-view-mode', 'grid');
  });

  // Additional tests around search-bar data attributes can be added here
}); 