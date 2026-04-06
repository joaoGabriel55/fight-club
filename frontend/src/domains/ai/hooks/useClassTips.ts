import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";
import { aiService } from "../services/ai.service";
import type { ClassTipsRequest, ClassTipsResponse } from "../types/ai.types";

export function useClassTips() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: (data: ClassTipsRequest) => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();
      return aiService.requestClassTips(
        data,
        abortControllerRef.current.signal,
      ) as Promise<ClassTipsResponse>;
    },
  });

  const cancel = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    mutation.reset();
  };

  return {
    ...mutation,
    cancel,
  };
}
