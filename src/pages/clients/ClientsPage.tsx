import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Avatar,
  InputAdornment,
  TablePagination,
  useMediaQuery,
  useTheme,
  Grid,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Phone,
  Email,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import { InitialsAvatar } from '../../components/InitialsAvatar';

const clientSchema = z.object({
  fullName: z.string().min(2, 'ФИО должно содержать минимум 2 символа').max(100, 'Слишком длинное ФИО'),
  phone: z.string().regex(/^\+?[\d\s\-()]{7,18}$/, 'Некорректный номер телефона'),
  email: z.string().email('Некорректный email').max(100),
  birthDate: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE']).optional(),
  comment: z.string().max(500, 'Комментарий слишком длинный').optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

export const ClientsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState<any>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, page, rowsPerPage],
    queryFn: async () => {
      const res = await api.get('/clients', {
        params: { search, page: page + 1, limit: rowsPerPage },
      });
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const payload: any = { ...data };
      if (!payload.gender) delete payload.gender;
      if (!payload.birthDate) delete payload.birthDate;
      if (!payload.comment) delete payload.comment;
      const res = await api.post('/clients', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Клиент создан');
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка создания');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClientFormData }) => {
      const payload: any = { ...data };
      if (!payload.gender) delete payload.gender;
      if (!payload.birthDate) delete payload.birthDate;
      if (!payload.comment) delete payload.comment;
      const res = await api.put(`/clients/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Клиент обновлен');
      handleCloseDialog();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка обновления');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Клиент удален');
      setDeleteDialogOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Ошибка удаления');
    },
  });

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingClient(null);
    reset();
  };

  const handleOpenEdit = (client: any) => {
    setEditingClient(client);
    setDialogOpen(true);
    setTimeout(() => {
      reset({
        fullName: client.fullName,
        phone: client.phone,
        email: client.email,
        birthDate: client.birthDate ? client.birthDate.split('T')[0] : '',
        gender: client.gender || undefined,
        comment: client.comment || '',
      });
    }, 0);
  };

  const onSubmit = (data: ClientFormData) => {
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingClient) {
      deleteMutation.mutate(deletingClient.id);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Клиенты
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => { setEditingClient(null); setDialogOpen(true); }}
        >
          Добавить клиента
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Поиск по имени, телефону, email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {isMobile ? (
            <Box>
              {(data?.items || []).map((client: any) => (
                <Card key={client.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <InitialsAvatar name={client.fullName || ''} avatarUrl={client.avatarUrl} size={100} />
                        <Box>
                          <Typography fontWeight={600}>{client.fullName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {client.email}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {client.phone}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton size="small" onClick={() => handleOpenEdit(client)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => { setDeletingClient(client); setDeleteDialogOpen(true); }}
                        >
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
                    <TableCell>Телефон</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Дата рождения</TableCell>
                    <TableCell>Дата регистрации</TableCell>
                    <TableCell align="right">Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.items || []).map((client: any) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <InitialsAvatar name={client.fullName || ''} avatarUrl={client.avatarUrl} size={40} />
                          <Typography fontWeight={600}>{client.fullName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>
                        {client.birthDate ? new Date(client.birthDate).toLocaleDateString('ru-RU') : '—'}
                      </TableCell>
                      <TableCell>
                        {new Date(client.registeredAt).toLocaleDateString('ru-RU')}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => handleOpenEdit(client)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => { setDeletingClient(client); setDeleteDialogOpen(true); }}
                        >
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {data?.total !== undefined && (
            <TablePagination
              component="div"
              count={data.total}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value));
                setPage(0);
              }}
              labelRowsPerPage="Строк:"
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="ФИО"
              {...register('fullName')}
              error={!!errors.fullName}
              helperText={errors.fullName?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Телефон"
              {...register('phone')}
              error={!!errors.phone}
              helperText={errors.phone?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Дата рождения"
              type="date"
              {...register('birthDate')}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Пол"
              select
              {...register('gender')}
              margin="normal"
              SelectProps={{ native: true }}
            >
              <option value="">Не указан</option>
              <option value="MALE">Мужской</option>
              <option value="FEMALE">Женский</option>
            </TextField>
            <TextField
              fullWidth
              label="Комментарий"
              {...register('comment')}
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleSubmit(onSubmit)}
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {editingClient ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Удалить клиента?</DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить клиента {deletingClient?.fullName}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
          <Button color="error" onClick={handleDelete} disabled={deleteMutation.isPending}>
            Удалить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
