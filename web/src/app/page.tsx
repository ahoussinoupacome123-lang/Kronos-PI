// Page d'accueil. Le récit, de haut en bas : la promesse, à qui elle s'adresse, pourquoi
// lire une plainte ne suffit pas, comment ça marche, la preuve mesurée, pour qui,
// la confidentialité, puis l'appel au pilote.
import Cloture from "@/components/accueil/Cloture";
import Confidentialite from "@/components/accueil/Confidentialite";
import DefilementFluide from "@/components/accueil/DefilementFluide";
import Emetteurs from "@/components/accueil/Emetteurs";
import Fonctionnement from "@/components/accueil/Fonctionnement";
import Heros from "@/components/accueil/Heros";
import Navigation from "@/components/accueil/Navigation";
import Preuves from "@/components/accueil/Preuves";
import Recits from "@/components/accueil/Recits";
import Utilisatrice from "@/components/accueil/Utilisatrice";

export default function Accueil() {
  return (
    <DefilementFluide>
      <Navigation />
      <main>
        <Heros />
        <Emetteurs />
        <Recits />
        <Fonctionnement />
        <Preuves />
        <Utilisatrice />
        <Confidentialite />
      </main>
      <Cloture />
    </DefilementFluide>
  );
}
