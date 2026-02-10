export interface TourStep {
  /** Valor del atributo data-tour del elemento target */
  target: string;
  /** Clave i18n para el titulo (namespace: tour) */
  titleKey: string;
  /** Clave i18n para la descripcion */
  descriptionKey: string;
  /** Posicion preferida del tooltip relativo al target */
  position?: 'top' | 'bottom' | 'auto';
  /** Padding extra alrededor del spotlight (px) */
  padding?: number;
  /** Border radius del spotlight (px) */
  borderRadius?: number;
}

export interface TourConfig {
  /** ID unico del tour (e.g., "home", "stats") */
  id: string;
  /** Pasos del tour */
  steps: TourStep[];
  /** Delay antes de iniciar (ms) - para que la pagina se renderice */
  startDelay?: number;
}
