import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getRecurringItems, createRecurringItem, deleteRecurringItem } from '../services/recurringService';
import { getTransactions, createTransaction } from '../services/transactionService';
import { getStartOfMonth, getEndOfMonth, formatDateToISO, addMonths, formatMonthYear } from '../utils/dateUtils';
import { COLORS } from '../constants';
import { Card, FloatingActionButton, SectionHeader, Button } from '../components/UIComponents';
import { AddRecurringModal, PaymentModal, TransactionDetailsModal } from '../components/Modals';

const RecurringScreen = () => {
    const [currentDate, setCurrentDate] = useState(new Date()); // A naptár szerinti nézet
    const [realDate, setRealDate] = useState(new Date()); // A valós mai nap (referenciának)

    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modals
    const [isAddModalVisible, setAddModalVisible] = useState(false);
    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const [isDetailModalVisible, setDetailModalVisible] = useState(false);

    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [paymentDate, setPaymentDate] = useState(''); // Ezt adjuk át a modalnak

    const loadData = async () => {
        try {
            const recurringData = await getRecurringItems();
            setAllItems(recurringData);

            const start = formatDateToISO(getStartOfMonth(currentDate));
            const end = formatDateToISO(getEndOfMonth(currentDate));
            const txData = await getTransactions(start, end);
            setTransactions(txData);

            filterItemsForMonth(recurringData, currentDate);
        } catch (e) {
            console.log("Hiba a betöltéskor:", e);
        }
    };

    // --- LOGIKA: Jövőben vagyunk-e? ---
    const isFutureMonth = () => {
        const viewYear = currentDate.getFullYear();
        const viewMonth = currentDate.getMonth();

        const realYear = realDate.getFullYear();
        const realMonth = realDate.getMonth();

        if (viewYear > realYear) return true;
        if (viewYear === realYear && viewMonth > realMonth) return true;
        return false;
    };

    const filterItemsForMonth = (items, viewDate) => {
        const viewYear = viewDate.getFullYear();
        const viewMonth = viewDate.getMonth();

        const filtered = items.filter(item => {
            if (!item.active) return false;
            const start = item.startDate ? new Date(item.startDate) : new Date();
            const startYear = start.getFullYear();
            const startMonth = start.getMonth();
            const monthDiff = (viewYear - startYear) * 12 + (viewMonth - startMonth);

            if (monthDiff < 0) return false;

            switch (item.frequency) {
                case 'MONTHLY': return true;
                case 'BIMONTHLY': return monthDiff % 2 === 0;
                case 'QUARTERLY': return monthDiff % 3 === 0;
                case 'YEARLY': return monthDiff % 12 === 0;
                default: return true;
            }
        });
        setFilteredItems(filtered);
    };

    useEffect(() => {
        loadData();
    }, [currentDate]);

    useFocusEffect(
        useCallback(() => {
            setRealDate(new Date()); // Frissítjük a valós időt, ha visszatérünk
            loadData();
        }, [currentDate])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));

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
        Alert.alert("Törlés", `Biztosan törölni szeretnéd a(z) "${item.name}" tételt?`, [
            { text: "Mégsem", style: "cancel" },
            {
                text: "Törlés", style: "destructive", onPress: async () => {
                    await deleteRecurringItem(item.id);
                    loadData();
                }
            }
        ]);
    };

    const openPayModal = (item) => {
        setSelectedItem(item);

        // JAVÍTÁS: Kiszámoljuk a helyes dátumot az adott hónapra
        // Ha van 'payDay', akkor azt a napot vesszük a NÉZETT hónapban
        // Ha nincs, akkor elsejét, vagy a mai napot (ha ugyanaz a hónap)
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        let targetDay = item.payDay || 1;
        // Figyelünk a hónap hosszára (pl. februárban ne legyen 30.)
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        if (targetDay > daysInMonth) targetDay = daysInMonth;

        const calculatedDate = new Date(year, month, targetDay);
        setPaymentDate(formatDateToISO(calculatedDate));

        setPayModalVisible(true);
    };

    const openDetailModal = (tx) => {
        setSelectedTransaction(tx);
        setDetailModalVisible(true);
    };

    const handlePay = async (txData) => {
        console.log("Küldött adatok:", txData);
        await createTransaction(txData);
        loadData();
    };

    const formatMoney = (amount) => new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

    // --- RENDER ---

    const renderItem = ({ item }) => {
        const paidTx = transactions.find(t => t.recurringItemId === item.id);
        const isPaid = !!paidTx;
        const isFuture = isFutureMonth(); // Ellenőrzés

        const CardContent = (
            <View style={styles.row}>
                <View style={styles.infoContainer}>
                    <View style={styles.headerRow}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.category}>{item.category}</Text>
                    </View>
                    <Text style={styles.plannedText}>Tervezett: <Text style={styles.plannedAmount}>{formatMoney(item.amount)}</Text></Text>
                    {isPaid && (
                        <Text style={styles.actualText}>Fizetve: <Text style={styles.actualAmount}>{formatMoney(paidTx.amount)}</Text></Text>
                    )}
                    <View style={styles.badgeContainer}>
                        <View style={styles.freqBadge}>
                            <Text style={styles.freqText}>
                                {item.frequency === 'MONTHLY' ? 'Havi' : item.frequency === 'BIMONTHLY' ? '2 Havi' : item.frequency === 'QUARTERLY' ? 'Negyedéves' : 'Éves'}
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

                <View style={styles.actionContainer}>
                    {isPaid ? (
                        <View style={styles.paidBadge}>
                            <MaterialCommunityIcons name="check" size={14} color={COLORS.success} />
                            <Text style={styles.paidText}>Befizetve</Text>
                        </View>
                    ) : isFuture ? (
                        // JAVÍTÁS: Ha jövőben van, inaktív állapot
                        <View style={styles.futureBadge}>
                            <MaterialCommunityIcons name="clock-outline" size={14} color={COLORS.textSecondary} />
                            <Text style={styles.futureText}>Jövőbeli</Text>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.payBtn} onPress={() => openPayModal(item)}>
                            <Text style={styles.payBtnText}>Befizetés</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        );

        return (
            <Card style={styles.card}>
                {isPaid ? (
                    <TouchableOpacity onPress={() => openDetailModal(paidTx)} activeOpacity={0.7}>
                        {CardContent}
                    </TouchableOpacity>
                ) : CardContent}
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteIcon}>
                    <MaterialCommunityIcons name="close" size={18} color={COLORS.gray200} />
                </TouchableOpacity>
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.dateSelector}>
                    <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                    <Text style={styles.headerDate}>{formatMonthYear(currentDate)}</Text>
                    <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
                        <MaterialCommunityIcons name="chevron-right" size={28} color="rgba(255,255,255,0.8)" />
                    </TouchableOpacity>
                </View>
                <Text style={styles.subTitle}>Fix költségek erre a hónapra</Text>
            </View>

            <View style={styles.listContainer}>
                <FlatList
                    data={filteredItems}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="calendar-check" size={50} color={COLORS.gray200} />
                            <Text style={styles.emptyText}>Erre a hónapra nincs esedékes fix tétel.</Text>
                        </View>
                    }
                />
            </View>

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
                defaultDate={paymentDate} // ÁTADJUK A SZÁMÍTOTT DÁTUMOT
            />

            <TransactionDetailsModal
                visible={isDetailModalVisible}
                transaction={selectedTransaction}
                onClose={() => setDetailModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 20, borderBottomLeftRadius: 30, borderBottomRightRadius: 30, alignItems: 'center', marginBottom: 10 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    headerDate: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize', minWidth: 150, textAlign: 'center' },
    arrowBtn: { padding: 5 },
    subTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 5 },
    listContainer: { flex: 1, padding: 20, paddingTop: 10 },
    card: { padding: 15, marginBottom: 12, paddingRight: 30 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    infoContainer: { flex: 1, marginRight: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    categoryDot: { marginHorizontal: 5, color: COLORS.textSecondary },
    category: { fontSize: 12, color: COLORS.textSecondary },
    plannedText: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 },
    plannedAmount: { fontWeight: 'bold', color: COLORS.textSecondary },
    actualText: { fontSize: 12, color: COLORS.success, marginBottom: 8, fontWeight: '600' },
    actualAmount: { fontWeight: 'bold' },
    badgeContainer: { flexDirection: 'row', gap: 6 },
    freqBadge: { backgroundColor: COLORS.gray200, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    freqText: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', textTransform: 'uppercase' },
    autoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFCE54', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    autoText: { fontSize: 10, fontWeight: 'bold', color: '#8a6d3b', marginLeft: 2 },
    actionContainer: { justifyContent: 'center', paddingTop: 10 },

    payBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, elevation: 2 },
    payBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
    paidBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    paidText: { color: COLORS.success, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

    // ÚJ: Jövőbeli státusz
    futureBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.gray100, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    futureText: { color: COLORS.textSecondary, fontWeight: 'bold', fontSize: 12, marginLeft: 4 },

    deleteIcon: { position: 'absolute', top: 10, right: 10, padding: 5 },
    emptyContainer: { alignItems: 'center', marginTop: 50 },
    emptyText: { color: COLORS.textSecondary, fontWeight: 'bold', marginTop: 10, fontSize: 16 }
});

export default RecurringScreen;