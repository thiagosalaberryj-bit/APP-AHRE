import HomeScreen from '../screens/HomeScreen';
import { ROUTES } from '../constants/routes';

const screens = {
  [ROUTES.HOME]: HomeScreen,
};

export default function AppNavigator() {
  const InitialScreen = screens[ROUTES.HOME];

  return <InitialScreen />;
}
