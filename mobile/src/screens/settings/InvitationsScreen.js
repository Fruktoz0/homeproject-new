import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Keyboard } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { getInvitations, sendInvitation, revokeInvitation } from '../../services/invitationService';
import { COLORS } from '../../constants';
import { Card, SectionHeader, Button, Input } from '../../components/UIComponents';

const InvitationsScreen = () => {
    const [invitations, setInvitations] = useState([]);
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    // Lista betöltése
    const loadData = async () => {
        try {
            const data = await getInvitations();
            setInvitations(data);
        } catch (e) {
            console.log("Hiba a meghívók betöltésekor:", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // MŰVELETEK

    const handleSend = async () => {
        if (!email.includes('@')) {
            Alert.alert("Hiba", "Kérlek adj meg egy érvényes email címet!");
            return;
        }

        setLoading(true);
        try {
            await sendInvitation(email);
            Alert.alert("Siker", "Meghívó létrehozva!");
            setEmail('');
            Keyboard.dismiss();
            loadData();
        } catch (error) {
            Alert.alert("Hiba", "Nem sikerült elküldeni a meghívót.");
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        Alert.alert(
            "Visszavonás",
            "Biztosan törölni szeretnéd ezt a meghívót? A kód érvénytelenné válik.",
            [
                { text: "Mégsem", style: "cancel" },
                {
                    text: "Törlés",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await revokeInvitation(id);
                            loadData();
                        } catch (error) {
                            Alert.alert("Hiba", "Nem sikerült a törlés.");
                        }
                    }
                }
            ]
        );
    };

    const handleCopyCode = async (code) => {
        await Clipboard.setStringAsync(code);
        Alert.alert("Másolva", `A kód (${code}) a vágólapra került.`);
    };

    // LISTA ELEM RENDERELÉS 

    const renderItem = ({ item }) => (
        <View style={styles.inviteRow}>
            <View style={styles.iconBox}>
                <MaterialCommunityIcons name="email-outline" size={24} color={COLORS.primary} />
            </View>

            <View style={styles.info}>
                <Text style={styles.email}>{item.email}</Text>
                <TouchableOpacity onPress={() => handleCopyCode(item.code)}>
                    <Text style={styles.code}>Kód: <Text style={styles.codeBold}>{item.code}</Text></Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleRevoke(item.id)} style={styles.deleteBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* 1. ÚJ MEGHÍVÓ KÁRTYA */}
            <Card style={styles.createCard}>
                <Text style={styles.cardTitle}>Új tag meghívása</Text>
                <Text style={styles.cardSubtitle}>
                    A rendszer generál egy egyedi kódot, amit elküldhetsz a tagnak.
                </Text>

                <View style={{ marginBottom: 15 }}>
                    <Input
                        placeholder="pelda@email.hu"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <Button
                    title={loading ? "Küldés..." : "Meghívó Készítése"}
                    onPress={handleSend}
                    disabled={loading}
                    icon="email-plus"
                />
            </Card>

            {/* 2. LISTA */}
            <SectionHeader title={`Függőben lévő meghívók (${invitations.length})`} />

            <FlatList
                data={invitations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 50 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>Nincs függőben lévő meghívó.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },

    // Felső kártya
    createCard: {
        padding: 20,
        marginBottom: 25
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 5
    },
    cardSubtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 15,
        lineHeight: 18
    },

    // Lista elem
    inviteRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.gray200
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    info: { flex: 1 },
    email: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    code: {
        fontSize: 13,
        color: COLORS.textSecondary
    },
    codeBold: {
        fontWeight: 'bold',
        color: COLORS.primary,
        letterSpacing: 1
    },

    deleteBtn: { padding: 10 },

    // Üres állapot
    emptyContainer: {
        alignItems: 'center',
        marginTop: 30
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontStyle: 'italic'
    }
});

export default InvitationsScreen;