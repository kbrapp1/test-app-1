import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Infrastructure Layer - Mutation Hook
 * Single Responsibility: API mutations with optimistic updates
 */

// Hook for mutations with optimistic updates
export function useApiMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateQueries?: string[];
    optimisticUpdate?: {
      queryKey: string[];
      updater: (oldData: unknown, variables: TVariables) => unknown;
    };
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      // Optimistic update
      if (options.optimisticUpdate) {
        await queryClient.cancelQueries({ queryKey: options.optimisticUpdate.queryKey });
        const previousData = queryClient.getQueryData(options.optimisticUpdate.queryKey);
        queryClient.setQueryData(
          options.optimisticUpdate.queryKey,
          options.optimisticUpdate.updater(previousData, variables)
        );
        return { previousData };
      }
    },
    onError: (error, variables, context) => {
      // Rollback optimistic update on error
      if (options.optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(options.optimisticUpdate.queryKey, context.previousData);
      }
      options.onError?.(error as Error, variables);
    },
    onSuccess: (data, variables) => {
      options.onSuccess?.(data, variables);
    },
    onSettled: () => {
      // Invalidate and refetch related queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
  });
} 