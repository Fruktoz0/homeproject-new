import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../context/AuthContext';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants';

import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';
import PendingScreen from '../screens/PendingScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
    const { userToken, userData, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>

                {/* 1. ESET: Nincs bejelentkezve */}
                {userToken == null ? (
                    <Stack.Screen name="Auth" component={AuthScreen} />
                ) : (
                    /* Be van jelentkezve... de hova? */
                    <>
                        {!userData?.householdId ? (
                            // 2. ESET: Be van lépve, de NINCS háztartása
                            <Stack.Screen name="HouseholdSetup" component={HouseholdSetupScreen} />
                        ) : userData.membershipStatus === 'pending' ? (
                            // 3. ESET: Van háza, de még FÜGGŐBEN van
                            <Stack.Screen name="Pending" component={PendingScreen} />
                        ) : (
                            // 4. ESET: Minden OK, mehet a Dashboard
                            <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        )}
                    </>
                )}

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;