import { applyDecorators, SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
// export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);


const PublicAuthMiddleware = SetMetadata(IS_PUBLIC_KEY, true);
const PublicAuthSwagger = SetMetadata('swagger/apiSecurity', ['public']);

export const Public = () => applyDecorators(
  PublicAuthMiddleware,
  PublicAuthSwagger,
)