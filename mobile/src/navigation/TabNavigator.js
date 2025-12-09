import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import DashboardScreen from '../screens/DashboardScreen';
import RecurringScreen from '../screens/RecurringScreen';
import SavingsScreen from '../screens/SavingScreen';
import ProfileScreen from '../screens/ProfilScreen';

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
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarLabel: 'Profil' }}
            />
        </Tab.Navigator>
    );
};

export default TabNavigator;