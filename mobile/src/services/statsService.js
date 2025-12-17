import api from './api';

export const getHeatmapData = async (year, month) => {
    const res = await api.get(`/stats/heatmap?year=${year}&month=${month}`);
    return res.data;
};

export const getInflationData = async () => {
    const res = await api.get('/stats/inflation');
    return res.data;
};

export const getPieData = async (year, month) => {
    const res = await api.get(`/stats/pie?year=${year}&month=${month}`);
    return res.data;
};

export const getAverages = async () => {
    const res = await api.get('/stats/averages');
    return res.data;
};