import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiQuery, getSchemaPath } from '@nestjs/swagger';

// eslint-disable-next-line @typescript-eslint/ban-types,@typescript-eslint/explicit-module-boundary-types
export function ApiNestedQuery(query: Function) {
  const constructor = query.prototype;
  const properties = Reflect
      .getMetadata('swagger/apiModelPropertiesArray', constructor)
      .map(prop => prop.substr(1));

  const decorators = properties.map(property => {
    const propertyType = Reflect.getMetadata('design:type', constructor, property);
    return [
      ApiExtraModels(propertyType),
      ApiQuery({
        required: false,
        name: property,
        style: 'deepObject',
        explode: true,
        type: 'object',
        schema: {
          $ref: getSchemaPath(propertyType),
        },
      })
    ]
  }).flat();

  return applyDecorators(...decorators);
}