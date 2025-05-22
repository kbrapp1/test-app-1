export interface IStorageService {
  /**
   * Uploads a file to storage and returns the storage path and public URL.
   * @param file - The file to upload
   * @param path - The target storage path (e.g., "orgId/userId/filename.ext")
   * @param upsert - Whether to overwrite the file if it already exists. Defaults to false.
   */
  uploadFile(file: File, path: string, upsert?: boolean): Promise<{ storagePath: string; publicUrl: string | null }>;

  /**
   * Removes a file from storage at the given path.
   * @param path - The storage path of the file to remove
   */
  removeFile(path: string): Promise<void>;

  /**
   * Gets a signed URL for downloading a file with time-limited access.
   * @param path - The storage path of the file
   * @param expirySeconds - Number of seconds the URL will be valid
   * @param forceDownload - When true, sets Content-Disposition: attachment to force browser download
   * @param fileName - Optional name to use for the downloaded file instead of the storage path
   * @returns A string containing the signed URL
   */
  getSignedUrl(
    path: string, 
    expirySeconds: number, 
    forceDownload?: boolean,
    fileName?: string
  ): Promise<string>;

  /**
   * Downloads a file from storage as a Blob.
   * @param path - The storage path of the file
   * @returns A Promise resolving to the Blob content of the file
   */
  downloadFileAsBlob(path: string): Promise<Blob>;
} 