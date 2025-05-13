import Replicate from 'replicate';

if (!process.env.REPLICATE_API_TOKEN) {
  // Log the error during initialization phase rather than throwing immediately,
  // to allow the app to potentially run parts that don't use Replicate.
  // Functions using the client should check its existence.
  console.error('CRITICAL SERVER ERROR: REPLICATE_API_TOKEN environment variable is not set.');
}

/**
 * Initialized Replicate client instance.
 * IMPORTANT: Check if this is defined before using, as it might be null if the API token is missing.
 */
export const replicateClient = process.env.REPLICATE_API_TOKEN
  ? new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    })
  : null; 