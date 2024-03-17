import { useMutation } from "convex/react";
import { useState } from "react";

export const useApiMutation = (mutationfunc: any) => {
  const [pending, setPending] = useState(false);
  const apiMutation = useMutation(mutationfunc);

  const mutate = async (payload: any) => {
    setPending(true);
    try {
      try {
        const result = await apiMutation(payload);
        return result;
      } catch (error) {
        throw error;
      }
    } finally {
      return setPending(true);
    }
    
  };

  return {
    mutate,
    pending,
  };
};
