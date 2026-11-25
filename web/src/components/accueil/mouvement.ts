"use client";
// Enregistrement unique des plugins GSAP pour la page d'accueil.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Courbe d'arrivée commune : rapide au départ, très douce à la fin. */
export const ARRIVEE = "expo.out";

/** Condition sous laquelle on anime : jamais si le visiteur demande moins de mouvement. */
export const AVEC_MOUVEMENT = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, useGSAP };
