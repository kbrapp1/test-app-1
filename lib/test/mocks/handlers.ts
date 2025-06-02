import { http, HttpResponse } from 'msw';

export const handlers = [
  // DAM API handlers
  http.delete('/api/dam/asset/:assetId', () => {
    return HttpResponse.json({ success: true, message: 'Asset deleted successfully' });
  }),

  http.post('/api/dam/asset/bulk-move', () => {
    return HttpResponse.json({ success: true, message: 'Assets moved successfully' });
  }),

  http.get('/api/dam/asset/:assetId', () => {
    return HttpResponse.json({
      id: 'test-asset-1',
      name: 'Test Asset',
      fileType: 'image/jpeg',
      fileSize: 1024000,
      createdAt: '2024-01-01T00:00:00Z',
    });
  }),

  // Folder API handlers
  http.get('/api/dam/folders', () => {
    return HttpResponse.json([
      { id: 'folder-1', name: 'Test Folder 1', parentFolderId: null },
      { id: 'folder-2', name: 'Test Folder 2', parentFolderId: 'folder-1' },
    ]);
  }),

  // Team API handlers
  http.post('/api/team/upload', () => {
    return HttpResponse.json({ success: true, message: 'Team member added successfully' });
  }),

  // Auth API handlers (for other tests)
  http.post('/api/auth/signin', () => {
    return HttpResponse.json({ success: true });
  }),

  // Default fallback for unhandled requests
  http.all('*', (req) => {
    console.warn(`Found an unhandled ${req.request.method} request to ${req.request.url}`);
    return new HttpResponse(null, { status: 404 });
  }),
]; 