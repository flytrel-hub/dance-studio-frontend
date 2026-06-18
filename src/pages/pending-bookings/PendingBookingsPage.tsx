import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Chip, Grid,
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export const PendingBookingsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['pendingBookings'],
    queryFn: async () => { const res = await api.get('/lessons/pending-bookings'); return res.data; },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ lessonId, clientId }: { lessonId: number; clientId: number }) => {
      const res = await api.post(`/lessons/${lessonId}/approve/${clientId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingBookings'] });
      toast.success('Заявка одобрена');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ lessonId, clientId }: { lessonId: number; clientId: number }) => {
      const res = await api.post(`/lessons/${lessonId}/reject/${clientId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pendingBookings'] });
      toast.success('Заявка отклонена');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  if (isLoading) return <Typography>Загрузка...</Typography>;

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>Ожидающие заявки</Typography>

      {(!bookings || bookings.length === 0) ? (
        <Card>
          <CardContent>
            <Typography color="text.secondary" textAlign="center" py={4}>
              Нет ожидающих заявок
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {bookings.map((b: any) => (
            <Grid item xs={12} sm={6} md={4} key={`${b.lesson_id}-${b.client_id}`}>
              <Card variant="outlined">
                <CardContent>
                  <Typography fontWeight={700} gutterBottom>{b.client.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {b.lesson.group.name} ({b.lesson.group.danceStyle})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(b.lesson.lessonDate).toLocaleDateString('ru-RU')} в {b.lesson.startTime}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Тел: {b.client.phone}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<Check />}
                      onClick={() => approveMutation.mutate({ lessonId: b.lesson_id, clientId: b.client_id })}
                      disabled={approveMutation.isPending}
                    >
                      Одобрить
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<Close />}
                      onClick={() => rejectMutation.mutate({ lessonId: b.lesson_id, clientId: b.client_id })}
                      disabled={rejectMutation.isPending}
                    >
                      Отклонить
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
