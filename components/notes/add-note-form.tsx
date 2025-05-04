'use client';

import React, { useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from "@/components/ui/textarea";
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastAction } from "@/components/ui/toast";
import { Loader2 } from 'lucide-react';
import { isRetriableError } from '@/lib/errors/factory';

// Assuming addNote action is passed as a prop or imported
// For this example, let's assume it's passed as a prop `serverAction`

// Type for the Server Action function signature expected by useFormState
type AddNoteAction = (
    prevState: any, 
    formData: FormData
) => Promise<{
    success: boolean;
    message: string;
    code?: string;
}>;

const initialState: Awaited<ReturnType<AddNoteAction>> = {
  success: false,
  message: '',
  code: undefined,
};

// Separate component for the submit button to use useFormStatus
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button 
      type="submit" 
      disabled={pending}
      aria-disabled={pending}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 ml-auto"
    >
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {pending ? 'Adding...' : 'Save Note'}
    </Button>
  );
}

interface AddNoteFormProps {
    addNoteAction: AddNoteAction;
    onFormSuccess?: () => void;
}

export function AddNoteForm({ addNoteAction, onFormSuccess }: AddNoteFormProps) {
  const [state, formAction] = useActionState(addNoteAction, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
          variant: 'default',
        });
        formRef.current?.reset();
        onFormSuccess?.();
      } else {
        const isRetryable = isRetriableError(state.code);
        toast({
          title: 'Error',
          description: state.message,
          variant: 'destructive',
          action: isRetryable ? (
            <ToastAction 
              altText="Retry"
              onClick={() => {
                  if (formRef.current) {
                      formAction(new FormData(formRef.current));
                  }
              }}
            >
              Retry
            </ToastAction>
          ) : undefined,
        });
      }
    }
  }, [state, toast, onFormSuccess, formAction]);

  useEffect(() => {
     setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 flex flex-col">
      <div className="space-y-1">
        <Label htmlFor="add-note-title">Title</Label>
        <Input
            id="add-note-title"
            name="title"
            placeholder="Note Title"
            required
            className="text-base"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="add-note-content">Content</Label>
        <Textarea 
            id="add-note-content"
            ref={textareaRef}
            name="content" 
            placeholder="Enter your note... (multi-line allowed)"
            className="min-h-[100px] flex-grow resize-none"
            aria-describedby="form-message"
            rows={4}
        />
      </div>
      <SubmitButton />
    </form>
  );
} 