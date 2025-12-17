import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity,
    TextInput, KeyboardAvoidingView, Platform, Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/Swipeable';

import { COLORS } from '../constants';
import { addItem, toggleItem, deleteItem, getShoppingLists, updateItemQuantity } from '../services/shoppingService';

const ShoppingDetailScreen = ({ route, navigation }) => {
    const { list } = route.params;
    const [items, setItems] = useState(list.shoppingItems || []);
    const [newItemName, setNewItemName] = useState('');
    const [listStatus, setListStatus] = useState(list.status);
    const [unit, setUnit] = useState('db');

    useEffect(() => {
        refreshItems();
    }, []);

    const refreshItems = async () => {
        try {
            const allLists = await getShoppingLists();
            const currentList = allLists.find(l => l.id === list.id);
            if (currentList) {
                const mappedItems = currentList.shoppingItems.map(i => ({
                    ...i,
                    isBought: i.purchased
                }));
                setItems(mappedItems);
                setListStatus(currentList.status);
                navigation.setOptions({ title: currentList.name });
            }
        } catch (error) {
            console.error("Refresh error:", error);
        }
    };

    const handleAddItem = async () => {
        if (!newItemName.trim()) return;
        try {
            await addItem(list.id, newItemName, unit, 1);
            setNewItemName('');
            setUnit('db');
            Keyboard.dismiss();
            refreshItems();
        } catch (error) {
            console.error("Add item error:", error);
        }
    };

    const handleChangeQuantity = async (item, change) => {
        const currentQty = Math.round(item.quantity || 1);
        const newQty = Math.max(1, currentQty + change);

        if (newQty === currentQty) return;

        setItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: newQty } : i));

        try {
            await updateItemQuantity(item.id, newQty);
        } catch (error) {
            refreshItems();
        }
    };

    const handleToggle = async (item) => {
        try {
            await toggleItem(item.id, !item.isBought);
            refreshItems();
        } catch (error) { console.error(error); }
    };

    const handleDeleteItem = async (itemId) => {
        try {
            await deleteItem(itemId);
            refreshItems();
        } catch (error) { console.error(error); }
    };

    const renderRightActions = (itemId) => (
        <TouchableOpacity style={styles.deleteAction} onPress={() => handleDeleteItem(itemId)}>
            <MaterialCommunityIcons name="trash-can-outline" size={24} color="#FFF" />
        </TouchableOpacity>
    );

    const renderItem = ({ item }) => {
        const timeAdded = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : '';
        const creatorName = item.creator?.displayName || item.added_by || 'Ismeretlen';
        const qtyDisplay = item.quantity ? Math.round(item.quantity) : 1;
        const unitDisplay = item.unit ? item.unit : 'db';

        return (
            <View style={styles.itemWrapper}>
                <Swipeable renderRightActions={() => renderRightActions(item.id)} overshootRight={false}>
                    <View style={styles.itemRow}>
                        <View style={styles.infoSection}>
                            <TouchableOpacity onPress={() => handleToggle(item)}>
                                <MaterialCommunityIcons
                                    name={item.isBought ? "checkbox-marked" : "checkbox-blank-outline"}
                                    size={28}
                                    color={item.isBought ? COLORS.success : COLORS.textSecondary}
                                />
                            </TouchableOpacity>
                            <View style={styles.textContainer}>
                                <Text style={[styles.itemName, item.isBought && styles.itemBoughtText]} numberOfLines={2}>
                                    {item.name}
                                </Text>
                                <Text style={styles.itemTime}>
                                    {creatorName} - {timeAdded}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.controlsSection}>
                            <View style={styles.quantityContainer}>
                                {!item.isBought && (
                                    <TouchableOpacity onPress={() => handleChangeQuantity(item, -1)} style={styles.qtyBtn}>
                                        <MaterialCommunityIcons name="minus" size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                )}

                                <Text style={[styles.itemQtyText, item.isBought && styles.itemBoughtText]}>
                                    {qtyDisplay} {unitDisplay}
                                </Text>

                                {!item.isBought && (
                                    <TouchableOpacity onPress={() => handleChangeQuantity(item, 1)} style={styles.qtyBtn}>
                                        <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </Swipeable>
            </View>
        );
    };

    const UnitChip = ({ label, value }) => (
        <TouchableOpacity
            style={[styles.unitChip, unit === value && styles.unitChipActive]}
            onPress={() => setUnit(value)}
        >
            <Text style={[styles.unitText, unit === value && styles.unitTextActive]}>{label}</Text>
        </TouchableOpacity>
    );

    return (
        <KeyboardAvoidingView
            style={{ flex: 1, backgroundColor: COLORS.background }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 100}
            enabled
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.container}>
                    {listStatus === 'COMPLETED' && (
                        <View style={styles.completedBanner}>
                            <MaterialCommunityIcons name="check-all" size={20} color="#fff" />
                            <Text style={styles.completedText}>Minden beszerezve!</Text>
                        </View>
                    )}

                    <FlatList
                        data={items}
                        renderItem={renderItem}
                        keyExtractor={item => item.id.toString()}
                        contentContainerStyle={{ padding: 15, paddingBottom: 150 }}
                    />

                    <View style={styles.inputWrapper}>
                        <View style={styles.unitSelector}>
                            <UnitChip label="db" value="db" />
                            <UnitChip label="kg" value="kg" />
                            <UnitChip label="liter" value="l" />
                        </View>

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Új termék..."
                                value={newItemName}
                                onChangeText={setNewItemName}
                                onSubmitEditing={handleAddItem}
                            />
                            <TouchableOpacity style={styles.addBtn} onPress={handleAddItem}>
                                <MaterialCommunityIcons name="plus" size={30} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    completedBanner: { backgroundColor: COLORS.success, padding: 8, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    completedText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },

    itemWrapper: { marginBottom: 8, backgroundColor: COLORS.surface, borderRadius: 12, overflow: 'hidden', elevation: 1 },
    itemRow: { flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 70, justifyContent: 'space-between' },

    infoSection: { flex: 1.5, flexDirection: 'row', alignItems: 'center', marginRight: 10 },
    textContainer: { marginLeft: 10, flex: 1 },
    itemName: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '600' },
    itemTime: { fontSize: 10, color: COLORS.textSecondary, marginTop: 2 },
    itemBoughtText: { textDecorationLine: 'line-through', color: COLORS.primary },

    controlsSection: { flex: 1, alignItems: 'flex-end' },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: '#e0e0e0'
    },
    itemQtyText: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: 'bold',
        marginHorizontal: 5,
        minWidth: 45,
        textAlign: 'center'
    },
    qtyBtn: {
        width: 34,
        height: 34,
        justifyContent: 'center',
        alignItems: 'center',
    },

    deleteAction: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 70, height: '100%' },

    inputWrapper: {
        backgroundColor: COLORS.surface,
        padding: 15,
        paddingBottom: Platform.OS === 'ios' ? 35 : 35,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        elevation: 25,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -10 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    unitSelector: { flexDirection: 'row', marginBottom: 12, gap: 6 },
    unitChip: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#f8f9fa', borderWidth: 1, borderColor: '#e0e0e0' },
    unitChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    unitText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: '600' },
    unitTextActive: { color: '#FFF' },

    inputRow: { flexDirection: 'row', alignItems: 'center' },
    input: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 25, paddingHorizontal: 20, height: 50, marginRight: 10, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
    addBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', elevation: 3 }
});

export default ShoppingDetailScreen;