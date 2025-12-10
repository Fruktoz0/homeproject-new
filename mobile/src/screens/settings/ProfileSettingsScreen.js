import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { COLORS } from '../../constants';
import { Button, Card, SectionHeader } from '../../components/UIComponents';

const ProfileScreen = () => {
    const { logout, userData } = useContext(AuthContext);

    return (
        <View style={styles.container}>
            <SectionHeader title="Fiók" />
            <Card style={styles.infoCard}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{userData?.displayName?.charAt(0) || '?'}</Text>
                </View>
                <Text style={styles.name}>{userData?.displayName}</Text>
                <Text style={styles.email}>{userData?.email}</Text>
            </Card>

            <View style={styles.logoutContainer}>
                <Button title="Kijelentkezés" onPress={logout} variant="danger-ghost" />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    infoCard: { alignItems: 'center', padding: 30 },
    avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: COLORS.white },
    name: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
    email: { fontSize: 14, color: COLORS.textSecondary, marginTop: 5 },
    logoutContainer: { marginTop: 'auto', marginBottom: 20 }
});

export default ProfileScreen;