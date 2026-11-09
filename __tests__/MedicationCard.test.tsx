import { fireEvent, render } from '@testing-library/react-native';
import { MedicationCard } from '../src/components/MedicationCard';

jest.mock('../src/components/icons', () => ({ Trash2: () => null }));

const medication = { id: '1', name: 'Mi medicación', time: '08:30', note: 'Nota de prueba' };

it('muestra nombre, horario y nota y permite solicitar la eliminación', async () => {
  const onDelete = jest.fn();
  const screen = await render(<MedicationCard medication={medication} onDelete={onDelete} />);
  expect(screen.getByText('Mi medicación')).toBeOnTheScreen();
  expect(screen.getByText('08:30')).toBeOnTheScreen();
  expect(screen.getByText('Nota de prueba')).toBeOnTheScreen();
  await fireEvent.press(screen.getByRole('button', { name: 'Eliminar Mi medicación' }));
  expect(onDelete).toHaveBeenCalledTimes(1);
});

it('desactiva la eliminación mientras se guarda la operación', async () => {
  const onDelete = jest.fn();
  const screen = await render(<MedicationCard medication={medication} onDelete={onDelete} deleting />);
  const button = screen.getByRole('button', { name: 'Eliminar Mi medicación' });
  expect(button).toBeDisabled();
  await fireEvent.press(button);
  expect(onDelete).not.toHaveBeenCalled();
});
