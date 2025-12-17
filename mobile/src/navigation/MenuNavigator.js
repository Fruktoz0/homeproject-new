import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import MenuScreen from '../screens/MenuScreen';
import ProfileSettingsScreen from '../screens/settings/ProfileSettingsScreen';
import HouseholdSettingsScreen from '../screens/settings/HouseholdSettingsScreen';
import InvitationsScreen from '../screens/settings/InvitationsScreen';
import AuditLogScreen from '../screens/settings/AuditLogScreen';
import StatisticsScreen from '../screens/settings/StatisticsScreen';
import ExportScreen from '../screens/settings/ExportScreen';

const Stack = createStackNavigator();

const MenuNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTintColor: '#5D9CEC'
            }}
        >
            <Stack.Screen
                name="MenuOverview"
                component={MenuScreen}
                options={{ title: 'Menü', headerShown: false }}
            />
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profil' }} />
            <Stack.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} options={{ title: 'Háztartás & Tagok' }} />
            <Stack.Screen name="Statistics" component={StatisticsScreen} options={{ title: 'Statisztika' }} />
            <Stack.Screen name="Invitations" component={InvitationsScreen} options={{ title: 'Meghívók' }} />
            <Stack.Screen name="AuditLogs" component={AuditLogScreen} options={{ title: 'Napló' }} />
            <Stack.Screen name="Export" component={ExportScreen} options={{ title: 'Exportálás' }} />
        </Stack.Navigator>
    );
};

export default MenuNavigator;