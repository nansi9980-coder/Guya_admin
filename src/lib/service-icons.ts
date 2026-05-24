import {
  Settings,
  Compass,
  HardHat,
  Home,
  Zap,
  Server,
  Wifi,
  PenTool,
  Wrench,
  Cable,
  Building2,
  Network,
  Shield,
  MapPin,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react'

export type ServiceIconOption = {
  value: string
  label: string
  Icon: LucideIcon
}

/** Icônes proposées dans le formulaire Services (valeur = clé Lucide, affichée sur le site). */
export const SERVICE_ICON_OPTIONS: ServiceIconOption[] = [
  { value: 'Settings', label: 'Ingénierie / Paramètres', Icon: Settings },
  { value: 'Compass', label: 'Études / Conception', Icon: Compass },
  { value: 'PenTool', label: 'Plans / Design', Icon: PenTool },
  { value: 'HardHat', label: 'Déploiement / Chantier', Icon: HardHat },
  { value: 'Cable', label: 'Fibre / Câblage', Icon: Cable },
  { value: 'Wifi', label: 'FTTH / Connexion', Icon: Wifi },
  { value: 'Home', label: 'Particulier / Raccordement', Icon: Home },
  { value: 'Building2', label: 'Immeuble / FTTB', Icon: Building2 },
  { value: 'Server', label: 'Entreprise / FTTO', Icon: Server },
  { value: 'Network', label: 'Infrastructure réseau', Icon: Network },
  { value: 'Zap', label: 'Maintenance / Dépannage', Icon: Zap },
  { value: 'Wrench', label: 'Support technique', Icon: Wrench },
  { value: 'Shield', label: 'Sécurité / Garantie', Icon: Shield },
  { value: 'MapPin', label: 'Terrain / Localisation', Icon: MapPin },
  { value: 'Lightbulb', label: 'Innovation / Solution', Icon: Lightbulb },
]

export function getServiceIconOption(value?: string | null) {
  return SERVICE_ICON_OPTIONS.find(o => o.value === value)
}
