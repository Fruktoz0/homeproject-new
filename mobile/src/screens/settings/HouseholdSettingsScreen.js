import React, { useState, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, Share } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import { getCurrentHousehold, approveMember, removeMember } from '../../services/householdService';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants';
import { Card, SectionHeader, Button } from '../../components/UIComponents';

const HouseholdSettingsScreen = ({ navigation }) => {
    const { userData, updateUser, logout } = useContext(AuthContext);
    const [household, setHousehold] = useState(null);
    const [loading, setLoading] = useState(false);

    // Adatok betöltése
    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getCurrentHousehold();
            setHousehold(data);
        } catch (e) {
            console.log("Hiba a háztartás betöltésekor:", e);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- MŰVELETEK ---

    const handleCopyCode = async () => {
        if (household?.inviteCode) {
            await Clipboard.setStringAsync(household.inviteCode);
            Alert.alert("Másolva", "A meghívó kód a vágólapra került!");
        }
    };

    const handleShareCode = async () => {
        try {
            await Share.share({
                message: `Csatlakozz a háztartásomhoz a "${household.inviteCode}" kóddal!`,
            });
        } catch (error) {
            console.log(error);
        }
    };

    const handleApprove = async (member) => {
        try {
            await approveMember(member.id);
            Alert.alert("Siker", `${member.displayName} mostantól teljes jogú tag.`);
            loadData(); // Lista frissítése
        } catch (error) {
            Alert.alert("Hiba", "Nem sikerült a jóváhagyás.");
        }
    };

    const handleRemove = async (member) => {
        Alert.alert(
            "Eltávolítás",
            `Biztosan el akarod távolítani ${member.displayName} felhasználót?`,
            [
                { text: "Mégsem", style: "cancel" },
                {
                    text: "Eltávolítás",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeMember(member.id);
                            loadData();
                        } catch (error) {
                            Alert.alert("Hiba", "Nem sikerült az eltávolítás.");
                        }
                    }
                }
            ]
        );
    };

    const handleLeave = async () => {
        Alert.alert(
            "Kilépés",
            "Biztosan ki szeretnél lépni a háztartásból? Az adataidat nem fogod látni többé.",
            [
                { text: "Mégsem", style: "cancel" },
                {
                    text: "Kilépés",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Saját ID-val hívjuk meg a remove-ot -> Backend kiléptet
                            await removeMember(userData.id);

                            // Lokális user adat frissítése (nullázzuk a householdId-t)
                            await updateUser({ householdId: null, membershipStatus: null });

                            // Navigáció vissza a Setup képernyőre (az AppNavigator intézi)
                        } catch (error) {
                            Alert.alert("Hiba", "Nem sikerült a kilépés.");
                        }
                    }
                }
            ]
        );
    };

    // --- RENDERELÉS ---

    const isOwner = userData?.id === household?.ownerId;

    const renderMember = ({ item }) => {
        const isMe = item.id === userData.id;
        const isMemberPending = item.membershipStatus === 'pending';

        return (
            <View style={styles.memberRow}>
                {/* Avatar (Kezdőbetű) */}
                <View style={[styles.avatar, isMe && styles.avatarMe]}>
                    <Text style={[styles.avatarText, isMe && { color: COLORS.white }]}>
                        {item.displayName.charAt(0).toUpperCase()}
                    </Text>
                </View>

                {/* Adatok */}
                <View style={styles.memberInfo}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.memberName}>
                            {item.displayName} {isMe && "(Én)"}
                        </Text>
                        {household.ownerId === item.id && (
                            <MaterialCommunityIcons name="crown" size={14} color="#FFCE54" />
                        )}
                    </View>
                    <Text style={styles.memberEmail}>{item.email}</Text>
                    {isMemberPending && (
                        <Text style={styles.pendingText}>Jóváhagyásra vár</Text>
                    )}
                </View>

                {/* Gombok */}
                <View style={styles.actions}>
                    {/* Jóváhagyás (Csak Owner láthatja, ha a tag Pending) */}
                    {isOwner && isMemberPending && (
                        <TouchableOpacity onPress={() => handleApprove(item)} style={styles.iconBtnSuccess}>
                            <MaterialCommunityIcons name="check" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    )}

                    {/* Törlés (Csak Owner törölhet mást, kivéve magát) */}
                    {isOwner && !isMe && (
                        <TouchableOpacity onPress={() => handleRemove(item)} style={styles.iconBtnDanger}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* 1. HÁZTARTÁS INFO KÁRTYA */}
            <Card style={styles.headerCard}>
                <View style={styles.headerContent}>
                    <View style={styles.iconBox}>
                        <MaterialCommunityIcons name="home-heart" size={32} color={COLORS.primary} />
                    </View>
                    <View>
                        <Text style={styles.hhName}>{household?.name || 'Betöltés...'}</Text>
                        <View style={styles.codeRow}>
                            <Text style={styles.codeLabel}>Kód:</Text>
                            <TouchableOpacity onPress={handleCopyCode} style={styles.codeBox}>
                                <Text style={styles.codeText}>{household?.inviteCode || '...'}</Text>
                                <MaterialCommunityIcons name="content-copy" size={14} color={COLORS.primary} style={{ marginLeft: 6 }} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                <View style={styles.shareContainer}>
                    <Button
                        title="Kód megosztása"
                        onPress={handleShareCode}
                        variant="ghost"
                        style={{ paddingVertical: 8 }}
                    />
                </View>
            </Card>

            {/* 2. TAGOK LISTÁJA */}
            <SectionHeader title={`Tagok (${household?.members?.length || 0})`} />

            <FlatList
                data={household?.members}
                renderItem={renderMember}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListFooterComponent={
                    <View style={{ marginTop: 30 }}>
                        <Button
                            title="Kilépés a háztartásból"
                            onPress={handleLeave}
                            variant="danger-ghost"
                            icon="logout"
                        />
                        <Text style={styles.leaveHint}>
                            Ha kilépsz, újra be kell írnod egy kódot vagy újat kell létrehoznod.
                        </Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },

    // Header kártya
    headerCard: {
        padding: 20,
        marginBottom: 25
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: '#EBF4FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    hhName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4
    },
    codeRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    codeLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 8
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6
    },
    codeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        letterSpacing: 1
    },
    shareContainer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.gray100,
        paddingTop: 15
    },

    // Tagok Lista
    memberRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: COLORS.gray200,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12
    },
    avatarMe: { backgroundColor: COLORS.primary },
    avatarText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textSecondary },

    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary },
    memberEmail: { fontSize: 12, color: COLORS.textSecondary },
    pendingText: { fontSize: 10, color: '#F6BB42', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2 },

    actions: { flexDirection: 'row', gap: 8 },
    iconBtnSuccess: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.success, justifyContent: 'center', alignItems: 'center' },
    iconBtnDanger: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFEBEB', justifyContent: 'center', alignItems: 'center' },

    // Lábléc
    leaveHint: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: 10, paddingHorizontal: 20 }
});

export default HouseholdSettingsScreen;