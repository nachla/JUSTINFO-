import { apiFetch } from "./api";

export const getRingkasan = () => apiFetch("/data/ringkasan");
export const getWilayah = () => apiFetch("/data/wilayah");
export const getProfil = () => apiFetch("/data/profil");
export const getKg = () => apiFetch("/data/kg");
