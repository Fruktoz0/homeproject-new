import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, RefreshControl, StatusBar } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { COLORS } from '../constants';
import { FloatingActionButton, Input, Button } from '../components/UIComponents';
import { BaseModal } from '../components/Modals';
import { getShoppingLists, createShoppingList, deleteShoppingList } from '../services/shoppingService';

const ShoppingListScreen = ({ navigation }) => {
    const [lists, setLists] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [newListName, setNewListName] = useState('');

    const loadData = async () => {
        try {
            const data = await getShoppingLists();
            setLists(data);
        } catch (e) { console.log(e); }
    };

    useFocusEffect(useCallback(() => { loadData(); }, []));

    const handleCreate = async () => {
        if (!newListName) return;
        await createShoppingList(newListName);
        setNewListName('');
        setModalVisible(false);
        loadData();
    };

    const handleDelete = (id) => {
        Alert.alert("Törlés", "Biztosan törlöd a listát?", [
            { text: "Mégsem", style: "cancel" },
            {
                text: "Törlés", style: "destructive", onPress: async () => {
                    await deleteShoppingList(id);
                    loadData();
                }
            }
        ]);
    };

    const renderRightActions = (id) => (
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDelete(id)}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFF" />
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => {
        const isCompleted = item.status === 'COMPLETED';
        const totalItems = item.shoppingItems ? item.shoppingItems.length : 0;
        const boughtItems = item.shoppingItems ? item.shoppingItems.filter(i => i.isBought).length : 0;

        return (
            <View style={styles.itemWrapper}>
                <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
                    <TouchableOpacity
                        style={[styles.listItem, isCompleted && styles.completedItem]}
                        onPress={() => navigation.navigate('ShoppingDetail', { list: item })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBox}>
                            <MaterialCommunityIcons
                                name={isCompleted ? "check-circle" : "cart-outline"}
                                size={24}
                                color={isCompleted ? COLORS.success : COLORS.primary}
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.listName, isCompleted && { textDecorationLine: 'line-through', color: COLORS.textSecondary }]}>
                                {item.name}
                            </Text>
                            <Text style={styles.listMeta}>
                                {boughtItems}/{totalItems} megvásárolva
                            </Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray200} />
                    </TouchableOpacity>
                </Swipeable>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* STÁTUSZSOR SZÍNEZÉSE (Hogy beleolvadjon a fejlécbe) */}
            <StatusBar backgroundColor={COLORS.primary} barStyle="light-content" />

            {/* ÚJ, KÉK DESIGN HEADER */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Bevásárlás</Text>
                <Text style={styles.headerSubtitle}>Aktív listáid kezelése</Text>
            </View>

            {/* LISTA */}
            <FlatList
                data={lists}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[COLORS.primary]} tintColor="#fff" />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialCommunityIcons name="cart-off" size={60} color={COLORS.gray200} />
                        <Text style={styles.emptyText}>Nincs még bevásárlólistád.</Text>
                        <Text style={styles.emptySubText}>Hozz létre egyet a + gombbal!</Text>
                    </View>
                }
            />

            <FloatingActionButton
                icon={<MaterialCommunityIcons name="plus" size={30} color="#FFF" />}
                onPress={() => setModalVisible(true)}
            />

            <BaseModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Új lista">
                <Input label="Lista neve" value={newListName} onChangeText={setNewListName} placeholder="Pl. Hétvégi nagybevásárlás" />
                <View style={{ marginTop: 20 }}>
                    <Button title="Létrehozás" onPress={handleCreate} />
                </View>
            </BaseModal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // --- ÚJ HEADER STYLE (A Dashboard mintájára) ---
    header: {
        backgroundColor: COLORS.primary,
        paddingTop: 60,      // Notch helye
        paddingBottom: 30,   // Hely a szöveg alatt
        paddingHorizontal: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        // Kis árnyék, hogy kiemelkedjen
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        zIndex: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },

    // --- LISTA STÍLUSOK ---
    listContent: {
        padding: 20,
        paddingTop: 20, // Hogy ne tapadjon a kék header aljához
        paddingBottom: 100 // Hely a FAB-nak
    },
    itemWrapper: { marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: COLORS.surface, elevation: 2 },
    listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: COLORS.surface },
    completedItem: { opacity: 0.8, backgroundColor: '#FAFAFA' },

    iconBox: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    listName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    listMeta: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4 },
    deleteAction: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' },

    // Empty state
    emptyContainer: { alignItems: 'center', marginTop: 60 },
    emptyText: { fontSize: 18, fontWeight: 'bold', color: COLORS.textSecondary, marginTop: 15 },
    emptySubText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 }
});

export default ShoppingListScreen;