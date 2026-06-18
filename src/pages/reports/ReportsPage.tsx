import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Grid, Avatar, useMediaQuery, useTheme,
} from '@mui/material';
import {
  People, CardMembership, CalendarMonth, Payment, TrendingUp,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../api/axios';

const COLORS = ['#6B46C1', '#9F7AEA', '#B794F4', '#D6BCFA', '#E9D8FD'];

export const ReportsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { data: overview } = useQuery({
    queryKey: ['reports', 'overview'],
    queryFn: async () => { const res = await api.get('/reports/overview'); return res.data; },
  });

  const { data: attendanceByGroups } = useQuery({
    queryKey: ['reports', 'attendance', 'groups'],
    queryFn: async () => { const res = await api.get('/reports/attendance/groups'); return res.data; },
  });

  const { data: attendanceByTrainers } = useQuery({
    queryKey: ['reports', 'attendance', 'trainers'],
    queryFn: async () => { const res = await api.get('/reports/attendance/trainers'); return res.data; },
  });

  const { data: revenue } = useQuery({
    queryKey: ['reports', 'revenue'],
    queryFn: async () => { const res = await api.get('/reports/revenue'); return res.data; },
  });

  const { data: subscriptionDistribution } = useQuery({
    queryKey: ['reports', 'subscriptions', 'distribution'],
    queryFn: async () => { const res = await api.get('/reports/subscriptions/distribution'); return res.data; },
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>
        Отчеты
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#E9D8FD', color: '#6B46C1' }}><People /></Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Клиентов</Typography>
                  <Typography variant="h5" fontWeight={700}>{overview?.totalClients || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#C6F6D5', color: '#38A169' }}><CardMembership /></Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Активных абонементов</Typography>
                  <Typography variant="h5" fontWeight={700}>{overview?.activeSubscriptions || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#BEE3F8', color: '#3182CE' }}><CalendarMonth /></Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Проведено занятий</Typography>
                  <Typography variant="h5" fontWeight={700}>{overview?.totalLessons || 0}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#FEFCBF', color: '#D69E2E' }}><Payment /></Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Доход</Typography>
                  <Typography variant="h5" fontWeight={700}>{(overview?.totalRevenue || 0).toLocaleString()} ₽</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Посещаемость по группам</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceByGroups || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#6B46C1" radius={[4, 4, 0, 0]} name="Посещаемость %" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Посещаемость по тренерам</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={attendanceByTrainers || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="averageAttendance" fill="#9F7AEA" radius={[4, 4, 0, 0]} name="Средняя посещаемость" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Доход по месяцам</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#718096" fontSize={12} />
                    <YAxis stroke="#718096" fontSize={12} />
                    <Tooltip formatter={(value: any) => `${value.toLocaleString()} ₽`} />
                    <Bar dataKey="total" fill="#6B46C1" radius={[4, 4, 0, 0]} name="Доход" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>Типы абонементов</Typography>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subscriptionDistribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={index} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
