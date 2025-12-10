import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getRecurringItems, createRecurringItem, deleteRecurringItem } from '../services/recurringService';
import { getTransactions, createTransaction } from '../services/transactionService';
import { getStartOfMonth, getEndOfMonth, formatDateToISO } from '../utils/dateUtils';
import { COLORS } from '../constants';
import { Card, FloatingActionButton, SectionHeader, Button } from '../components/UIComponents';
import { AddRecurringModal, PaymentModal, TransactionDetailsModal } from '../components/Modals'; // ÚJ IMPORT

const RecurringScreen = () => {
    const [items, setItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const [isDetailModalVisible, setDetailModalVisible] = useState(false); // ÚJ STATE

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null); // ÚJ STATE

    // Adatok betöltése
    const loadData = async () => {
        try {
            const recurringData = await getRecurringItems();
            const now = new Date();
            const start = formatDateToISO(getStartOfMonth(now));
            const end = formatDateToISO(getEndOfMonth(now));
            const txData = await getTransactions(start, end);

            setItems(recurringData);
            setTransactions(txData);
        } catch (e) {
            console.log("Hiba a betöltéskor:", e);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- MŰVELETEK ---

    const handleCreate = async (data) => {
        try {
            await createRecurringItem(data);
            loadData();
        } catch (error) {
            Alert.alert("Hiba", "Sikertelen létrehozás");
        }
    };

    const handleDelete = (item) => {
        Alert.alert(
            "Törlés",
            `Biztosan törölni szeretnéd a(z) "${item.name}" tételt?`,
            [
                { text: "Mégsem", style: "cancel" },
                {
                    text: "Törlés",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteRecurringItem(item.id);
                            loadData();
                        } catch (error) {
                            Alert.alert("Hiba", "Nem sikerült a törlés.");
                        }
                    }
                }
            ]
        );
    };

    const openPayModal = (item) => {
        setSelectedItem(item);
        setPayModalVisible(true);
    };

    // ÚJ: Részletek megnyitása
    const openDetailModal = (tx) => {
        setSelectedTransaction(tx);
        setDetailModalVisible(true);
    };

    const handlePay = async (txData) => {
        try {
            await createTransaction(txData);
            loadData();
        } catch (error) {
            console.log("Pay error:", error);
            Alert.alert("Hiba", "Sikertelen rögzítés");
        }
    };

    // --- UI SEGÉDFÜGGVÉNYEK ---
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: 'HUF',
            maximumFractionDigits: 0
        }).format(amount);
    };

    // --- LISTA ELEM ---
    const renderItem = ({ item }) => {
        const paidTx = transactions.find(t => t.recurringItemId === item.id);
        const isPaid = !!paidTx;

        // A kártya tartalmát külön változóba tesszük, hogy tisztább legyen
        const CardContent = (
            <View style={styles.row}>
                {/* BAL OLDAL */}
                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.categoryDot}>•</Text>
                        <Text style={styles.category}>{item.category || 'Egyéb'}</Text>
                    </View>

                    {/* Tervezett összeg */}
                    <Text style={styles.plannedText}>
                        Tervezett: <Text style={styles.plannedAmount}>{formatMoney(item.amount)}</Text>
                    </Text>

                    {/* ÚJ: Tényleges összeg megjelenítése, ha fizetve van */}
                    {isPaid && (
                        <Text style={styles.actualText}>
                            Fizetve: <Text style={styles.actualAmount}>{formatMoney(paidTx.amount)}</Text>
                        </Text>
                    )}

                    <View style={styles.badgeContainer}>
                        <View style={styles.freqBadge}>
                            <Text style={styles.freqText}>
                                {item.frequency === 'MONTHLY' ? 'Havi' : 'Éves'}
                            </Text>
                        </View>
                        {item.autoPay && (
                            <View style={styles.autoBadge}>
                                <MaterialCommunityIcons name="lightning-bolt" size={10} color={COLORS.white} />
                                <Text style={styles.autoText}>AUTO: {item.payDay}.</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* JOBB OLDAL */}
                <View style={styles.actionContainer}>
                    {isPaid ? (
                        <View style={styles.paidBadge}>
                            <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
                            <Text style={styles.paidText}>Befizetve</Text>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.payBtn}
                            onPress={() => openPayModal(item)}
                        >
                            <Text style={styles.payBtnText}>Befizetés</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );

        return (
            <Card style={styles.card}>
                {/* Ha fizetve van, az egész kártya kattintható a részletekért */}
                {isPaid ? (
                    <TouchableOpacity onPress={() => openDetailModal(paidTx)} activeOpacity={0.7}>
                        {CardContent}
                    </TouchableOpacity>
                ) : (
                    CardContent
                )}

                {/* Törlés gomb mindig elérhető */}
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteIcon}>
                    <MaterialCommunityIcons name="close" size={18} color={COLORS.gray200} />
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <SectionHeader title={`Aktív tételek (${items.length})`} />

            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="calendar-refresh" size={50} color={COLORS.gray200} />
                        <Text style={styles.emptyText}>Nincs beállítva rendszeres költség.</Text>
                    </View>
                }
            />

            <FloatingActionButton
                icon={<MaterialCommunityIcons name="plus" size={30} color="#fff" />}
                onPress={() => setAddModalVisible(true)}
            />

            <AddRecurringModal
                visible={isAddModalVisible}
                onClose={() => setAddModalVisible(false)}
                onSubmit={handleCreate}
            />

            <PaymentModal
                visible={isPayModalVisible}
                item={selectedItem}
                onClose={() => setPayModalVisible(false)}
                onSubmit={handlePay}
            />

            {/* ÚJ MODAL: Részletek */}
            <TransactionDetailsModal
                visible={isDetailModalVisible}
                transaction={selectedTransaction}
                onClose={() => setDetailModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    card: { padding: 15, marginBottom: 12, paddingRight: 30 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, // alignItems módosítva, hogy fentről induljanak

    infoContainer: { flex: 1, marginRight: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    categoryDot: { marginHorizontal: 5, color: COLORS.textSecondary },
    category: { fontSize: 12, color: COLORS.textSecondary },

    plannedText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }, // Kisebb margin
    plannedAmount: { fontWeight: 'bold', color: COLORS.textSecondary },

    // ÚJ STÍLUSOK:
    actualText: { fontSize: 12, color: COLORS.success, marginBottom: 8, fontWeight: '600' },
    actualAmount: { fontWeight: 'bold' },

    badgeContainer: { flexDirection: 'row', gap: 6 },
    freqBadge: { backgroundColor: COLORS.gray200, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    freqText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    autoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFCE54', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    autoText: { fontSize: 10, fontWeight: 'bold', color: '#8a6d3b', marginLeft: 2 },

    actionContainer: { justifyContent: 'center', paddingTop: 10 }, // Kis padding, hogy igazodjon

    payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 2 },
    payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

    paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    paidText: { color: COLORS.success, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

    deleteIcon: { position: 'absolute', top: 10, right: 10, padding: 5 },

    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: COLORS.textSecondary, fontWeight: 'bold', marginTop: 10, fontSize: 16 }
});

export default RecurringScreen;