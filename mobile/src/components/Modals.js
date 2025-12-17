import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, KeyboardAvoidingView, Platform, } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, CATEGORIES } from '../constants';
import { Button, Input, SectionHeader } from './UIComponents';
import { getAuditLogs } from '../services/auditLogService';


// ALAP MODAL KERET
export const BaseModal = ({ visible, onClose, title, children }) => (
    <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
        statusBarTranslucent={true}
    >
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "padding"}
            style={styles.overlay}
        >
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
        </KeyboardAvoidingView>
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
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSubmit = async () => {
        if (!name || !amount) return Alert.alert("Hiba", "Hiányzó adatok!");
        setLoading(true);
        try {
            await onSubmit({
                name,
                amount: parseFloat(amount),
                frequency,
                autoPay,
                payDay: autoPay ? payDay : null,
                startDate: startDate,
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

            <Input
                label="Indulás dátuma (YYYY-MM-DD)"
                placeholder="2023-12-01"
                value={startDate}
                onChangeText={setStartDate}
            />

            <SectionHeader title="Gyakoriság" />
            <View style={styles.rowBtnContainer}>
                {/* ÚJ LISTA: BIMONTHLY hozzáadva */}
                {['MONTHLY', 'BIMONTHLY', 'QUARTERLY', 'HALF-YEARLY', 'YEARLY'].map(freq => (
                    <TouchableOpacity
                        key={freq}
                        style={[styles.smallBtn, frequency === freq && styles.smallBtnActive]}
                        onPress={() => setFrequency(freq)}
                    >
                        <Text style={[styles.smallBtnText, frequency === freq && { color: '#fff' }]}>
                            {freq === 'MONTHLY' ? 'Havi' :
                                freq === 'BIMONTHLY' ? '2 Havi' :
                                    freq === 'QUARTERLY' ? 'N.éves' :
                                        freq === 'HALF-YEARLY' ? 'F.éves' : 'Éves'}
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


// 7. MEGTAKARÍTÁS MŰVELET MODAL (Befizetés/Kivét)
export const SavingActionModal = ({ visible, onClose, item, mode, onSubmit }) => {
    // mode: 'DEPOSIT' vagy 'WITHDRAW'
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    if (!item) return null;

    const isDeposit = mode === 'DEPOSIT';
    const title = isDeposit ? 'Befizetés' : 'Kivét';
    const btnColor = isDeposit ? 'success' : 'danger';

    const handleSubmit = async () => {
        if (!amount) return Alert.alert("Hiba", "Add meg az összeget!");

        setLoading(true);
        try {
            // Ha kivét, negatív előjellel küldjük
            const finalAmount = isDeposit ? parseFloat(amount) : -parseFloat(amount);

            await onSubmit(item.id, finalAmount, title);
            setAmount('');
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen művelet");
        } finally {
            setLoading(false);
        }
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title={`${title}: ${item.name}`}>
            <View style={styles.balancePreview}>
                <Text style={styles.balanceLabel}>Jelenlegi egyenleg</Text>
                <Text style={[styles.balanceValue, { color: item.color }]}>
                    {parseInt(item.currentAmount).toLocaleString('hu-HU')} Ft
                </Text>
            </View>

            <Input
                label="Összeg"
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus={true}
            />

            <View style={{ marginTop: 20 }}>
                <Button
                    title={loading ? "Folyamatban..." : title}
                    onPress={handleSubmit}
                    variant={btnColor}
                    icon={isDeposit ? "plus" : "minus"}
                />
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

    const getActionName = (type) => {
        const types = {
            'CREATE_TRANSACTION': 'Új tranzakció',
            'DELETE_TRANSACTION': 'Tranzakció törlése',
            'CREATE_RECURRING': 'Új fix tétel',
            'UPDATE_RECURRING': 'Fix tétel módosítása',
            'DELETE_RECURRING': 'Fix tétel törlése',
            'CREATE_SAVING': 'Új megtakarítási cél',
            'UPDATE_SAVING': 'Cél szerkesztése',
            'UPDATE_SAVING_BALANCE': 'Egyenleg módosítás',
            'DELETE_SAVING': 'Megtakarítás törlése',
            'CREATE_HOUSEHOLD': 'Háztartás létrehozása',
            'JOIN_HOUSEHOLD': 'Csatlakozás',
            'APPROVE_MEMBER': 'Tag jóváhagyása',
            'REMOVE_MEMBER': 'Tag eltávolítása',
            'UPDATE_USER_PROFILE': 'Profil frissítése'
        };
        return types[type] || type;
    };

    const translateKey = (key) => {
        const map = {
            amount: 'Összeg', description: 'Leírás', desc: 'Leírás', category: 'Kategória', type: 'Típus',
            date: 'Dátum', name: 'Név', target: 'Célösszeg', diff: 'Különbség', newBalance: 'Új egyenleg',
            reason: 'Ok', code: 'Kód', memberName: 'Felhasználó', householdId: 'Háztartás ID',
            frequency: 'Gyakoriság', autoPay: 'Auto-fizetés', savingId: 'Azonosító',
            old: 'Régi adatok', new: 'Új adatok'
        };
        return map[key] || key;
    };

    const formatValue = (key, value) => {
        if (value === null || value === undefined) return '-';
        if (typeof value === 'object') {
            // Ha objektum (pl. old/new adatok), szépen formázzuk stringgé
            return Object.entries(value)
                .map(([k, v]) => `${translateKey(k)}: ${v}`)
                .join(', ');
        }
        if (key === 'amount' || key === 'diff' || key === 'target' || key === 'newBalance') {
            return `${parseInt(value).toLocaleString('hu-HU')} Ft`;
        }
        if (key === 'type') return value === 'INCOME' ? 'Bevétel' : 'Kiadás';
        if (key === 'frequency') {
            const freqMap = { 'MONTHLY': 'Havi', 'QUARTERLY': 'Negyedéves', 'YEARLY': 'Éves' };
            return freqMap[value] || value;
        }
        if (key === 'autoPay') return value ? 'Igen' : 'Nem';

        return String(value);
    };

    return (
        <BaseModal visible={visible} onClose={onClose} title="Részletek">
            <View style={styles.logMetaBox}>
                <Text style={styles.logMetaText}>Művelet: <Text style={{ fontWeight: 'bold' }}>{getActionName(logItem.actionType)}</Text></Text>
                <Text style={styles.logMetaText}>Dátum: {new Date(logItem.timestamp).toLocaleString('hu-HU')}</Text>
                <Text style={styles.logMetaText}>Végezte: {logItem.actor?.displayName || 'Ismeretlen'}</Text>
            </View>

            <SectionHeader title="Adatok" />

            <View style={styles.detailsContainer}>
                {Object.entries(details).map(([key, value]) => {
                    // Technikai mezők elrejtése
                    if (['id', 'deletedAt', 'createdBy', 'recurringItemId', 'isRecurringInstance', 'savingId', 'householdId'].includes(key)) return null;

                    return (
                        <View key={key} style={styles.detailRow}>
                            <Text style={styles.detailLabel}>{translateKey(key)}:</Text>
                            {/* A style-ban megengedjük a sortörést a hosszú értékeknél */}
                            <Text style={[styles.detailValue, { flex: 1, flexWrap: 'wrap' }]}>
                                {formatValue(key, value)}
                            </Text>
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

export const PaymentModal = ({ visible, onClose, item, onSubmit, defaultDate }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]); // Ma
    const [loading, setLoading] = useState(false);

    // Amikor megnyílik a modal, beállítjuk az alapértelmezett értéket
    React.useEffect(() => {
        if (item) {
            setAmount(item.amount.toString());
        }
        // Ha van átadott dátum, azt állítjuk be
        if (defaultDate) {
            setDate(defaultDate);
        } else {
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [item, defaultDate, visible]);

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

// 8. MEGTAKARÍTÁS TÖRTÉNET MODAL
export const SavingHistoryModal = ({ visible, onClose, item }) => {
    const [history, setHistory] = React.useState([]);
    const [loading, setLoading] = React.useState(false);

    React.useEffect(() => {
        if (visible && item) {
            loadHistory();
        }
    }, [visible, item]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            // Lekérjük a naplót (ez most az utolsó 50-100 eseményt hozza)
            // Éles appban ezt jobb lenne a backend oldalon szűrni (/savings/:id/logs),
            // de most szűrjünk kliens oldalon az egyszerűség kedvéért.
            const logs = await getAuditLogs();

            const filtered = logs.filter(log => {
                // Csak az egyenleg változásokat nézzük
                if (log.actionType !== 'UPDATE_SAVING_BALANCE') return false;

                try {
                    const data = JSON.parse(log.originalData);
                    // Ellenőrizzük, hogy ehhez a megtakarításhoz tartozik-e
                    // (Ha a savingId benne van, vagy a név egyezik)
                    return data.savingId === item.id || data.name === item.name;
                } catch (e) {
                    return false;
                }
            });

            setHistory(filtered);
        } catch (e) {
            console.log("Hiba a történet betöltésekor", e);
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    const formatMoney = (amount) =>
        new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(amount);

    return (
        <BaseModal visible={visible} onClose={onClose} title={`Számlatörténet: ${item.name}`}>

            {/* Fejléc összegző */}
            <View style={styles.historyHeader}>
                <Text style={styles.historyLabel}>Jelenlegi egyenleg</Text>
                <Text style={[styles.historyAmount, { color: item.color || COLORS.primary }]}>
                    {formatMoney(item.currentAmount)}
                </Text>
            </View>

            <SectionHeader title="Tranzakciók" />

            {loading ? (
                <Text style={{ textAlign: 'center', margin: 20 }}>Betöltés...</Text>
            ) : history.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <MaterialCommunityIcons name="history" size={40} color={COLORS.gray200} />
                    <Text style={styles.emptyText}>Nincs még tranzakció.</Text>
                </View>
            ) : (
                <View style={styles.historyList}>
                    {history.map(log => {
                        const data = JSON.parse(log.originalData);
                        const isDeposit = data.diff > 0;

                        return (
                            <View key={log.id} style={styles.historyRow}>
                                {/* Bal oldal: Ikon és Dátum */}
                                <View style={styles.historyLeft}>
                                    <View style={[styles.historyIcon, { backgroundColor: isDeposit ? '#E8F5E9' : '#FFEBEB' }]}>
                                        <MaterialCommunityIcons
                                            name={isDeposit ? "arrow-down-bold" : "arrow-up-bold"}
                                            size={16}
                                            color={isDeposit ? COLORS.success : COLORS.danger}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.historyUser}>{log.actor?.displayName || 'Ismeretlen'}</Text>
                                        <Text style={styles.historyDate}>
                                            {new Date(log.timestamp).toLocaleDateString('hu-HU')}
                                        </Text>
                                    </View>
                                </View>

                                {/* Jobb oldal: Összeg */}
                                <Text style={[styles.historyValue, { color: isDeposit ? COLORS.success : COLORS.danger }]}>
                                    {isDeposit ? '+' : ''}{formatMoney(data.diff)}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            )}

            <View style={{ marginTop: 20 }}>
                <Button title="Bezárás" onPress={onClose} variant="ghost-outline" />
            </View>
        </BaseModal>
    );
};

// 9. MEGTAKARÍTÁS SZERKESZTÉS MODAL
export const EditSavingModal = ({ visible, onClose, item, onSubmit }) => {
    const [name, setName] = useState('');
    const [target, setTarget] = useState('');
    const [loading, setLoading] = useState(false);

    // Amikor megnyílik (vagy változik az item), betöltjük az adatokat
    React.useEffect(() => {
        if (item) {
            setName(item.name);
            setTarget(item.targetAmount ? item.targetAmount.toString() : '');
        }
    }, [item, visible]);

    const handleSubmit = async () => {
        if (!name) return Alert.alert("Hiba", "A név nem lehet üres!");

        setLoading(true);
        try {
            await onSubmit(item.id, {
                name,
                targetAmount: target ? parseFloat(target) : null, // Ha üres, nullát küldünk (cél törlése)
            });
            onClose();
        } catch (e) {
            Alert.alert("Hiba", "Sikertelen módosítás");
        } finally {
            setLoading(false);
        }
    };

    if (!item) return null;

    return (
        <BaseModal visible={visible} onClose={onClose} title="Cél Szerkesztése">
            <Input label="Cél neve" value={name} onChangeText={setName} />

            <Input
                label="Célösszeg (Hagyd üresen, ha nincs)"
                placeholder="0"
                keyboardType="numeric"
                value={target}
                onChangeText={setTarget}
            />

            <View style={{ marginTop: 20 }}>
                <Button title={loading ? "Mentés..." : "Módosítások Mentése"} onPress={handleSubmit} />
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
        marginBottom: 15,
        flexWrap: 'wrap',
    },
    smallBtn: {
        paddingHorizontal: 12,
        minWidth: '22%',
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: COLORS.gray100,
        borderRadius: 8,
        flexGrow: 1
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
    balancePreview: { alignItems: 'center', marginBottom: 20, padding: 15, backgroundColor: COLORS.gray100, borderRadius: 10 },
    balanceLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 5, textTransform: 'uppercase' },
    balanceValue: { fontSize: 24, fontWeight: 'bold' },
    historyHeader: { alignItems: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    historyLabel: { fontSize: 12, color: COLORS.textSecondary, textTransform: 'uppercase' },
    historyAmount: { fontSize: 28, fontWeight: 'bold', marginTop: 5 },
    emptyHistory: { alignItems: 'center', padding: 20 },
    historyList: { gap: 10 },
    historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    historyLeft: { flexDirection: 'row', alignItems: 'center' },
    historyIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    historyUser: { fontWeight: 'bold', fontSize: 13, color: COLORS.textPrimary },
    historyDate: { fontSize: 11, color: COLORS.textSecondary },
    historyValue: { fontWeight: 'bold', fontSize: 15 },
});