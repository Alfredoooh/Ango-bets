// AppNavigator.tsx (ou onde estiver seu Tab.Navigator)
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Início" component={HomeScreen} />
      <Tab.Screen name="Mercado" component={MarketScreen} />
      <Tab.Screen name="Portfólio" component={PortfolioScreen} />   // você precisará criar
      <Tab.Screen name="Automação" component={AutomationScreen} /> // você precisará criar
    </Tab.Navigator>
  );
}