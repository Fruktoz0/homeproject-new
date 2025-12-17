import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, StatusBar, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { AuthContext } from '../context/AuthContext';
import { getTransactions, createTransaction, deleteTransaction } from '../services/transactionService';
import { getCurrentHousehold } from '../services/householdService';
import { COLORS } from '../constants';
import { Card, SectionHeader, FloatingActionButton } from '../components/UIComponents';
import { AddTransactionModal } from '../components/Modals';
import { getStartOfMonth, getEndOfMonth, addMonths, formatMonthYear, formatDateToISO } from '../utils/dateUtils';

const DashboardScreen = ({ navigation }) => {
    const { userData } = useContext(AuthContext);

    // Dátum és adatok state
    const [currentDate, setCurrentDate] = useState(new Date());
    const [transactions, setTransactions] = useState([]);
    const [household, setHousehold] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });
    const [isModalVisible, setModalVisible] = useState(false);

    // Adatok betöltése
    const loadData = async () => {
        try {
            const hhData = await getCurrentHousehold();
            setHousehold(hhData);

            const start = formatDateToISO(getStartOfMonth(currentDate));
            const end = formatDateToISO(getEndOfMonth(currentDate));

            const txData = await getTransactions(start, end);
            setTransactions(txData);

            let inc = 0, exp = 0;
            txData.forEach(t => {
                if (t.type === 'INCOME') inc += Number(t.amount);
                else exp += Number(t.amount);
            });
            setTotals({ income: inc, expense: exp, balance: inc - exp });

        } catch (error) {
            console.log("Adatbetöltési hiba:", error);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    useEffect(() => {
        loadData();
    }, [currentDate]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [currentDate])
    );

    const handleAddTransaction = async (data) => {
        await createTransaction(data);
        loadData();
    };

    // --- TÖRLÉS KEZELÉSE ---
    const handleDeleteItem = (item) => {
        Alert.alert(
            "Törlés megerősítése",
            `Biztosan törölni szeretnéd?\n${item.description} (${formatMoney(item.amount)})`,
            [
                { text: "Mégsem", style: "cancel" },
                {
                    text: "Törlés",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteTransaction(item.id);
                            loadData();
                        } catch (error) {
                            Alert.alert("Hiba", "Nem sikerült a törlés.");
                        }
                    }
                }
            ]
        );
    };

    // Dátum léptetés
    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(addMonths(currentDate, -1));

    // Formázók
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: household?.currency || 'HUF',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getMonth() + 1}.${date.getDate()}.`;
    };

    // --- RENDERELÉS ---

    // A piros sáv (Jobb oldali akció)
    const renderRightActions = (progress, dragX, item) => {
        return (
            <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => handleDeleteItem(item)}
            >
                <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFF" />
                <Text style={styles.deleteText}>Törlés</Text>
            </TouchableOpacity>
        );
    };

    const renderItem = ({ item }) => (
        // FONTOS: A margót a külső View-ra tesszük, hogy a Swipeable ne csússzon el
        <View style={styles.itemWrapper}>
            <Swipeable
                renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
                overshootRight={false} // Hogy ne lehessen túlhúzni
            >
                <View style={styles.transactionItem}>
                    {/* 1. Ikon */}
                    <View style={[
                        styles.iconContainer,
                        item.type === 'INCOME' ? styles.iconIncome : styles.iconExpense
                    ]}>
                        <MaterialCommunityIcons
                            name={item.type === 'INCOME' ? 'arrow-down' : 'arrow-up'}
                            size={20}
                            color={item.type === 'INCOME' ? COLORS.success : COLORS.danger}
                        />
                    </View>

                    {/* 2. Tartalom */}
                    <View style={styles.transactionContent}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.txDescription}>{item.description}</Text>
                            {item.isRecurringInstance && (
                                <MaterialCommunityIcons name="refresh" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                            )}
                        </View>
                        <Text style={styles.txMeta}>
                            {item.category} - {formatDate(item.date)} - {item.creator?.displayName}
                        </Text>
                    </View>

                    {/* 3. Összeg */}
                    <Text style={[
                        styles.txAmount,
                        item.type === 'INCOME' ? { color: COLORS.success } : { color: COLORS.textPrimary }
                    ]}>
                        {item.type === 'INCOME' ? '+' : '-'}{formatMoney(item.amount)}
                    </Text>
                </View>
            </Swipeable>
        </View>
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <View style={styles.dateSelector}>
                        <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
                            <MaterialCommunityIcons name="chevron-left" size={28} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                        <Text style={styles.headerDate}>{formatMonthYear(currentDate)}</Text>
                        <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
                            <MaterialCommunityIcons name="chevron-right" size={28} color="rgba(255,255,255,0.8)" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Havi Egyenleg</Text>
                    <Text style={styles.balanceValue}>{formatMoney(totals.balance)}</Text>
                </View>
            </View>

            {/* STATISZTIKA KÁRTYA */}
            <View style={styles.statsCardContainer}>
                <Card style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>BEVÉTEL</Text>
                        <Text style={[styles.statValue, { color: COLORS.success }]}>
                            {formatMoney(totals.income)}
                        </Text>
                    </View>
                    <View style={styles.verticalDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statLabel}>KIADÁS</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>
                            {formatMoney(totals.expense)}
                        </Text>
                    </View>
                </Card>
            </View>

            {/* LISTA */}
            <View style={styles.listContainer}>
                <SectionHeader title="Tranzakciók" />
                <FlatList
                    data={transactions}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    contentContainerStyle={{ paddingBottom: 100 }}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />
                    }
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>Nincs tranzakció ebben a hónapban.</Text>
                    }
                />
            </View>

            <FloatingActionButton
                icon={<Ionicons name="add" size={30} color="#FFF" />}
                onPress={() => setModalVisible(true)}
            />

            <AddTransactionModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleAddTransaction}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 1,
    },
    headerTop: { alignItems: 'center', marginBottom: 20 },
    dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    headerDate: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize', minWidth: 150, textAlign: 'center' },
    arrowBtn: { padding: 5 },
    balanceContainer: { alignItems: 'center', paddingBottom: 20 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceValue: { color: COLORS.white, fontSize: 36, fontWeight: 'bold' },

    statsCardContainer: { marginTop: -30, paddingHorizontal: 20, zIndex: 2 },
    statsCard: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 20 },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold' },
    verticalDivider: { width: 1, backgroundColor: COLORS.gray200 },

    listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontStyle: 'italic' },

    // --- SWIPEABLE STÍLUSOK ---

    // Külső tároló a margóhoz (hogy a swipe szép legyen)
    itemWrapper: {
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden', // Ez fontos, hogy a sarkok kerekítve maradjanak húzáskor
        backgroundColor: COLORS.surface // Háttérszín a biztonság kedvéért
    },

    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        // Itt már nem kell borderRadius, mert a Wrapper intézi, vagy maradhat
        height: 70, // Fix magasság segít a swipe-nak
    },

    deleteAction: {
        backgroundColor: COLORS.danger,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        height: '100%',
    },
    deleteText: { color: '#FFF', fontWeight: 'bold', fontSize: 12, marginTop: 5 },

    // Belső elemek stílusa
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconIncome: { backgroundColor: 'rgba(160, 212, 104, 0.15)' },
    iconExpense: { backgroundColor: 'rgba(237, 85, 101, 0.15)' },
    transactionContent: { flex: 1 },
    txDescription: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    txMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: 'bold' }
});

export default DashboardScreen;