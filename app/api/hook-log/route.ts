import { NextRequest, NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';

async function detectRecentlyModifiedFile(): Promise<string | null> {
  try {
    const projectRoot = process.cwd();
    const cutoffTime = Date.now() - (30 * 1000); // 30 seconds ago
    
    async function scanDirectory(dir: string): Promise<string | null> {
      try {
        const entries = await readdir(dir, { withFileTypes: true });
        let mostRecentFile: { path: string; mtime: number } | null = null;
        
        for (const entry of entries) {
          const fullPath = join(dir, entry.name);
          
          // Skip certain directories
          if (entry.isDirectory() && 
              !['node_modules', '.git', '.next', 'dist', 'build'].includes(entry.name)) {
            const nestedResult = await scanDirectory(fullPath);
            if (nestedResult) return nestedResult;
          } else if (entry.isFile()) {
            const stats = await stat(fullPath);
            if (stats.mtime.getTime() > cutoffTime) {
              if (!mostRecentFile || stats.mtime.getTime() > mostRecentFile.mtime) {
                mostRecentFile = { path: fullPath, mtime: stats.mtime.getTime() };
              }
            }
          }
        }
        
        return mostRecentFile?.path || null;
      } catch {
        return null;
      }
    }
    
    return await scanDirectory(projectRoot);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Enhance the webhook data if we received literal text
    const enhancedBody = { ...body };
    
    if (body.file === '$file_path') {
      const detectedFile = await detectRecentlyModifiedFile();
      if (detectedFile) {
        enhancedBody.file = detectedFile;
        enhancedBody.file_detection = 'auto_detected_recent_change';
      } else {
        enhancedBody.file_detection = 'no_recent_files_found';
      }
    }
    
    if (body.timestamp === '$(date -Iseconds)') {
      enhancedBody.timestamp = new Date().toISOString();
      enhancedBody.timestamp_detection = 'auto_generated';
    }
    
    // Log only the essential file information
    const timestamp = new Date().toISOString();
    console.log(`\n🔗 CLAUDE WEBHOOK [${timestamp}]`);
    console.log(`📝 File changed: ${enhancedBody.file}`);
    console.log('─'.repeat(50));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hook log error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}