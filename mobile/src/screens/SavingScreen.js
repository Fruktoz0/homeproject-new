import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getSavings, createSavingGoal, deleteSavingGoal, updateSavingBalance, updateSavingGoal } from '../services/savingsService';
import { COLORS } from '../constants';
import { Card, FloatingActionButton, SectionHeader, Button } from '../components/UIComponents';
import { AddSavingModal, SavingActionModal, SavingHistoryModal, EditSavingModal } from '../components/Modals';

const SavingsScreen = () => {
    const [items, setItems] = useState([]);
    const [refreshing, setRefreshing] = useState(false);


    // Modal Statek
    const [isAddVisible, setAddVisible] = useState(false);
    const [actionModal, setActionModal] = useState({ visible: false, item: null, mode: 'DEPOSIT' });
    const [historyModal, setHistoryModal] = useState({ visible: false, item: null });
    const [editModal, setEditModal] = useState({ visible: false, item: null });

    const loadData = async () => {
        try {
            const data = await getSavings();
            setItems(data);
        } catch (e) {
            console.log(e);
        }
    };

    const handleUpdate = async (id, data) => {
        await updateSavingGoal(id, data);
        loadData();
    };

    const openEditModal = (item) => {
        setEditModal({ visible: true, item });
    };
    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const openHistory = (item) => {
        setHistoryModal({ visible: true, item });
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- MŰVELETEK ---

    const handleCreate = async (data) => {
        await createSavingGoal(data);
        loadData();
    };

    const handleDelete = (item) => {
        Alert.alert("Törlés", `Biztosan törlöd a(z) "${item.name}" célt?`, [
            { text: "Mégsem", style: "cancel" },
            {
                text: "Törlés", style: "destructive", onPress: async () => {
                    await deleteSavingGoal(item.id);
                    loadData();
                }
            }
        ]);
    };

    const openActionModal = (item, mode) => {
        setActionModal({ visible: true, item, mode });
    };

    const handleBalanceUpdate = async (id, amountDiff, desc) => {
        await updateSavingBalance(id, amountDiff, desc);
        loadData();
    };

    // --- UI SEGÉD ---
    const formatMoney = (amount) =>
        new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

    // --- LISTA ELEM ---
    const renderItem = ({ item }) => {
        // Százalék számítás
        const percent = item.targetAmount
            ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100))
            : 0;

        // Szín a kártyához
        const cardColor = item.color || COLORS.primary;

        const CardContent = (
            <>
                <View style={styles.header}>
                    <View>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={[styles.currentAmount, { color: cardColor }]}>
                            {formatMoney(item.currentAmount)}
                        </Text>
                    </View>

                    {/* Gombok Konténer a jobb felső sarokban */}
                    <View style={{ flexDirection: 'row', gap: 5 }}>
                        {/* SZERKESZTÉS GOMB */}
                        <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
                            <MaterialCommunityIcons name="pencil-outline" size={20} color={COLORS.textSecondary} />
                        </TouchableOpacity>

                        {/* TÖRLÉS GOMB */}
                        <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.gray200} />
                        </TouchableOpacity>
                    </View>
                </View>

                {item.targetAmount ? (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: cardColor }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>{percent}% teljesítve</Text>
                            <Text style={styles.progressText}>Cél: {formatMoney(item.targetAmount)}</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noTargetText}>Nincs célösszeg beállítva</Text>
                )}
            </>
        );

        return (
            // A keret színét stílusból adjuk, nem inline style-ból a tisztaság végett
            <Card style={[styles.card, { borderLeftColor: cardColor, borderLeftWidth: 5 }]}>

                {/* AZ EGÉSZ FELSŐ RÉSZ KATTINTHATÓ */}
                <TouchableOpacity onPress={() => openHistory(item)} activeOpacity={0.7}>
                    {CardContent}
                </TouchableOpacity>

                {/* MŰVELET GOMBOK (Ezek maradnak külön) */}
                <View style={styles.actionButtons}>
                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.success + '15' }]}
                        onPress={() => openActionModal(item, 'DEPOSIT')}
                    >
                        <MaterialCommunityIcons name="plus" size={18} color={COLORS.success} />
                        <Text style={[styles.actionBtnText, { color: COLORS.success }]}>Befizetés</Text>
                    </TouchableOpacity>

                    <View style={{ width: 10 }} />

                    <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: COLORS.danger + '15' }]}
                        onPress={() => openActionModal(item, 'WITHDRAW')}
                    >
                        <MaterialCommunityIcons name="minus" size={18} color={COLORS.danger} />
                        <Text style={[styles.actionBtnText, { color: COLORS.danger }]}>Kivét</Text>
                    </TouchableOpacity>
                </View>

            </Card>
        );
    };
    return (
        <View style={styles.container}>
            <SectionHeader title={`Célok (${items.length})`} />

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 100 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="piggy-bank-outline" size={50} color={COLORS.gray200} />
                        <Text style={styles.emptyText}>Még nincsenek megtakarítási célok.</Text>
                    </View>
                }
            />

            <FloatingActionButton
                icon={<MaterialCommunityIcons name="plus" size={30} color="#fff" />}
                onPress={() => setAddVisible(true)}
            />

            <AddSavingModal
                visible={isAddVisible}
                onClose={() => setAddVisible(false)}
                onSubmit={handleCreate}
            />

            <SavingActionModal
                visible={actionModal.visible}
                item={actionModal.item}
                mode={actionModal.mode}
                onClose={() => setActionModal({ ...actionModal, visible: false })}
                onSubmit={handleBalanceUpdate}
            />

            <SavingHistoryModal
                visible={historyModal.visible}
                item={historyModal.item}
                onClose={() => setHistoryModal({ ...historyModal, visible: false })}
            />

            <EditSavingModal
                visible={editModal.visible}
                item={editModal.item}
                onClose={() => setEditModal({ ...editModal, visible: false })}
                onSubmit={handleUpdate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20, marginTop: 15 },
    card: { padding: 15, marginBottom: 15, paddingBottom: 10 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: 2 },
    currentAmount: { fontSize: 24, fontWeight: 'bold' }, // Színét inline állítjuk
    iconBtn: { padding: 5 },

    // Progress Bar
    progressContainer: { marginBottom: 20 },
    progressBarBg: { height: 8, backgroundColor: COLORS.gray200, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
    progressText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
    noTargetText: { fontSize: 12, color: COLORS.textSecondary, fontStyle: 'italic', marginBottom: 20 },

    // Gombok
    actionButtons: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.gray100, paddingTop: 10 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8 },
    actionBtnText: { fontWeight: 'bold', fontSize: 13, marginLeft: 6 },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 10, fontSize: 16 }
});

export default SavingsScreen;