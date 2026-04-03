import { useQuery } from "@tanstack/react-query";
import { classesService } from "../services/classes.service";

export function useClass(id: string) {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => classesService.getClass(id),
    enabled: !!id,
  });
}
