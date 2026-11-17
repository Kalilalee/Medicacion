export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'No pudimos completar la operación. Volvé a intentar.';
}

export class DevicePermissionError extends Error {
  constructor(resource: string, public readonly canAskAgain: boolean) {
    super(canAskAgain
      ? `No se concedió el permiso para ${resource}. Podés volver a intentar.`
      : `El acceso a ${resource} está bloqueado. Habilitalo en los ajustes del dispositivo.`);
  }
}
