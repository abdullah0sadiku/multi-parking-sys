import { useQuery } from "@tanstack/react-query"
import { invoicesService } from "@/lib/services/invoices.service"
import type { QueryParams } from "@/types"

export const INVOICES_KEY = "invoices"

export function useInvoices(params?: QueryParams) {
  return useQuery({
    queryKey: [INVOICES_KEY, params],
    queryFn: () => invoicesService.getAll(params),
  })
}

export function useInvoice(id: number) {
  return useQuery({
    queryKey: [INVOICES_KEY, id],
    queryFn: () => invoicesService.getById(id),
    enabled: !!id,
  })
}
