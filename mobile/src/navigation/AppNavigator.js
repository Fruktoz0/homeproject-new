import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants';

// Képernyők importálása
import AuthScreen from '../screens/AuthScreen';
import HouseholdSetupScreen from '../screens/HouseholdSetupScreen';
import PendingScreen from '../screens/PendingScreen';
import TabNavigator from './TabNavigator';

// ÚJ IMPORT: A bevásárlólista részletező
import ShoppingDetailScreen from '../screens/ShoppingDetailScreen';

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
                            // 4. ESET: Minden OK, aktív tag
                            // Itt vannak azok a képernyők, amik a bejelentkezett felhasználónak érhetők el
                            <>
                                {/* A Főoldal a Tabokkal */}
                                <Stack.Screen name="HomeTabs" component={TabNavigator} />

                                {/* RÉSZLETEZŐ KÉPERNYŐK:
                                    Ezeket ide tesszük, a HomeTabs MELLÉ. 
                                    Így, ha megnyitsz egy listát, az "rácsúszik" a Tabokra, 
                                    és lesz saját "Vissza" gombja.
                                */}
                                <Stack.Screen
                                    name="ShoppingDetail"
                                    component={ShoppingDetailScreen}
                                    options={{
                                        headerShown: true, // Itt visszakapcsoljuk a fejlécet
                                        title: 'Lista részletei',
                                        headerBackTitleVisible: false, // iOS-en csak a nyíl legyen, szöveg ne
                                        headerTintColor: COLORS.primary // Vissza gomb színe
                                    }}
                                />
                            </>
                        )}
                    </>
                )}

            </Stack.Navigator>
        </NavigationContainer>
    );
};

export default AppNavigator;