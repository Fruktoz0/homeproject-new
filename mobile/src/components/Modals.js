import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { Button, Input, SectionHeader } from './UIComponents';

// ALAP MODAL KERET
const BaseModal = ({ visible, onClose, title, children }) => (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
        <View style={styles.overlay}>
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    <TouchableOpacity onPress={onClose}>
                        <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={{ padding: 20 }}>
                    {children}
                </ScrollView>
            </View>
        </View>
    </Modal>
);

// KATEGÓRIA VÁLASZTÓ (Egyszerű Gombok)
const CategorySelector = ({ selected, onSelect }) => (
    <View style={styles.catContainer}>
        {CATEGORIES.map(cat => (
            <TouchableOpacity
                key={cat}
                style={[styles.catChip, selected === cat && styles.catChipActive]}
                onPress={() => onSelect(cat)}
            >
                <Text style={[styles.catText, selected === cat && styles.catTextActive]}>{cat}</Text>
            </TouchableOpacity>
        ))}
    </View>
);

// ÚJ TRANZAKCIÓ MODAL
export const AddTransactionModal = ({ visible, onClose, onSubmit }) => {
    const [type, setType] = useState('EXPENSE');
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !desc) return Alert.alert("Hiba", "Töltsd ki az összeget és a leírást!");
        setLoading(true);
        try {
            await onSubmit({
                type,
                amount: parseFloat(amount),
                description: desc,
                category,
                date: new Date().toISOString().split('T')[0] // Mai dátum
            });
            // Reset
            setAmount(''); setDesc(''); setType('EXPENSE');
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen mentés");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="Új Tranzakció">
            {/* Típus váltó */}
            <View style={styles.typeSwitch}>
                <TouchableOpacity
                    style={[styles.typeBtn, type === 'EXPENSE' && styles.typeBtnActiveExp]}
                    onPress={() => setType('EXPENSE')}
                >
                    <Text style={[styles.typeText, type === 'EXPENSE' && { color: COLORS.danger }]}>Kiadás</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.typeBtn, type === 'INCOME' && styles.typeBtnActiveInc]}
                    onPress={() => setType('INCOME')}
                >
                    <Text style={[styles.typeText, type === 'INCOME' && { color: COLORS.success }]}>Bevétel</Text>
                </TouchableOpacity>
            </View>

            <Input label="Összeg" placeholder="0" keyboardType="numeric" value={amount} onChangeText={setAmount} />
            <Input label="Leírás" placeholder="Pl. Nagybevásárlás" value={desc} onChangeText={setDesc} />

            <SectionHeader title="Kategória" />
            <CategorySelector selected={category} onSelect={setCategory} />

            <View style={{ marginTop: 20 }}>
                <Button title={loading ? "Mentés..." : "Hozzáadás"} onPress={handleSubmit} variant={type === 'INCOME' ? 'success' : 'primary'} />
            </View>
        </BaseModal>
    );
};

// ÚJ FIX TÉTEL MODAL
export const AddRecurringModal = ({ visible, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState('MONTHLY');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [autoPay, setAutoPay] = useState(false);
    const [payDay, setPayDay] = useState(1);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name || !amount) return Alert.alert("Hiba", "Hiányzó adatok!");
        setLoading(true);
        try {
            await onSubmit({
                name,
                amount: parseFloat(amount),
                frequency,
                category,
                autoPay,
                payDay: autoPay ? payDay : null
            });
            setName(''); setAmount(''); setAutoPay(false);
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen mentés");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="Új Fix Tétel">
            <Input label="Megnevezés" placeholder="Pl. Internet" value={name} onChangeText={setName} />
            <Input label="Összeg" placeholder="0" keyboardType="numeric" value={amount} onChangeText={setAmount} />

            <SectionHeader title="Gyakoriság" />
            <View style={styles.rowBtnContainer}>
                {['MONTHLY', 'QUARTERLY', 'YEARLY'].map(freq => (
                    <TouchableOpacity
                        key={freq}
                        style={[styles.smallBtn, frequency === freq && styles.smallBtnActive]}
                        onPress={() => setFrequency(freq)}
                    >
                        <Text style={[styles.smallBtnText, frequency === freq && { color: '#fff' }]}>
                            {freq === 'MONTHLY' ? 'Havi' : freq === 'QUARTERLY' ? 'Negyedéves' : 'Éves'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Automatikus rögzítés</Text>
                <Switch value={autoPay} onValueChange={setAutoPay} trackColor={{ false: COLORS.gray200, true: COLORS.primary }} />
            </View>

            {autoPay && (
                <View style={styles.payDayContainer}>
                    <Text style={styles.inputLabel}>Fordulónap: <Text style={{ fontWeight: 'bold', color: COLORS.primary }}>{payDay}.</Text></Text>
                    <View style={styles.dayGrid}>
                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                            <TouchableOpacity
                                key={day}
                                style={[styles.dayCell, payDay === day && styles.dayCellActive]}
                                onPress={() => setPayDay(day)}
                            >
                                <Text style={[styles.dayText, payDay === day && { color: '#fff' }]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            <SectionHeader title="Kategória" />
            <CategorySelector selected={category} onSelect={setCategory} />

            <View style={{ marginTop: 20 }}>
                <Button title={loading ? "Mentés..." : "Létrehozás"} onPress={handleSubmit} />
            </View>
        </BaseModal>
    );
};

// ÚJ MEGTAKARÍTÁS MODAL
export const AddSavingModal = ({ visible, onClose, onSubmit }) => {
    const [name, setName] = useState('');
    const [initial, setInitial] = useState('');
    const [target, setTarget] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name) return Alert.alert("Hiba", "Adj nevet a célnak!");
        setLoading(true);
        try {
            await onSubmit({
                name,
                currentAmount: initial ? parseFloat(initial) : 0,
                targetAmount: target ? parseFloat(target) : null,
                color: '#5D9CEC'
            });
            setName(''); setInitial(''); setTarget('');
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen mentés");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="Új Megtakarítás">
            <Input label="Cél neve" placeholder="Pl. Nyaralás" value={name} onChangeText={setName} />
            <Input label="Kezdőösszeg" placeholder="0" keyboardType="numeric" value={initial} onChangeText={setInitial} />
            <Input label="Célösszeg (Opcionális)" placeholder="0" keyboardType="numeric" value={target} onChangeText={setTarget} />

            <View style={{ marginTop: 20 }}>
                <Button title={loading ? "Mentés..." : "Létrehozás"} onPress={handleSubmit} />
            </View>
        </BaseModal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContainer: { backgroundColor: COLORS.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },

    // Type Switcher
    typeSwitch: { flexDirection: 'row', backgroundColor: COLORS.gray100, borderRadius: 10, padding: 4, marginBottom: 20 },
    typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
    typeBtnActiveExp: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
    typeBtnActiveInc: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
    typeText: { fontWeight: 'bold', color: COLORS.textSecondary },

    // Category Chips
    catContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    catChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.gray100, borderWidth: 1, borderColor: 'transparent' },
    catChipActive: { backgroundColor: '#EBF4FF', borderColor: COLORS.primary },
    catText: { fontSize: 12, color: COLORS.textSecondary },
    catTextActive: { color: COLORS.primary, fontWeight: 'bold' },

    // Freq buttons
    rowBtnContainer: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    smallBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: COLORS.gray100, borderRadius: 8 },
    smallBtnActive: { backgroundColor: COLORS.primary },
    smallBtnText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary },

    // Switch
    switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingVertical: 5 },
    switchLabel: { fontSize: 16, fontWeight: '500', color: COLORS.textPrimary },

    // Date Grid
    payDayContainer: { marginBottom: 20, backgroundColor: COLORS.gray100, padding: 10, borderRadius: 10 },
    inputLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 10 },
    dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center' },
    dayCell: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    dayCellActive: { backgroundColor: COLORS.primary },
    dayText: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSecondary }
});