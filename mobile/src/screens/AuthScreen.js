import React, { useState, useContext } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants';
import { Card, Button, Input } from '../components/UIComponents';

const AuthScreen = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [loading, setLoading] = useState(false);

    const { login, register } = useContext(AuthContext);

    const handleSubmit = async () => {
        if (!email || !password || (!isLoginMode && !displayName)) {
            Alert.alert("Hiba", "Minden mező kitöltése kötelező!");
            return;
        }

        setLoading(true);
        try {
            if (isLoginMode) {
                await login(email, password);
            } else {
                await register(email, password, displayName);
            }
            // Sikeres belépés/regisztráció esetén az AppNavigator automatikusan vált
        } catch (error) {
            const msg = error.response?.data?.message || "Hálózati hiba történt";
            Alert.alert("Hiba", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.innerContainer}>

                    <Card style={styles.authCard}>
                        <Text style={styles.title}>
                            {isLoginMode ? 'Bejelentkezés' : 'Regisztráció'}
                        </Text>
                        <Text style={styles.subtitle}>
                            {isLoginMode ? 'Add meg az adataidat a belépéshez.' : 'Hozz létre egy új fiókot.'}
                        </Text>

                        {!isLoginMode && (
                            <Input
                                label="Név"
                                placeholder="Pl. Kovács János"
                                value={displayName}
                                onChangeText={setDisplayName}
                                autoCapitalize="words"
                            />
                        )}

                        <Input
                            label="Email cím"
                            placeholder="pelda@email.hu"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                        />

                        <Input
                            label="Jelszó"
                            placeholder="******"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <View style={{ marginTop: 10 }}>
                            <Button
                                title={loading ? "Folyamatban..." : (isLoginMode ? 'Belépés' : 'Regisztráció')}
                                onPress={handleSubmit}
                                disabled={loading}
                            />
                        </View>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                {isLoginMode ? 'Még nincs fiókod?' : 'Már van fiókod?'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setIsLoginMode(!isLoginMode);
                                // Opcionális: mezők törlése váltáskor
                                // setEmail(''); setPassword(''); setDisplayName('');
                            }}>
                                <Text style={styles.linkText}>
                                    {isLoginMode ? 'Regisztrálj itt' : 'Jelentkezz be'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    innerContainer: {
        padding: 20,
        width: '100%',
        alignItems: 'center',
    },
    authCard: {
        width: '100%',
        padding: 24, // Nagyobb padding, mint az alapértelmezett kártyán
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: 24,
    },
    footer: {
        marginTop: 24,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    footerText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    linkText: {
        color: COLORS.primary,
        fontWeight: 'bold',
        fontSize: 14,
        marginLeft: 6,
    }
});

export default AuthScreen;