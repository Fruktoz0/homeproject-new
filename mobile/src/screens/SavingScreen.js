import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { Card, FloatingActionButton, SectionHeader } from '../components/UIComponents';
import { getSavings, createSavingGoal } from '../services/savingsService';
import { AddSavingModal } from '../components/Modals';

const SavingsScreen = () => {
    const [items, setItems] = useState([]);
    const [isModalVisible, setModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const data = await getSavings();
            setItems(data);
        } catch (e) {
            console.log(e);
        }
    };

    const handleCreate = async (data) => {
        await createSavingGoal(data);
        loadData();
    };

    const renderItem = ({ item }) => {
        // Százalék számítás
        const percent = item.targetAmount ? Math.min(100, Math.round((item.currentAmount / item.targetAmount) * 100)) : 0;

        return (
            <Card style={[styles.card, { borderLeftColor: item.color, borderLeftWidth: 4 }]}>
                <View style={styles.header}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.amount}>{parseInt(item.currentAmount).toLocaleString('hu-HU')} Ft</Text>
                </View>

                {item.targetAmount && (
                    <View style={styles.progressContainer}>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${percent}%`, backgroundColor: item.color }]} />
                        </View>
                        <View style={styles.progressLabels}>
                            <Text style={styles.progressText}>{percent}%</Text>
                            <Text style={styles.progressText}>Cél: {parseInt(item.targetAmount).toLocaleString('hu-HU')}</Text>
                        </View>
                    </View>
                )}
            </Card>
        );
    };

    return (
        <View style={styles.container}>
            <SectionHeader title="Megtakarítási Célok" />
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 80 }}
                ListEmptyComponent={<Text style={styles.empty}>Nincs megtakarítási cél.</Text>}
            />
            <FloatingActionButton icon={<MaterialCommunityIcons name="plus" size={30} color="#fff" />} onPress={() => setModalVisible(true)} />

            {/* ÚJ TRanzakció MODAL */}
            <AddSavingModal
                visible={isModalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleCreate}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    card: { padding: 15, marginBottom: 15 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    name: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    amount: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
    progressContainer: { marginTop: 5 },
    progressBarBg: { height: 8, backgroundColor: COLORS.gray200, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4 },
    progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
    progressText: { fontSize: 11, color: COLORS.textSecondary },
    empty: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 20 }
});

export default SavingsScreen;