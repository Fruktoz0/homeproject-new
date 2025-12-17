import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PieChart, StackedBarChart } from 'react-native-chart-kit';
import { useFocusEffect } from '@react-navigation/native';

import { COLORS } from '../../constants';
import { SectionHeader, Card } from '../../components/UIComponents';
import { getHeatmapData, getInflationData, getPieData, getAverages } from '../../services/statsService';

const screenWidth = Dimensions.get("window").width;

const StatisticsScreen = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('HEATMAP'); // HEATMAP | TRENDS | PIE | AVGS

    // Dátum statek a lapozáshoz
    const [currentDate, setCurrentDate] = useState(new Date());

    // Adat statek
    const [heatmapData, setHeatmapData] = useState([]);
    const [inflationData, setInflationData] = useState(null);
    const [pieData, setPieData] = useState([]);
    const [avgData, setAvgData] = useState({ avg6: [], avg12: [] });

    // --- ADATBETÖLTÉS ---
    const loadData = async () => {
        setLoading(true);
        try {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();

            if (activeTab === 'HEATMAP') {
                const data = await getHeatmapData(year, month);
                setHeatmapData(data);
            } else if (activeTab === 'TRENDS') {
                const data = await getInflationData();
                processInflationData(data);
            } else if (activeTab === 'PIE') {
                const data = await getPieData(year, month);
                // Színezés és formázás a chart-kitnek
                const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'];
                const formatted = data.map((d, i) => ({
                    name: d.category,
                    population: parseInt(d.total),
                    color: colors[i % colors.length],
                    legendFontColor: "#7F7F7F",
                    legendFontSize: 12
                }));
                setPieData(formatted);
            } else if (activeTab === 'AVGS') {
                const data = await getAverages();
                setAvgData(data);
            }
        } catch (e) {
            console.log(e);
        } finally {
            setLoading(false);
        }
    };

    // Stacked Chart adatfeldolgozás
    const processInflationData = (data) => {
        // Egyedi hónapok és kategóriák kigyűjtése
        const months = [...new Set(data.map(d => d.month))];
        const categories = [...new Set(data.map(d => d.category))];

        // Mátrix építése: [ [cat1_val, cat2_val...], ... ]
        const matrix = months.map(m => {
            return categories.map(c => {
                const found = data.find(d => d.month === m && d.category === c);
                return found ? parseInt(found.total) : 0;
            });
        });

        setInflationData({
            labels: months.map(m => m.substring(5)), // Csak a hónap száma
            legend: categories,
            data: matrix,
            barColors: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'].slice(0, categories.length)
        });
    };

    useEffect(() => {
        loadData();
    }, [currentDate, activeTab]);

    // --- NAVIGÁCIÓS FÜGGVÉNYEK ---
    const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

    // --- ALKOMPONENSEK ---

    const TabButton = ({ id, icon, label }) => (
        <TouchableOpacity
            style={[styles.tabBtn, activeTab === id && styles.tabBtnActive]}
            onPress={() => setActiveTab(id)}
        >
            <MaterialCommunityIcons name={icon} size={20} color={activeTab === id ? COLORS.white : COLORS.textSecondary} />
            {activeTab === id && <Text style={styles.tabText}>{label}</Text>}
        </TouchableOpacity>
    );

    const DateNavigator = () => (
        <View style={styles.dateNav}>
            <TouchableOpacity onPress={prevMonth} style={styles.arrowBtn}>
                <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.dateText}>
                {currentDate.toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })}
            </Text>
            <TouchableOpacity onPress={nextMonth} style={styles.arrowBtn}>
                <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
        </View>
    );

    // 1. HEATMAP (GitHub Style)
    const HeatmapView = () => {
        // Naptár generálása
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const getColor = (day) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const found = heatmapData.find(d => d.date === dateStr);
            if (!found) return COLORS.gray100; // Nincs költés
            const val = parseInt(found.count);
            // Színskála logika (zöld árnyalatok)
            if (val > 20000) return '#196127';
            if (val > 10000) return '#239a3b';
            if (val > 5000) return '#7bc96f';
            return '#c6e48b';
        };

        return (
            <View>
                <DateNavigator />
                <View style={styles.heatmapGrid}>
                    {days.map(day => (
                        <View key={day} style={[styles.heatmapCell, { backgroundColor: getColor(day) }]}>
                            <Text style={styles.heatmapText}>{day}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.legend}>
                    <Text style={styles.legendText}>Kevesebb</Text>
                    <View style={[styles.legendBox, { backgroundColor: '#c6e48b' }]} />
                    <View style={[styles.legendBox, { backgroundColor: '#239a3b' }]} />
                    <View style={[styles.legendBox, { backgroundColor: '#196127' }]} />
                    <Text style={styles.legendText}>Több</Text>
                </View>
            </View>
        );
    };

    // 2. INFLATION MONITOR (Stacked Chart)
    const InflationView = () => {
        if (!inflationData || inflationData.data.length === 0) return <Text style={styles.emptyText}>Nincs elég adat az elmúlt 6 hónapból.</Text>;

        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <StackedBarChart
                    data={inflationData}
                    width={screenWidth * 1.5} // Szélesebb, hogy görgethető legyen
                    height={300}
                    chartConfig={{
                        backgroundColor: COLORS.surface,
                        backgroundGradientFrom: COLORS.surface,
                        backgroundGradientTo: COLORS.surface,
                        decimalPlaces: 0,
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                        labelColor: (opacity = 1) => COLORS.textSecondary,
                    }}
                    hideLegend={false}
                />
            </ScrollView>
        );
    };

    // 3. PIE CHART
    const PieView = () => (
        <View>
            <DateNavigator />
            {pieData.length > 0 ? (
                <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute // Értékek mutatása % helyett
                />
            ) : (
                <Text style={styles.emptyText}>Nincs költés ebben a hónapban.</Text>
            )}
        </View>
    );

    // 4. AVERAGES
    const AveragesView = () => {
        const renderList = (data, title) => (
            <View style={{ marginBottom: 20 }}>
                <Text style={styles.subTitle}>{title}</Text>
                {data.map((item, index) => (
                    <View key={index} style={styles.avgRow}>
                        <Text style={styles.avgCat}>{item.category}</Text>
                        <Text style={styles.avgVal}>{Math.round(item.avgAmount).toLocaleString('hu-HU')} Ft</Text>
                    </View>
                ))}
            </View>
        );

        return (
            <View>
                {renderList(avgData.avg6, "Utolsó 6 hónap átlaga")}
                <View style={{ height: 1, backgroundColor: COLORS.gray200, marginVertical: 10 }} />
                {renderList(avgData.avg12, "Utolsó 12 hónap átlaga")}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {/* TAB SELECTOR */}
            <View style={styles.tabContainer}>
                <TabButton id="HEATMAP" icon="calendar-month" label="Hőtérkép" />
                <TabButton id="TRENDS" icon="chart-timeline-variant" label="Trend" />
                <TabButton id="PIE" icon="chart-pie" label="Megoszlás" />
                <TabButton id="AVGS" icon="calculator" label="Átlag" />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Card style={styles.card}>
                    {loading ? (
                        <ActivityIndicator size="large" color={COLORS.primary} />
                    ) : (
                        <>
                            {activeTab === 'HEATMAP' && <HeatmapView />}
                            {activeTab === 'TRENDS' && (
                                <>
                                    <Text style={styles.chartTitle}>Életmód Infláció (Elmúlt 6 hónap)</Text>
                                    <InflationView />
                                </>
                            )}
                            {activeTab === 'PIE' && <PieView />}
                            {activeTab === 'AVGS' && <AveragesView />}
                        </>
                    )}
                </Card>

                {/* SANKEY HELYETT "CASH FLOW" MAGYARÁZAT */}
                {activeTab === 'TRENDS' && (
                    <View style={styles.infoBox}>
                        <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.textSecondary} />
                        <Text style={styles.infoText}>
                            Ez a grafikon (Stacked Chart) megmutatja, hogyan változik a költéseid összetétele.
                            Ha egy oszlop magasabb, többet költöttél. A színek aránya mutatja, melyik kategória drágult.
                        </Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },

    // TABS
    tabContainer: { flexDirection: 'row', backgroundColor: COLORS.primary, paddingTop: 50, paddingBottom: 10, paddingHorizontal: 10, gap: 5 },
    tabBtn: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 8, borderRadius: 20 },
    tabBtnActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    tabText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12, marginLeft: 5 },

    scrollContent: { padding: 20 },
    card: { padding: 15, minHeight: 300 },

    // DATE NAV
    dateNav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    dateText: { fontSize: 18, fontWeight: 'bold', textTransform: 'capitalize' },
    arrowBtn: { padding: 5 },

    // HEATMAP
    heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
    heatmapCell: { width: 40, height: 40, borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
    heatmapText: { fontSize: 10, color: '#333', opacity: 0.5 },
    legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, gap: 5 },
    legendBox: { width: 15, height: 15, borderRadius: 3 },
    legendText: { fontSize: 10, color: COLORS.textSecondary },

    // TEXTS
    emptyText: { textAlign: 'center', color: COLORS.textSecondary, marginTop: 50, fontStyle: 'italic' },
    chartTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },

    // AVERAGES
    subTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.primary, marginBottom: 10, textTransform: 'uppercase' },
    avgRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.gray100 },
    avgCat: { fontSize: 14, color: COLORS.textPrimary },
    avgVal: { fontSize: 14, fontWeight: 'bold' },

    infoBox: { flexDirection: 'row', backgroundColor: COLORS.gray100, padding: 10, borderRadius: 8, marginTop: 15, alignItems: 'center' },
    infoText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 10, flex: 1 },
});

export default StatisticsScreen;