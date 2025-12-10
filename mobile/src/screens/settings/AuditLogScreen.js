import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getAuditLogs } from '../../services/auditLogService';
import { COLORS } from '../../constants';
import { SectionHeader } from '../../components/UIComponents';
import { LogDetailsModal } from '../../components/Modals';

const AuditLogScreen = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLog, setSelectedLog] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getAuditLogs();
            setLogs(data);
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIKA: Üzenet generálása a típusból ---
    const getLogDetails = (item) => {
        let data = {};
        try {
            data = JSON.parse(item.originalData);
        } catch (e) {
            // Ha nem JSON, akkor hagyjuk
        }

        switch (item.actionType) {
            case 'CREATE_TRANSACTION':
                return {
                    icon: 'cash-plus',
                    color: COLORS.success,
                    title: 'Új tranzakció',
                    desc: `${data.amount} Ft - ${data.desc || 'Nincs leírás'}`
                };
            case 'DELETE_TRANSACTION':
                return {
                    icon: 'trash-can',
                    color: COLORS.danger,
                    title: 'Tranzakció törlése',
                    desc: `${data.amount} Ft - ${data.desc || '?'}`
                };
            case 'CREATE_RECURRING':
                return {
                    icon: 'refresh',
                    color: COLORS.primary,
                    title: 'Új fix tétel',
                    desc: `${data.name} (${data.amount} Ft)`
                };
            case 'UPDATE_RECURRING':
                return {
                    icon: 'pencil',
                    color: COLORS.primary,
                    title: 'Fix tétel módosítása',
                    desc: `${data.updates?.name || 'Tétel'} módosítva`
                };
            case 'DELETE_RECURRING':
                return {
                    icon: 'stop-circle-outline',
                    color: COLORS.textSecondary,
                    title: 'Fix tétel leállítva',
                    desc: `${data.name}`
                };
            case 'CREATE_SAVING':
                return {
                    icon: 'piggy-bank',
                    color: COLORS.accent,
                    title: 'Új megtakarítási cél',
                    desc: `${data.name} (Cél: ${data.target || 0} Ft)`
                };
            case 'UPDATE_SAVING_BALANCE':
                const isDeposit = data.diff > 0;
                return {
                    icon: isDeposit ? 'arrow-up-bold-circle' : 'arrow-down-bold-circle',
                    color: isDeposit ? COLORS.success : COLORS.danger,
                    title: isDeposit ? 'Megtakarítás befizetés' : 'Megtakarítás kivét',
                    desc: `${Math.abs(data.diff)} Ft - ${data.name}`
                };
            case 'DELETE_SAVING':
                return {
                    icon: 'delete-empty',
                    color: COLORS.danger,
                    title: 'Cél törlése',
                    desc: `${data.name}`
                };
            case 'CREATE_HOUSEHOLD':
                return {
                    icon: 'home-plus',
                    color: COLORS.primary,
                    title: 'Háztartás létrehozva',
                    desc: `Név: ${data.name}`
                };
            case 'JOIN_HOUSEHOLD':
                return {
                    icon: 'account-multiple-plus',
                    color: COLORS.primary,
                    title: 'Új csatlakozás',
                    desc: `Kóddal: ${data.code}`
                };
            case 'APPROVE_MEMBER':
                return {
                    icon: 'account-check',
                    color: COLORS.success,
                    title: 'Tag jóváhagyva',
                    desc: `${data.memberName}`
                };
            case 'REMOVE_MEMBER':
                return {
                    icon: 'account-remove',
                    color: COLORS.danger,
                    title: 'Tag eltávolítva',
                    desc: `${data.memberName}`
                };
            default:
                return {
                    icon: 'information',
                    color: COLORS.textSecondary,
                    title: 'Egyéb művelet',
                    desc: item.actionType
                };
        }
    };

    // Kezelő függvény
    const handlePressItem = (item) => {
        setSelectedLog(item);
        setModalVisible(true);
    };

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    const renderItem = ({ item }) => {
        const info = getLogDetails(item);

        return (
            <TouchableOpacity style={styles.logRow} onPress={() => handlePressItem(item)}>
                {/* Ikon */}
                <View style={[styles.iconBox, { backgroundColor: info.color + '20' }]}>
                    <MaterialCommunityIcons name={info.icon} size={20} color={info.color} />
                </View>

                {/* Szöveg */}
                <View style={styles.content}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.title}>{info.title}</Text>
                        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.gray200} />
                    </View>
                    <Text style={styles.desc} numberOfLines={1}>{info.desc}</Text>
                    <View style={styles.metaRow}>
                        <Text style={styles.metaUser}>{item.actor?.displayName || 'Ismeretlen'}</Text>
                        <Text style={styles.metaTime}>• {formatTime(item.timestamp)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <SectionHeader title="Előzmények" />
            <FlatList
                data={logs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
                ListEmptyComponent={
                    <Text style={styles.empty}>Nincs rögzített tevékenység.</Text>
                }
            />

            <LogDetailsModal
                visible={modalVisible}
                logItem={selectedLog}
                onClose={() => setModalVisible(false)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    logRow: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: 12,
        marginBottom: 8,
        borderRadius: 12,
        alignItems: 'flex-start'
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        marginTop: 2
    },
    content: {
        flex: 1
    },
    title: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    desc: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
        marginBottom: 4
    },
    metaRow: {
        flexDirection: 'row'
    },
    metaUser: {
        fontSize: 11,
        fontWeight: 'bold',
        color: COLORS.primary
    },
    metaTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginLeft: 4
    },
    empty: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        marginTop: 40,
        fontStyle: 'italic'
    }
});

export default AuditLogScreen;