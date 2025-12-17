import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS } from '../../constants';
import { exportTransactionsToExcel } from '../../services/transactionService'; //

const ExportScreen = () => {
    const [endDate, setEndDate] = useState(new Date());
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)));
    const [showStart, setShowStart] = useState(false);
    const [showEnd, setShowEnd] = useState(false);
    const [exporting, setExporting] = useState(false);

    const handleExport = async () => {
        setExporting(true);
        try {
            await exportTransactionsToExcel(startDate, endDate); // Meghívjuk a kiszervezett logikát
        } catch (error) {
            Alert.alert("Hiba", error.message || "Hiba történt az exportálás során.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Dátumintervallum kiválasztása</Text>

            <View style={styles.dateRow}>
                <Text style={styles.label}>Mettől:</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStart(true)}>
                    <Text>{startDate.toLocaleDateString('hu-HU')}</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.dateRow}>
                <Text style={styles.label}>Meddig:</Text>
                <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEnd(true)}>
                    <Text>{endDate.toLocaleDateString('hu-HU')}</Text>
                </TouchableOpacity>
            </View>

            {(showStart || showEnd) && (
                <DateTimePicker
                    value={showStart ? startDate : endDate}
                    mode="date"
                    onChange={(e, d) => {
                        setShowStart(false);
                        setShowEnd(false);
                        if (d) showStart ? setStartDate(d) : setEndDate(d);
                    }}
                />
            )}

            <TouchableOpacity
                style={[styles.exportBtn, exporting && { opacity: 0.7 }]}
                onPress={handleExport}
                disabled={exporting}
            >
                {exporting ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.exportBtnText}>Excel exportálás indítása</Text>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: COLORS.background },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 30, color: COLORS.textPrimary },
    dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
    dateBtn: { backgroundColor: COLORS.surface, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.gray200, minWidth: 150, alignItems: 'center' },
    exportBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 15, marginTop: 40, alignItems: 'center' },
    exportBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default ExportScreen;