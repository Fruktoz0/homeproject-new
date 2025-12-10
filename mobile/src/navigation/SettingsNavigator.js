import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileSettingsScreen from '../screens/settings/ProfileSettingsScreen';
import HouseholdSettingsScreen from '../screens/settings/HouseholdSettingsScreen';
import InvitationsScreen from '../screens/settings/InvitationsScreen';
import AuditLogScreen from '../screens/settings/AuditLogScreen';

const Stack = createStackNavigator();

const SettingsNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: true,
                headerBackTitleVisible: false,
                headerTintColor: '#5D9CEC'
            }}
        >
            <Stack.Screen
                name="SettingsMenu"
                component={SettingsScreen}
                options={{ title: 'Beállítások', headerShown: false }}
            />
            <Stack.Screen name="ProfileSettings" component={ProfileSettingsScreen} options={{ title: 'Profil' }} />
            <Stack.Screen name="HouseholdSettings" component={HouseholdSettingsScreen} options={{ title: 'Háztartás & Tagok' }} />
            <Stack.Screen name="Invitations" component={InvitationsScreen} options={{ title: 'Meghívók' }} />
            <Stack.Screen name="AuditLogs" component={AuditLogScreen} options={{ title: 'Napló' }} />
        </Stack.Navigator>
    );
};

export default SettingsNavigator;