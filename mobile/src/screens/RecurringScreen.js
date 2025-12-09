import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { Card, FloatingActionButton, SectionHeader } from '../components/UIComponents';
import { getRecurringItems, createRecurringItem } from '../services/recurringService';
import { AddRecurringModal } from '../components/Modals';

const RecurringScreen = () => {
    const [items, setItems] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const data = await getRecurringItems();
            setItems(data);
        } catch (e) {
            console.log(e);
        }
    };

    const handleCreate = async (data) => {
        await createRecurringItem(data);
        loadData();
    };


    const renderItem = ({ item }) => (
        <Card style={styles.card}>
            <View style={styles.row}>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <View style={styles.badgeContainer}>
                        <Text style={styles.badge}>{item.frequency === 'MONTHLY' ? 'Havi' : 'Éves'}</Text>
                        {item.autoPay && (
                            <View style={styles.autoBadge}>
                                <MaterialCommunityIcons name="lightning-bolt" size={10} color={COLORS.white} />
                                <Text style={styles.autoText}>AUTO</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Text style={styles.amount}>{parseInt(item.amount).toLocaleString('hu-HU')} Ft</Text>
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <SectionHeader title="Fix Költségek" />
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                ListEmptyComponent={<Text style={styles.empty}>Nincs beállítva fix költség.</Text>}
            />
            <FloatingActionButton icon={<MaterialCommunityIcons name="plus" size={30} color="#fff" />} onPress={() => setModalVisible(true)} />

            {/* ÚJ TRanzakció MODAL */}
            <AddRecurringModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    card: { padding: 15, marginBottom: 10 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
    amount: { fontSize: 16, fontWeight: 'bold', color: COLORS.danger },
    badgeContainer: { flexDirection: 'row', marginTop: 5, alignItems: 'center' },
    badge: { fontSize: 10, backgroundColor: COLORS.gray200, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, color: COLORS.textSecondary, marginRight: 5, overflow: 'hidden' },
    autoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFCE54', paddingHorizontal: 4, paddingVertical: 2, borderRadius: 4 },
    autoText: { fontSize: 9, fontWeight: 'bold', color: '#8a6d3b', marginLeft: 2 },
    empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }
});

export default RecurringScreen;