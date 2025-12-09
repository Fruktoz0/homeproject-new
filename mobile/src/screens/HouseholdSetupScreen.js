import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants';
import { Card, Button, Input, SectionHeader } from '../components/UIComponents';
import api from '../services/api';

const HouseholdSetupScreen = () => {
    const { updateUser, userData, logout } = useContext(AuthContext);
    const [mode, setMode] = useState('create'); // 'create' vagy 'join'
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name) return Alert.alert("Hiba", "Adj nevet a háztartásnak!");

        setLoading(true);
        try {
            const response = await api.post('/households/create', { name });
            const newHousehold = response.data;

            Alert.alert("Siker", `Létrehoztad a "${newHousehold.name}" háztartást!`);

            // Frissítjük a Context-et, hogy a navigáció átváltson a Dashboardra
            await updateUser({
                householdId: newHousehold.id,
                membershipStatus: 'approved' // A létrehozó automatikusan elfogadva
            });

        } catch (error) {
            Alert.alert("Hiba", error.response?.data?.message || "Szerver hiba");
        } finally {
            setLoading(false);
        }
    };

    const handleJoin = async () => {
        if (!code) return Alert.alert("Hiba", "Írd be a csatlakozási kódot!");

        setLoading(true);
        try {
            const response = await api.post('/households/join', { code });

            Alert.alert("Siker", "Sikeresen jelentkeztél! Várj a jóváhagyásra.");

            // Frissítjük a Context-et -> Ez átirányít majd a Pending képernyőre
            await updateUser({
                householdId: response.data.householdId,
                membershipStatus: 'pending'
            });

        } catch (error) {
            Alert.alert("Hiba", error.response?.data?.message || "Hibás kód vagy szerver hiba");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.header}>
                <Text style={styles.welcomeTitle}>Szia, {userData?.displayName}!</Text>
                <Text style={styles.welcomeSub}>Még nem tartozol egyetlen háztartáshoz sem.</Text>
            </View>

            <Card style={styles.card}>
                {/* Fülek váltása */}
                <View style={styles.tabContainer}>
                    <Button
                        title="Új Létrehozása"
                        onPress={() => setMode('create')}
                        variant={mode === 'create' ? 'primary' : 'outline'}
                        style={[styles.tabBtn, mode !== 'create' && styles.inactiveTab]}
                    />
                    <View style={{ width: 10 }} />
                    <Button
                        title="Csatlakozás"
                        onPress={() => setMode('join')}
                        variant={mode === 'join' ? 'primary' : 'outline'}
                        style={[styles.tabBtn, mode !== 'join' && styles.inactiveTab]}
                    />
                </View>

                {mode === 'create' ? (
                    <View style={styles.formArea}>
                        <SectionHeader title="Háztartás Létrehozása" />
                        <Text style={styles.infoText}>
                            Hozz létre egy új kasszát, és hívd meg a családtagjaidat.
                        </Text>
                        <Input
                            label="Elnevezés"
                            placeholder="Pl. Otthon, Nyaraló"
                            value={name}
                            onChangeText={setName}
                        />
                        <Button
                            title={loading ? "Létrehozás..." : "Létrehozás"}
                            onPress={handleCreate}
                            disabled={loading}
                        />
                    </View>
                ) : (
                    <View style={styles.formArea}>
                        <SectionHeader title="Csatlakozás Meglévőhöz" />
                        <Text style={styles.infoText}>
                            Írd be a kódot, amit a háztartás tulajdonosától kaptál.
                        </Text>
                        <Input
                            label="Meghívó kód"
                            placeholder="Pl. HOME-1234"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="characters"
                        />
                        <Button
                            title={loading ? "Csatlakozás..." : "Csatlakozás"}
                            onPress={handleJoin}
                            disabled={loading}
                        />
                    </View>
                )}
            </Card>

            <View style={{ marginTop: 30 }}>
                <Button title="Kijelentkezés" onPress={logout} variant="danger-ghost" />

            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: COLORS.background, justifyContent: 'center' },
    header: { marginBottom: 30, alignItems: 'center' },
    welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 8 },
    welcomeSub: { fontSize: 16, color: COLORS.textSecondary, textAlign: 'center' },
    card: { padding: 20 },
    tabContainer: { flexDirection: 'row', marginBottom: 20 },
    tabBtn: { flex: 1 },
    inactiveTab: {
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.primary
    }, // Ezt majd finomíthatjuk
    formArea: { minHeight: 200 },
    infoText: { color: COLORS.textSecondary, marginBottom: 20, lineHeight: 20 }
});

export default HouseholdSetupScreen;