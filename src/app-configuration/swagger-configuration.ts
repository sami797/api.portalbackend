import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";

const swaggerOptions = {
  swaggerOptions: {
    authAction: {
      defaultBearerAuth: {
        name: 'defaultBearerAuth',
        schema: {
          description: 'Default',
          type: 'http',
          in: 'header',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        value: 'thisIsASampleBearerAuthToken123',
      },
    },
    displayRequestDuration: true
  },
};


  export function initializeSwagger(app:any){

// Swagger setup starts
  const config = new DocumentBuilder()
  .setTitle('DAT Projects API')
  .setExternalDoc("Download API in JSON format", '/api-documentation-json')
  .setVersion('v1.1')
  .setDescription('The documentation will describe all endpoints used in the system along with the expected parameters, authentication tokens')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    },
    'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controller!
  )
  .addSecurityRequirements('JWT-auth')
  .build();
  const document = SwaggerModule.createDocument(app, config);

  Object.values((document as OpenAPIObject).paths).forEach((path: any) => {
    Object.values(path).forEach((method: any) => {
    if (Array.isArray(method.security) && method.security.includes('public')) {
        method.security = [];
    }
    });
});

  SwaggerModule.setup('api-documentation', app, document, 
  {
    swaggerOptions: {
        displayRequestDuration: true, 
        persistAuthorization: true,
    }, 
    // explorer: true
  });
  // SwaggerModule.setup('api', app, document, {swaggerOptions: {displayRequestDuration: true}});

  }