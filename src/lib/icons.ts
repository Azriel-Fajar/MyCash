import {
  Baby, Banknote, Bike, BookOpen, Briefcase, Bus, Car, Church, Cigarette, CircleEllipsis, Code, Coffee,
  Cookie, Droplet, Dumbbell, Fish, Fuel, Gamepad2, Gem, Gift, GraduationCap, Hammer, HandCoins, Heart,
  HeartPulse, House, Landmark, Laptop, Music, PartyPopper, PawPrint, PiggyBank, Pill, Plane, Popcorn,
  Receipt, Scissors, Shield, Shirt, ShoppingBag, ShoppingBasket, Smartphone, Sofa, Soup, Sparkles,
  SquareParking, Stethoscope, Store, TrendingUp, Tv, Utensils, Wallet, Wifi, Wrench, Zap,
  type LucideIcon,
} from 'lucide-react'

/** Icons selectable for categories/wallets. Stored in the DB by their kebab-case key. */
export const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, soup: Soup, coffee: Coffee, 'shopping-basket': ShoppingBasket, cookie: Cookie,
  car: Car, fuel: Fuel, 'square-parking': SquareParking, bike: Bike, bus: Bus, wrench: Wrench,
  receipt: Receipt, zap: Zap, droplet: Droplet, wifi: Wifi, smartphone: Smartphone, house: House,
  'shopping-bag': ShoppingBag, shirt: Shirt, laptop: Laptop, sofa: Sofa,
  'heart-pulse': HeartPulse, pill: Pill, stethoscope: Stethoscope,
  popcorn: Popcorn, tv: Tv, 'party-popper': PartyPopper, gamepad: Gamepad2,
  'graduation-cap': GraduationCap, 'circle-ellipsis': CircleEllipsis,
  briefcase: Briefcase, code: Code, sparkles: Sparkles, gift: Gift,
  wallet: Wallet, landmark: Landmark, 'piggy-bank': PiggyBank, plane: Plane, baby: Baby,
  'paw-print': PawPrint, dumbbell: Dumbbell, 'book-open': BookOpen, banknote: Banknote,
  'trending-up': TrendingUp, 'hand-coins': HandCoins, music: Music, shield: Shield,
  scissors: Scissors, heart: Heart, gem: Gem, fish: Fish, cigarette: Cigarette, church: Church,
  hammer: Hammer, store: Store,
}

export function iconFor(name: string | undefined): LucideIcon {
  return (name && ICONS[name]) || CircleEllipsis
}
