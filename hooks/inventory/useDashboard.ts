"use client";

import { useQuery } from "@tanstack/react-query";

import { CACHE_STRATEGIES } from "@/app/providers";
import { apiGet } from "@/lib/http/apiClient";
import type { DashboardData } from "@/types/inventory";

export const useDashboard = () =>
  useQuery({
    queryKey: ["dashboard"],
    queryFn: async () =>
      (await apiGet<DashboardData>("/api/dashboard")).data,
    ...CACHE_STRATEGIES.dynamic,
  });
