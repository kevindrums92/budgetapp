/**
 * ConfigFlow
 * Router para la pantalla única de First Config: Categorías
 * Language y currency se auto-detectan
 */

import { useParams, Navigate } from 'react-router-dom';
import Screen4_Categories from './screens/Screen4_Categories';

const SCREENS = [
  Screen4_Categories,
];

export default function ConfigFlow() {
  const { step } = useParams<{ step: string }>();
  const stepNumber = parseInt(step || '1', 10);

  // Validate step number
  if (isNaN(stepNumber) || stepNumber < 1 || stepNumber > SCREENS.length) {
    return <Navigate to="/onboarding/config/1" replace />;
  }

  // Render only the current screen
  // Navigation and state updates are handled by useOnboardingProgress in individual screens
  const CurrentScreen = SCREENS[stepNumber - 1];
  return <CurrentScreen />;
}
