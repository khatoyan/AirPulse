import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  TextField,
  Snackbar,
  Alert
} from '@mui/material';
import { 
  CheckCircle as ApproveIcon, 
  Cancel as RejectIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { reportsService } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';

function PendingReports() {
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const { getAuthHeader } = useAuthStore();
  
  // Загрузка отчетов, ожидающих модерации
  const fetchPendingReports = useCallback(async () => {
    setLoading(true);
    try {
      const reports = await reportsService.getPendingReports(getAuthHeader());
      setPendingReports(reports);
    } catch (error) {
      console.error('Ошибка при загрузке данных:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при загрузке отчетов на модерацию',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader]);
  
  useEffect(() => {
    fetchPendingReports();
  }, [fetchPendingReports]);
  
  // Подтверждение отчета
  const handleApprove = async (reportId) => {
    try {
      await reportsService.approveReport(reportId, getAuthHeader());
      fetchPendingReports(); // Обновляем список после подтверждения
      setSnackbar({
        open: true,
        message: 'Отчет успешно одобрен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при одобрении отчета:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при одобрении отчета',
        severity: 'error'
      });
    }
  };
  
  // Отклонение отчета
  const handleReject = async () => {
    if (!selectedReport) return;
    
    try {
      await reportsService.rejectReport(
        selectedReport.id, 
        { reason: rejectionReason }, 
        getAuthHeader()
      );
      setRejectDialogOpen(false);
      setRejectionReason('');
      fetchPendingReports(); // Обновляем список после отклонения
      setSnackbar({
        open: true,
        message: 'Отчет был отклонен',
        severity: 'success'
      });
    } catch (error) {
      console.error('Ошибка при отклонении отчета:', error);
      setSnackbar({
        open: true,
        message: 'Ошибка при отклонении отчета',
        severity: 'error'
      });
    }
  };
  
  // Форматирование даты создания
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ru-RU', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Модерация отчетов
      </Typography>
      <Typography variant="body1" gutterBottom sx={{ mb: 3 }}>
        Здесь вы можете просмотреть и управлять отчетами пользователей, ожидающими модерации
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Тип растения</TableCell>
                <TableCell>Описание</TableCell>
                <TableCell>Интенсивность</TableCell>
                <TableCell>Координаты</TableCell>
                <TableCell>Дата</TableCell>
                <TableCell>Пользователь</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Загрузка данных...</TableCell>
                </TableRow>
              ) : pendingReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">Нет отчетов, требующих модерации</TableCell>
                </TableRow>
              ) : (
                pendingReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.plantType}</TableCell>
                    <TableCell>{report.description || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={`${report.severity}/100`} 
                        color={report.severity > 70 ? 'error' : report.severity > 40 ? 'warning' : 'success'} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>
                      {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
                    </TableCell>
                    <TableCell>{formatDate(report.createdAt)}</TableCell>
                    <TableCell>{report.user?.name || 'Анонимно'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<ViewIcon />}
                          onClick={() => {
                            setSelectedReport(report);
                            setViewDialogOpen(true);
                          }}
                        >
                          Просмотр
                        </Button>
                        <Button
                          size="small"
                          color="success"
                          variant="contained"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(report.id)}
                        >
                          Одобрить
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="contained"
                          startIcon={<RejectIcon />}
                          onClick={() => {
                            setSelectedReport(report);
                            setRejectDialogOpen(true);
                          }}
                        >
                          Отклонить
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Диалог просмотра подробной информации */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md">
        <DialogTitle>Просмотр отчета о растении</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Тип растения:</Typography>
                <Typography variant="body1">{selectedReport.plantType}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Интенсивность пыльцы:</Typography>
                <Typography variant="body1">{selectedReport.severity}/100</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Описание:</Typography>
                <Typography variant="body1">{selectedReport.description || 'Нет описания'}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Координаты:</Typography>
                <Typography variant="body1">
                  {selectedReport.latitude.toFixed(6)}, {selectedReport.longitude.toFixed(6)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">Дата создания:</Typography>
                <Typography variant="body1">{formatDate(selectedReport.createdAt)}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Пользователь:</Typography>
                <Typography variant="body1">{selectedReport.userName || 'Анонимно'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог отклонения с указанием причины */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)}>
        <DialogTitle>Отклонить отчет</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Пожалуйста, укажите причину отклонения отчета:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Причина отклонения"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Отмена</Button>
          <Button color="error" onClick={handleReject}>Отклонить</Button>
        </DialogActions>
      </Dialog>
      
      {/* Уведомление о результате операции */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PendingReports; 