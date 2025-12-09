import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

// KÁRTYA (Card)
export const Card = ({ children, style }) => (
    <View style={[styles.card, style]}>
        {children}
    </View>
);

// CÍMSOROK (Headers)
export const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

// GOMB (Button) 
export const Button = ({ title, onPress, variant = 'primary', style, disabled }) => {
    let bg = COLORS.primary;
    let textColor = COLORS.white;
    let borderWidth = 0;
    let borderColor = 'transparent';

    switch (variant) {
        case 'primary':
            bg = COLORS.primary;
            break;
        case 'secondary':
            bg = COLORS.accent;
            break;
        case 'success':
            bg = COLORS.success;
            break;
        case 'danger':
            bg = COLORS.danger;
            break;
        case 'outline':
            bg = 'transparent';
            textColor = COLORS.primary;
            borderWidth = 1;
            borderColor = COLORS.primary;
            break;
        // ÚJ: Piros keretes gomb
        case 'danger-outline':
            bg = 'transparent';
            textColor = COLORS.danger;
            borderWidth = 1;
            borderColor = COLORS.danger;
            break;
        // ÚJ: Csak szöveg (link szerű), sima kék
        case 'ghost':
            bg = 'transparent';
            textColor = COLORS.primary;
            break;
        // ÚJ: Csak szöveg, de PIROS (Kijelentkezéshez tökéletes)
        case 'danger-ghost':
            bg = 'transparent';
            textColor = COLORS.danger;
            break;
    }

    // Ha le van tiltva
    if (disabled) {
        bg = COLORS.gray200;
        textColor = COLORS.textSecondary;
        borderColor = 'transparent';
        borderWidth = 0;
    }

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: bg,
                    borderWidth: borderWidth,
                    borderColor: borderColor,
                    // Ha ghost típusú, vegyük lejjebb az árnyékot, hogy lapos legyen
                    elevation: (variant.includes('ghost')) ? 0 : 4,
                    shadowOpacity: (variant.includes('ghost')) ? 0 : 0.2,
                },
                style
            ]}
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
        </TouchableOpacity>
    );
};

// LEBEGŐ GOMB (FAB)
export const FloatingActionButton = ({ onPress, icon }) => (
    <TouchableOpacity style={styles.fab} onPress={onPress}>
        {icon}
    </TouchableOpacity>
);

// BEVITELI MEZŐ (Input)
export const Input = ({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize, keyboardType }) => (
    <View style={styles.inputContainer}>
        {label && <Text style={styles.inputLabel}>{label}</Text>}
        <TextInput
            style={styles.input}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textSecondary}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize || 'none'}
            keyboardType={keyboardType || 'default'}
        />
    </View>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        // Árnyék (Shadow) iOS-re
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        // Árnyék Androidra
        elevation: 3,
        borderWidth: 1,
        borderColor: COLORS.gray100
    },
    sectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        marginLeft: 4
    },
    button: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    buttonText: {
        color: COLORS.white,
        fontWeight: '700',
        fontSize: 16,
    },
    fab: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        zIndex: 100,
    },
    // Input stílusok
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        color: COLORS.textSecondary,
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        backgroundColor: COLORS.background, // Vagy white, dizájntól függően
        borderWidth: 1,
        borderColor: COLORS.gray200,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
    }
});

