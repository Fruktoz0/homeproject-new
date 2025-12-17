import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import DashboardScreen from '../screens/DashboardScreen';
import RecurringScreen from '../screens/RecurringScreen';
import SavingsScreen from '../screens/SavingScreen';
import MenuNavigator from './MenuNavigator';
import ShoppingListScreen from '../screens/ShoppingListScreen';

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarStyle: {
                    borderTopWidth: 0,
                    elevation: 10,
                    height: 75,
                    paddingBottom: 8,
                    paddingTop: 8,
                    backgroundColor: COLORS.surface,
                },
                tabBarIcon: ({ color, size }) => {
                    let iconName;

                    if (route.name === 'Overview') {
                        iconName = 'home-variant';
                    } else if (route.name === 'Recurring') {
                        iconName = 'repeat';
                    } else if (route.name === 'Savings') {
                        iconName = 'piggy-bank';
                    } else if (route.name === 'Profile') {
                        iconName = 'account';
                    }

                    return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Overview"
                component={DashboardScreen}
                options={{ tabBarLabel: 'Áttekintés' }}
            />
            <Tab.Screen
                name="Recurring"
                component={RecurringScreen}
                options={{ tabBarLabel: 'Fix' }}
            />
            <Tab.Screen
                name="Savings"
                component={SavingsScreen}
                options={{ tabBarLabel: 'Megtakarítás' }}
            />
            <Tab.Screen
                name="Shopping"
                component={ShoppingListScreen}
                options={{
                    tabBarLabel: 'Bevásárlás',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="cart" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Menu"
                component={MenuNavigator}
                options={{
                    tabBarLabel: 'Menü',
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="menu" size={size} color={color} />
                    )
                }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;