// Dátum formázása YYYY-MM-DD formátumra (API-hoz)
export const formatDateToISO = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Hónap első napja (pl. 2023-11-01)
export const getStartOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

// Hónap utolsó napja (pl. 2023-11-30)
export const getEndOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
};

// Hónap hozzáadása/kivonása
export const addMonths = (date, count) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + count);
    return d;
};

// Megjelenítés a fejlécben (pl. "2023. november")
export const formatMonthYear = (date) => {
    // Magyar formátum
    return new Intl.DateTimeFormat('hu-HU', { year: 'numeric', month: 'long' }).format(date);
};