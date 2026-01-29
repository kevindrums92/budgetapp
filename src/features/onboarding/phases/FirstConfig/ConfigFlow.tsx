/**
 * ConfigFlow
 * Router para las 6 pantallas de First Config
 */

import { useParams, Navigate } from 'react-router-dom';
import Screen1_Language from './screens/Screen1_Language';
import Screen2_Theme from './screens/Screen2_Theme';
import Screen3_Currency from './screens/Screen3_Currency';
import Screen4_Categories from './screens/Screen4_Categories';
import Screen5_Notifications from './screens/Screen5_Notifications';
import Screen6_Complete from './screens/Screen5_Complete';

const SCREENS = [
  Screen1_Language,
  Screen2_Theme,
  Screen3_Currency,
  Screen4_Categories,
  Screen5_Notifications,
  Screen6_Complete,
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
