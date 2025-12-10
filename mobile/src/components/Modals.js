import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { Button, Input, SectionHeader } from './UIComponents';

// ALAP MODAL KERET
const BaseModal = ({ visible, onClose, title, children }) => (
    <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}
    >
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

// NAPLÓ RÉSZLETEK MODAL
export const LogDetailsModal = ({ visible, onClose, logItem }) => {
    if (!logItem) return null;

    let details = {};
    try {
        details = JSON.parse(logItem.originalData);
    } catch (e) {
        details = { error: "Nem sikerült betölteni az adatokat." };
    }

    // ÚJ: Művelet nevek magyarítása
    const getActionName = (type) => {
        const types = {
            'CREATE_TRANSACTION': 'Új tranzakció',
            'DELETE_TRANSACTION': 'Tranzakció törlése',
            'CREATE_RECURRING': 'Új fix tétel',
            'UPDATE_RECURRING': 'Fix tétel módosítása',
            'DELETE_RECURRING': 'Fix tétel törlése',
            'CREATE_SAVING': 'Új megtakarítási cél',
            'UPDATE_SAVING_BALANCE': 'Egyenleg módosítás',
            'DELETE_SAVING': 'Megtakarítás törlése',
            'CREATE_HOUSEHOLD': 'Háztartás létrehozása',
            'JOIN_HOUSEHOLD': 'Csatlakozás',
            'APPROVE_MEMBER': 'Tag jóváhagyása',
            'REMOVE_MEMBER': 'Tag eltávolítása',
            'UPDATE_USER_PROFILE': 'Profil frissítése'
        };
        return types[type] || type; // Ha nincs a listában, marad az eredeti
    };

    // Segédfüggvény a mezőnevek magyarítására
    const translateKey = (key) => {
        const map = {
            amount: 'Összeg',
            description: 'Leírás',
            desc: 'Leírás',
            category: 'Kategória',
            type: 'Típus',
            date: 'Dátum',
            name: 'Név',
            target: 'Célösszeg',
            diff: 'Különbség',
            newBalance: 'Új egyenleg',
            reason: 'Ok',
            code: 'Kód',
            memberName: 'Felhasználó',
            householdId: 'Háztartás ID',
            frequency: 'Gyakoriság',
            autoPay: 'Auto-fizetés'
        };
        return map[key] || key;
    };

    // Segédfüggvény az értékek formázására
    const formatValue = (key, value) => {
        if (key === 'amount' || key === 'diff' || key === 'target' || key === 'newBalance') {
            return `${parseInt(value).toLocaleString('hu-HU')} Ft`;
        }
        if (key === 'type') {
            return value === 'INCOME' ? 'Bevétel' : 'Kiadás';
        }
        if (key === 'frequency') {
            const freqMap = { 'MONTHLY': 'Havi', 'QUARTERLY': 'Negyedéves', 'YEARLY': 'Éves' };
            return freqMap[value] || value;
        }
        if (key === 'autoPay') {
            return value ? 'Igen' : 'Nem';
        }
        return String(value);
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="Részletek">
            <View style={styles.logMetaBox}>
                {/* JAVÍTÁS ITT: getActionName használata */}
                <Text style={styles.logMetaText}>Művelet: <Text style={{ fontWeight: 'bold' }}>{getActionName(logItem.actionType)}</Text></Text>

                <Text style={styles.logMetaText}>Dátum: {new Date(logItem.timestamp).toLocaleString('hu-HU')}</Text>
                <Text style={styles.logMetaText}>Végezte: {logItem.actor?.displayName || 'Ismeretlen'}</Text>
            </View>

            <SectionHeader title="Adatok" />

            <View style={styles.detailsContainer}>
                {Object.entries(details).map(([key, value]) => {
                    // Kihagyjuk a technikai mezőket
                    if (['id', 'deletedAt', 'createdBy', 'recurringItemId', 'isRecurringInstance'].includes(key)) return null;

                    return (
                        <View key={key} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{translateKey(key)}:</Text>
                            <Text style={styles.detailValue}>{formatValue(key, value)}</Text>
                        </View>
                    );
                })}
            </View>

            <View style={{ marginTop: 20 }}>
                <Button title="Bezárás" onPress={onClose} variant="ghost-outline" />
            </View>
        </BaseModal>
    );
};

// BEFIZETÉS MODAL (FIX TÉTELHEZ)

export const PaymentModal = ({ visible, onClose, item, onSubmit }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Ma
    const [loading, setLoading] = useState(false);

    // Amikor megnyílik a modal, beállítjuk az alapértelmezett értéket
    React.useEffect(() => {
        if (item) {
            setAmount(item.amount.toString());
        }
    }, [item]);

    const handleSubmit = async () => {
        if (!amount) return Alert.alert("Hiba", "Add meg a végleges összeget!");

        setLoading(true);
        try {
            await onSubmit({
                recurringItemId: item.id,
                amount: parseFloat(amount),
                description: item.name,
                type: 'EXPENSE',
                date: date
            });
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen rögzítés");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <BaseModal visible={visible} onClose={onClose} title="Tétel Befizetése">

            {/* Tervezett vs Tényleges Összehasonlítás */}
            <View style={styles.comparisonBox}>
                <View style={styles.compItem}>
                    <Text style={styles.compLabel}>Tervezett</Text>
                    <Text style={styles.compValue}>{parseInt(item.amount).toLocaleString('hu-HU')} Ft</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={24} color={COLORS.textSecondary} />
                <View style={styles.compItem}>
                    <Text style={styles.compLabel}>Fizetendő</Text>
                    <Text style={[styles.compValue, { color: COLORS.primary }]}>
                        {amount ? parseInt(amount).toLocaleString('hu-HU') : '0'} Ft
                    </Text>
                </View>
            </View>

            <Input
                label="Végleges Összeg"
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />

            <Input
                label="Dátum (YYYY-MM-DD)"
                placeholder="2023-11-25"
                value={date}
                onChangeText={setDate}
            />

            <View style={{ marginTop: 20 }}>
                <Button
                    title={loading ? "Rögzítés..." : "Befizetés Rögzítése"}
                    onPress={handleSubmit}
                    variant="success"
                />
            </View>
        </BaseModal>
    );
};

// 6. TRANZAKCIÓ RÉSZLETEK MODAL (Befizetett fix tételhez)
export const TransactionDetailsModal = ({ visible, onClose, transaction }) => {
    if (!transaction) return null;

    const formatMoney = (amount) =>
        new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

    return (
        <BaseModal visible={visible} onClose={onClose} title="Befizetés Részletei">
            <View style={styles.detailHeader}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.success + '20' }]}>
                    <MaterialCommunityIcons name="check" size={32} color={COLORS.success} />
                </View>
                <Text style={styles.detailTitle}>{transaction.description}</Text>
                <Text style={styles.detailAmount}>{formatMoney(transaction.amount)}</Text>
            </View>

            <View style={styles.detailList}>
                <DetailRow label="Kategória" value={transaction.category} icon="tag-outline" />
                <DetailRow label="Dátum" value={new Date(transaction.date).toLocaleDateString('hu-HU')} icon="calendar-month" />
                <DetailRow label="Fizette" value={transaction.creator?.displayName || 'Ismeretlen'} icon="account-outline" />
                {transaction.description !== transaction.recurringItem?.name && (
                    <DetailRow label="Eredeti név" value={transaction.recurringItem?.name} icon="text-short" />
                )}
            </View>

            <View style={{ marginTop: 25 }}>
                <Button title="Bezárás" onPress={onClose} variant="ghost-outline" />
            </View>
        </BaseModal>
    );
};

// Segéd komponens a sorokhoz
const DetailRow = ({ label, value, icon }) => (
    <View style={styles.detailRowItem}>
        <View style={styles.detailRowLeft}>
            <MaterialCommunityIcons name={icon} size={20} color={COLORS.textSecondary} style={{ marginRight: 10 }} />
            <Text style={styles.detailRowLabel}>{label}</Text>
        </View>
        <Text style={styles.detailRowValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },

    // Type Switcher
    typeSwitch: {
        flexDirection: 'row',
        backgroundColor: COLORS.gray100,
        borderRadius: 10,
        padding: 4,
        marginBottom: 20
    },
    typeBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 8
    },
    typeBtnActiveExp: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 2
    },
    typeBtnActiveInc: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        elevation: 2
    },
    typeText: {
        fontWeight: 'bold',
        color: COLORS.textSecondary
    },

    // Category Chips
    catContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8
    },
    catChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.gray100,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    catChipActive: {
        backgroundColor: '#EBF4FF',
        borderColor: COLORS.primary
    },
    catText: {
        fontSize: 12,
        color: COLORS.textSecondary
    },
    catTextActive: {
        color: COLORS.primary,
        fontWeight: 'bold'
    },

    // Freq buttons     
    rowBtnContainer: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 15
    },
    smallBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 8
    },
    smallBtnActive: {
        backgroundColor: COLORS.primary
    },
    smallBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary
    },

    // Switch
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        paddingVertical: 5
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary
    },

    // Date Grid
    payDayContainer: {
        marginBottom: 20,
        backgroundColor: COLORS.gray100,
        padding: 10,
        borderRadius: 10
    },
    inputLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 10
    },
    dayGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center'
    },
    dayCell: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center'
    },
    dayCellActive: {
        backgroundColor: COLORS.primary
    },
    dayText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: COLORS.textSecondary
    },

    logMetaBox: {
        backgroundColor: COLORS.gray100,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
    },
    logMetaText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4
    },
    detailsContainer: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 10,
        padding: 15
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.gray100
    },
    detailLabel: {
        color: COLORS.textSecondary,
        fontSize: 14
    },
    detailValue: {
        color: COLORS.textPrimary,
        fontWeight: 'bold',
        fontSize: 14,
        maxWidth: '60%',
        textAlign: 'right'
    },
    comparisonBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        padding: 15,
        borderRadius: 10,
        marginBottom: 20
    },
    compItem: {
        alignItems: 'center'
    },
    compLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
        textTransform: 'uppercase'
    },
    compValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    // Transaction Detail Styles
    detailHeader: { alignItems: 'center', marginBottom: 25, borderBottomWidth: 1, borderBottomColor: COLORS.gray100, paddingBottom: 20 },
    iconCircle: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    detailTitle: { fontSize: 18, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 5 },
    detailAmount: { fontSize: 24, fontWeight: 'bold', color: COLORS.success },
    detailList: { gap: 15 },
    detailRowItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailRowLeft: { flexDirection: 'row', alignItems: 'center' },
    detailRowLabel: { fontSize: 14, color: COLORS.textSecondary },
    detailRowValue: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
});