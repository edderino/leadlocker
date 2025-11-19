"use client";

import { create } from "zustand";

export type Lead = {
  id: string;
  name: string;
  phone: string;
  source: string;
  description: string | null;
  status: 'NEW' | 'APPROVED' | 'COMPLETED';
  created_at: string;
  [key: string]: any;
};

type LeadsState = {
  orgId: string | null;
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;

  // actions
  setInitialLeads: (orgId: string, leads: Lead[]) => void;
  setLeads: (leads: Lead[]) => void;
  startLoading: () => void;
  setError: (msg: string | null) => void;
  reset: () => void;
};

export const useLeadsStore = create<LeadsState>((set) => ({
  orgId: null,
  leads: [],
  isLoading: false,
  error: null,
  lastFetched: null,

  setInitialLeads: (orgId, leads) =>
    set({
      orgId,
      leads: leads ?? [],
      lastFetched: Date.now(),
      error: null,
    }),

  setLeads: (leads) =>
    set({
      leads: leads ?? [],
      lastFetched: Date.now(),
      isLoading: false,
      error: null,
    }),

  startLoading: () =>
    set({
      isLoading: true,
      error: null,
    }),

  setError: (msg) =>
    set({
      isLoading: false,
      error: msg ?? null,
    }),

  reset: () =>
    set({
      orgId: null,
      leads: [],
      isLoading: false,
      error: null,
      lastFetched: null,
    }),
}));

