import { Metadata } from 'next';
import { ImageGeneratorMain } from '@/lib/image-generator/presentation/components';

export const metadata: Metadata = {
  title: 'AI Image Generator',
  description: 'Generate stunning images using AI-powered FLUX.1 model',
};

export default function ImageGeneratorPage() {
  return (
    <main className="flex-1 overflow-hidden">
      <ImageGeneratorMain />
    </main>
  );
} 