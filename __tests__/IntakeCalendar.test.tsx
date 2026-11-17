import { fireEvent, render } from '@testing-library/react-native';
import { IntakeCalendar } from '../src/components/IntakeCalendar';

jest.mock('../src/components/icons', () => ({
  CalendarDays: () => null, Check: () => null, ChevronLeft: () => null,
  ChevronRight: () => null, Clock3: () => null, Trash2: () => null,
}));

const now = new Date(2026, 10, 16, 15).getTime();
const today = { id: 'hoy', takenAt: new Date(2026, 10, 16, 14, 5).toISOString() };
const late = { id: 'noche', takenAt: new Date(2026, 10, 16, 23, 45).toISOString() };
const yesterday = { id: 'ayer', takenAt: new Date(2026, 10, 15, 8, 15).toISOString() };
const october = { id: 'octubre', takenAt: new Date(2026, 9, 31, 10, 30).toISOString() };

function props() {
  return {
    now, intakes: [today, late, yesterday, october],
    onRecord: jest.fn(), onRemove: jest.fn(), onExport: jest.fn(), onOpen: jest.fn(),
  };
}

it('agrupa las tomas por día local y permite consultar un día anterior sin registrar una toma', async () => {
  const actions = props();
  const screen = await render(<IntakeCalendar {...actions} />);
  expect(screen.getByRole('button', { name: '16 de noviembre de 2026, 2 tomas registradas' })).toBeSelected();
  expect(screen.getByText('14:05')).toBeOnTheScreen();
  expect(screen.getByText('23:45')).toBeOnTheScreen();
  expect(screen.queryByText('08:15')).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: '15 de noviembre de 2026, 1 toma registrada' }));
  expect(screen.getByText('08:15')).toBeOnTheScreen();
  expect(screen.queryByText('14:05')).toBeNull();
  expect(actions.onRecord).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: '14 de noviembre de 2026, 0 tomas registradas' }));
  expect(screen.getByText('No hay tomas registradas este día.')).toBeOnTheScreen();
});

it('recorre los meses, permite consultar el último día y vuelve a hoy', async () => {
  const screen = await render(<IntakeCalendar {...props()} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Mes anterior' }));
  expect(screen.getByText('octubre de 2026')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: '31 de octubre de 2026, 1 toma registrada' }));
  expect(screen.getByText('10:30')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Hoy' }));
  expect(screen.getByText('noviembre de 2026')).toBeOnTheScreen();
  expect(screen.getByText('14:05')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Mes siguiente' }));
  expect(screen.getByText('diciembre de 2026')).toBeOnTheScreen();
});

it('registra una toma solo al confirmar que se tomó el medicamento y bloquea el botón durante el guardado', async () => {
  const actions = props();
  const screen = await render(<IntakeCalendar {...actions} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Tomé el medicamento' }));
  expect(actions.onRecord).toHaveBeenCalledTimes(1);
  await screen.rerender(<IntakeCalendar {...actions} disabled recording />);
  const button = screen.getByRole('button', { name: 'Tomé el medicamento' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(actions.onRecord).toHaveBeenCalledTimes(1);
});

it('pide confirmación para corregir una toma y respeta la cancelación', async () => {
  const actions = props();
  const screen = await render(<IntakeCalendar {...actions} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Eliminar toma de las 14:05' }));
  expect(actions.onRemove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Conservar toma' }));
  expect(actions.onRemove).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByRole('button', { name: 'Eliminar toma de las 14:05' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Eliminar registro' }));
  expect(actions.onRemove).toHaveBeenCalledWith('hoy');
});

it('ofrece exportar una toma confirmada o abrir su evento ya guardado', async () => {
  const actions = props();
  const screen = await render(<IntakeCalendar {...actions} intakes={[today]} calendarAvailable />);
  await fireEvent.press(screen.getByRole('button', { name: 'Guardar en Calendario' }));
  expect(actions.onExport).toHaveBeenCalledWith('hoy');
  await screen.rerender(<IntakeCalendar {...actions} intakes={[{
    ...today, calendarEvent: { id: 'evento-1', startsAt: today.takenAt },
  }]} calendarAvailable />);
  expect(screen.queryByRole('button', { name: 'Guardar en Calendario' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Ver en Calendario' }));
  expect(actions.onOpen).toHaveBeenCalledWith('evento-1');
});
