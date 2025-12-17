import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants';
import { Card, Button } from '../components/UIComponents';

const PendingScreen = () => {
    const { logout } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <Card style={styles.card}>
                <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name="timer-sand" size={60} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Jóváhagyásra vár</Text>
                <Text style={styles.text}>
                    A csatlakozási kérelmedet elküldtük. Kérd meg a háztartás tulajdonosát, hogy hagyja jóvá a belépésedet!
                </Text>

                <View style={{ marginTop: 30, width: '100%' }}>
                    <Button title="Frissítés (Újra belépés)" onPress={logout} variant="ghost-outline" style={{ marginBottom: 10 }} />
                    <Button title="Kijelentkezés" onPress={logout} variant="danger" />
                </View>
            </Card>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', padding: 20 },
    card: { alignItems: 'center', padding: 30 },
    iconContainer: { marginBottom: 20, backgroundColor: '#F0F4FF', padding: 20, borderRadius: 50 },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
    text: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 24 }
});

export default PendingScreen;