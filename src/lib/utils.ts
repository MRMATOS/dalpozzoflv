import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizarTexto(texto: string): string {
  if (!texto) return '';
  return texto
    .toString()
    .toLowerCase()
    .normalize('NFD') // Separa caracteres dos acentos
    .replace(/[\u0300-\u036f]/g, ''); // Remove os acentos
}
