import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { COLORS } from '../constants';
import { SectionHeader } from '../components/UIComponents';

const MenuItem = ({ icon, title, subtitle, onPress, color = COLORS.textPrimary }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
        <View style={[styles.iconContainer, { backgroundColor: color + '15' }]}>
            <MaterialCommunityIcons name={icon} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
            <Text style={[styles.menuTitle, { color }]}>{title}</Text>
            {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
    </TouchableOpacity>
);

const MenuScreen = ({ navigation }) => {
    const { userData } = useContext(AuthContext);

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Beállítások</Text>
            </View>

            <View style={styles.section}>
                <SectionHeader title="Fiók" />
                <MenuItem
                    icon="account-circle"
                    title="Profil"
                    subtitle={userData?.displayName}
                    onPress={() => navigation.navigate('ProfileSettings')}
                    color={COLORS.primary}
                />
            </View>

            <View style={styles.section}>
                <SectionHeader title="Háztartás" />
                <MenuItem
                    icon="home-group"
                    title="Tagok és Beállítások"
                    subtitle="Tagok kezelése, Kilépés"
                    onPress={() => navigation.navigate('HouseholdSettings')}
                />
                <MenuItem
                    icon="email-outline"
                    title="Meghívók"
                    subtitle="Új tag meghívása"
                    onPress={() => navigation.navigate('Invitations')}
                />
            </View>

            <View style={styles.section}>
                <SectionHeader title="Elemzések" />
                <MenuItem
                    icon="chart-box-outline"
                    title="Statisztika"
                    subtitle="Költések, trendek, elemzések"
                    onPress={() => navigation.navigate('Statistics')}
                />
            </View>
            <View style={styles.section}>
                <SectionHeader title="Egyéb" />
                <MenuItem
                    icon="history"
                    title="Napló"
                    subtitle="Tevékenységek listája"
                    onPress={() => navigation.navigate('AuditLogs')}
                />
                {/* Exportálás funkció később jöhet ide */}
                <MenuItem
                    icon="file-export-outline"
                    title="Adatok exportálása"
                    subtitle=""
                    onPress={() => navigation.navigate('Export')}
                    color={COLORS.textSecondary}
                />
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor:
            COLORS.background
    },
    header: {
        padding: 20,
        paddingTop: 60,
        backgroundColor: COLORS.surface,
        paddingBottom: 20
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 20
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: 15,
        borderRadius: 12,
        marginBottom: 10,
        elevation: 1
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15
    },
    textContainer: {
        flex: 1
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600'
    },
    menuSubtitle: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2
    }
});

export default MenuScreen;