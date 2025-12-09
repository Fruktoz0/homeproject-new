import React, { useState, useEffect, useCallback, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, StatusBar, SafeAreaView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons'; // Ikonok

import { AuthContext } from '../context/AuthContext';
import { getTransactions } from '../services/transactionService';
import { getCurrentHousehold } from '../services/householdService';
import { COLORS } from '../constants';
import { Card, SectionHeader, FloatingActionButton } from '../components/UIComponents';

const DashboardScreen = ({ navigation }) => {
    const { userData } = useContext(AuthContext);
    const [transactions, setTransactions] = useState([]);
    const [household, setHousehold] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [totals, setTotals] = useState({ income: 0, expense: 0, balance: 0 });

    // Adatok betöltése
    const loadData = async () => {
        try {
            // 1. Háztartás adatainak lekérése (név, pénznem)
            const hhData = await getCurrentHousehold();
            setHousehold(hhData);

            // 2. Tranzakciók lekérése (jelenlegi hónap)
            const txData = await getTransactions();
            setTransactions(txData);

            // 3. Összesítés számolása
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

    // Amikor a képernyő fókuszba kerül (pl. visszalépünk ide), frissítünk
    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    // --- UI SEGÉDFÜGGVÉNYEK ---
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

    // Tranzakció lista elem renderelése
    const renderItem = ({ item }) => (
        <View style={styles.transactionItem}>
            {/* 1. Ikon a bal oldalon */}
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

            {/* 2. Szöveges tartalom */}
            <View style={styles.transactionContent}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.txDescription}>{item.description}</Text>
                    {item.isRecurringInstance && (
                        <MaterialCommunityIcons name="refresh" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
                    )}
                </View>
                <Text style={styles.txMeta}>
                    {item.category} • {formatDate(item.date)} • {item.creator?.displayName}
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
    );

    return (
        <View style={styles.container}>
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

            {/* --- HEADER (KÉK RÉSZ) --- */}
            <View style={styles.header}>
                <View style={styles.headerTop}>
                    <Text style={styles.headerTitle}>{household?.name || 'Betöltés...'}</Text>
                    <Text style={styles.headerUser}>{userData?.displayName}</Text>
                </View>

                {/* EGYENLEG BLOKK */}
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>Havi Egyenleg</Text>
                    <Text style={styles.balanceValue}>{formatMoney(totals.balance)}</Text>
                </View>
            </View>

            {/* --- STATISZTIKA KÁRTYA (BEVÉTEL/KIADÁS) --- */}
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

            {/* --- LISTA TARTALOM --- */}
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

            {/* --- LEBEGŐ GOMB (FAB) --- */}
            <FloatingActionButton
                icon={<Ionicons name="add" size={30} color="#FFF" />}
                onPress={() => console.log('Új tétel hozzáadása... (Később implementáljuk)')}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // Header stílusok (Íves alj)
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 50, // StatusBar miatt
        paddingHorizontal: 20,
        paddingBottom: 40,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        zIndex: 1,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
    },
    headerTitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
    headerUser: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    balanceContainer: { alignItems: 'center', paddingBottom: 20 },
    balanceLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 5 },
    balanceValue: { color: COLORS.white, fontSize: 36, fontWeight: 'bold' },

    // Statisztika kártya (ami "belóg" a headerbe)
    statsCardContainer: {
        marginTop: -30, // Hogy felcsússzon a kék részre
        paddingHorizontal: 20,
        zIndex: 2,
    },
    statsCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 20,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statLabel: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 4 },
    statValue: { fontSize: 16, fontWeight: 'bold' },
    verticalDivider: { width: 1, backgroundColor: COLORS.gray200 },

    // Lista
    listContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 40, fontStyle: 'italic' },

    // Tranzakció Elem (Row)
    transactionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 12,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.gray100,
        // Kicsi árnyék
        elevation: 1,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    iconIncome: { backgroundColor: 'rgba(160, 212, 104, 0.15)' }, // Success halvány
    iconExpense: { backgroundColor: 'rgba(237, 85, 101, 0.15)' }, // Danger halvány
    transactionContent: { flex: 1 },
    txDescription: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
    txMeta: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: 'bold' }
});

export default DashboardScreen;