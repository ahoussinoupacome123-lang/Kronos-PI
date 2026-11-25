// Découpe du nom pour les logotypes : la base, puis le suffixe mis en valeur sur pastille lime.
import { BRAND } from "./brand";

const m = BRAND.name.match(/^(.*?)(PI|X)$/);
export const NOM_BASE = m ? m[1] : BRAND.name;
export const NOM_ACCENT = m ? m[2] : "";
