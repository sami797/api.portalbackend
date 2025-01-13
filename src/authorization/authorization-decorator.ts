import { SetMetadata } from '@nestjs/common';

export const CheckPermissions = (...permissions: string[]) => SetMetadata('REQUIRED_PERMISSIONS', permissions);