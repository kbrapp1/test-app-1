import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const userId = formData.get('userId') as string;

    if (!files || files.length === 0) {
        return NextResponse.json({ error: 'No files provided.' }, { status: 400 });
    }
    if (!userId) {
        return NextResponse.json({ error: 'User ID not provided.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        console.error('Supabase URL or Service Role Key not set');
        return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { persistSession: false }
    });

    const uploadedAssetsData = [];
    let overallError: string | null = null;
    let storagePath: string | null = null;

    for (const file of files) {
        try {
            if (!file.type.startsWith('image/')) {
                console.warn(`API: Skipping non-image file: ${file.name}`);
                continue;
            }

            const uniqueSuffix = crypto.randomUUID();
            storagePath = `${userId}/${uniqueSuffix}-${file.name}`;

            const { data: storageData, error: storageError } = await supabaseAdmin.storage
                .from('assets')
                .upload(storagePath, file);

            if (storageError) throw new Error(`Storage Error (${file.name}): ${storageError.message}`);
            if (!storageData) throw new Error(`Storage Error (${file.name}): Upload failed silently.`);

            const { error: dbError } = await supabaseAdmin
                .from('assets')
                .insert({
                    user_id: userId,
                    name: file.name,
                    storage_path: storageData.path,
                    mime_type: file.type,
                    size: file.size,
                });

            if (dbError) {
                throw new Error(`Database Error (${file.name}): ${dbError.message}`);
            }

            uploadedAssetsData.push({
                name: file.name,
                storagePath: storageData.path,
                size: file.size,
                type: file.type,
            });

        } catch (error: any) {
            console.error("API Error processing file:", file.name, error);
            if (!overallError) {
                overallError = error.message || 'An unknown error occurred during upload.';
            }
            if (storagePath) {
                console.warn(`Attempting storage cleanup for path: ${storagePath} due to error: ${error.message}`);
                try {
                    await supabaseAdmin.storage.from('assets').remove([storagePath]);
                } catch (cleanupError: any) {
                    console.error(`Storage cleanup failed for ${storagePath}:`, cleanupError.message);
                }
            }
        }
    }

    if (overallError && uploadedAssetsData.length === 0) {
        return NextResponse.json({ error: overallError }, { status: 500 });
    } else if (overallError) {
        return NextResponse.json(
            { message: 'Some files uploaded successfully, some failed.', error: overallError, data: uploadedAssetsData },
            { status: 207 }
        );
    } else {
        return NextResponse.json({ message: 'Upload successful', data: uploadedAssetsData }, { status: 200 });
    }
} 