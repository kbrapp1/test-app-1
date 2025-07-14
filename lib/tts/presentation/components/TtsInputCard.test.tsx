import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useForm, FormProvider } from 'react-hook-form';
import { vi } from 'vitest';
import { TtsInputCard } from './TtsInputCard';
import { ttsProvidersConfig } from '../../infrastructure/providers/ttsProviderConfig';
import { z } from 'zod';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock VoiceSelector to simplify interaction
vi.mock('./VoiceSelector', () => ({
  VoiceSelector: ({ field }: { field: { value: string; onChange: (value: string) => void } }) => (
    <input
      data-testid="voice-selector"
      value={field.value}
      onChange={e => field.onChange(e.target.value)}
    />
  ),
}));

describe('TtsInputCard', () => {
  const defaultProvider = Object.keys(ttsProvidersConfig)[0];
  const defaultValues = { inputText: '', voiceId: '', provider: defaultProvider };
  const onSubmit = vi.fn();
  const handleSaveText = vi.fn();
  const handleSaveTextAs = vi.fn();
  const onLoadFromLibraryClick = vi.fn();

  function renderComponent() {
    // Wrapper component to use hooks and tooltip context
    const Wrapper = () => {
      const methods = useForm({ defaultValues, resolver: zodResolver(z.object({
        inputText: z.string().min(1),
        voiceId: z.string().min(1),
        provider: z.string().min(1),
      })) });
      return (
        <TooltipProvider>
          <FormProvider {...methods}>
            <TtsInputCard
              form={methods}
              onSubmit={onSubmit}
              isProcessing={false}
              isGenerating={false}
              isTextActionLoading={false}
              sourceAssetId={null}
              originalLoadedText={null}
              currentInputText={''}
              handleSaveText={handleSaveText}
              handleSaveTextAs={handleSaveTextAs}
              onLoadFromLibraryClick={onLoadFromLibraryClick}
            />
          </FormProvider>
        </TooltipProvider>
      );
    };
    render(<Wrapper />);
  }

  it('renders text area, voice selector, provider select, and generate button', () => {
    renderComponent();
    expect(screen.getByLabelText(/Text to Convert/)).toBeInTheDocument();
    expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
    // Verify provider select is rendered with label 'Provider'
    expect(screen.getByRole('combobox', { name: /Provider/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Speech/ })).toBeInTheDocument();
  });

  it('shows validation errors if submitted empty', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /Generate Speech/ }));
    await waitFor(() => {
      const msgs = screen.getAllByText(/must contain at least 1 character/);
      expect(msgs).toHaveLength(2);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with form values when valid', async () => {
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/enter the text you want to convert to speech/i), { target: { value: 'Hello' } });
    fireEvent.change(screen.getByTestId('voice-selector'), { target: { value: 'voice-1' } });
    // select provider: since default is already set, no need to change
    fireEvent.click(screen.getByRole('button', { name: /Generate Speech/ }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          inputText: 'Hello',
          voiceId: 'voice-1',
          provider: defaultProvider,
        }),
        expect.anything()
      );
    });
  });
});

// Helper for zodResolver
import { zodResolver } from '@hookform/resolvers/zod'; 