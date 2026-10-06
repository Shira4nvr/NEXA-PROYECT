import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import SellerDashboardScreen from "../screens/SellerDashboardScreen";
import AdminDashboardScreen from "../screens/AdminDashboardScreen";
import LegalScreen from "../screens/LegalScreen";
import HomeScreen from "../screens/HomeScreen";
import ProductDetailScreen from "../screens/ProductDetailScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import { colors } from "../theme/colors";
import { useAuthStore } from "@shein-clone/shared";

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function RestrictedScreen({ navigation, role, Screen }) {
  const user = useAuthStore((state) => state.user);
  const hasAccess = user?.role === role;

  useEffect(() => {
    if (!hasAccess) navigation.replace("Login");
  }, [hasAccess, navigation]);

  return hasAccess ? <Screen navigation={navigation} /> : null;
}

function SellerRoute(props) {
  return <RestrictedScreen {...props} role="SELLER" Screen={SellerDashboardScreen} />;
}

function AdminRoute(props) {
  return <RestrictedScreen {...props} role="ADMIN" Screen={AdminDashboardScreen} />;
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeList" component={HomeScreen} options={{ title: "Inicio" }} />
      <HomeStack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: "Producto" }} />
    </HomeStack.Navigator>
  );
}

function StoreTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary }}>
      <Tab.Screen name="Home" component={HomeStackScreen} options={{ title: "Inicio" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ title: "Carrito" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Perfil" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Store" component={StoreTabs} />
        <RootStack.Screen name="Seller" component={SellerRoute} />
        <RootStack.Screen name="Admin" component={AdminRoute} />
        <RootStack.Screen name="Legal" component={LegalScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
