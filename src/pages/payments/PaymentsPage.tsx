import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box, Card, CardContent, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, useMediaQuery, useTheme,
} from '@mui/material';
import { Add, Delete, Payment } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const paymentSchema = z.object({
  clientId: z.number().min(1, 'Выберите клиента'),
  amount: z.number().min(1, 'Сумма должна быть больше 0').max(10000000, 'Слишком большая сумма'),
  paymentMethod: z.string().min(1, 'Выберите способ оплаты'),
  comment: z.string().max(500).optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

export const PaymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [dialogOpen, setDialogOpen] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => { const res = await api.get('/payments'); return res.data; },
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => { const res = await api.get('/clients', { params: { limit: 200 } }); return res.data?.items || []; },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PaymentFormData) => { const res = await api.post('/payments', data); return res.data; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Платеж создан'); handleCloseDialog(); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => { await api.delete(`/payments/${id}`); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payments'] }); toast.success('Платеж удален'); },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Ошибка удаления'),
  });

  const handleCloseDialog = () => { setDialogOpen(false); reset(); };
  const onSubmit = (data: PaymentFormData) => { createMutation.mutate(data); };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Платежи</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setDialogOpen(true)}>
          Зарегистрировать оплату
        </Button>
      </Box>

      <Card>
        <CardContent>
          {isMobile ? (
            <Box>
              {(payments || []).map((payment: any) => (
                <Card key={payment.id} variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography fontWeight={600}>{payment.client?.fullName}</Typography>
                        <Typography variant="body2" color="text.secondary">{payment.paymentMethod}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(payment.paymentDate).toLocaleDateString('ru-RU')}
                        </Typography>
                        {payment.comment && (
                          <Typography variant="caption" color="text.secondary">{payment.comment}</Typography>
                        )}
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography fontWeight={700} color="primary">{payment.amount.toLocaleString()} ₽</Typography>
                        <IconButton size="small" onClick={() => deleteMutation.mutate(payment.id)}>
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Клиент</TableCell>
                    <TableCell>Сумма</TableCell>
                    <TableCell>Дата</TableCell>
                    <TableCell>Способ оплаты</TableCell>
                    <TableCell>Комментарий</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(payments || []).map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell><Typography fontWeight={600}>{payment.client?.fullName}</Typography></TableCell>
                      <TableCell><Typography fontWeight={700} color="primary">{payment.amount.toLocaleString()} ₽</Typography></TableCell>
                      <TableCell>{new Date(payment.paymentDate).toLocaleDateString('ru-RU')}</TableCell>
                      <TableCell>{payment.paymentMethod}</TableCell>
                      <TableCell>{payment.comment || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => deleteMutation.mutate(payment.id)}>
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Зарегистрировать оплату</DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal" error={!!errors.clientId}>
              <InputLabel>Клиент</InputLabel>
              <Select
                value={watch('clientId') || ''}
                onChange={(e) => setValue('clientId', Number(e.target.value), { shouldValidate: true })}
                label="Клиент"
              >
                {(clients || []).map((c: any) => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
              </Select>
              {errors.clientId && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.clientId.message}</Typography>}
            </FormControl>
            <TextField fullWidth label="Сумма (₽)" type="number" {...register('amount', { valueAsNumber: true })} margin="normal" error={!!errors.amount} helperText={errors.amount?.message} />
            <FormControl fullWidth margin="normal" error={!!errors.paymentMethod}>
              <InputLabel>Способ оплаты</InputLabel>
              <Select
                value={watch('paymentMethod') || ''}
                onChange={(e) => setValue('paymentMethod', e.target.value, { shouldValidate: true })}
                label="Способ оплаты"
              >
                <MenuItem value="Карта">Карта</MenuItem>
                <MenuItem value="Наличные">Наличные</MenuItem>
                <MenuItem value="Перевод">Перевод</MenuItem>
              </Select>
              {errors.paymentMethod && <Typography variant="caption" color="error" sx={{ ml: 2 }}>{errors.paymentMethod.message}</Typography>}
            </FormControl>
            <TextField fullWidth label="Комментарий" {...register('comment')} margin="normal" />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)} disabled={createMutation.isPending}>Создать</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
