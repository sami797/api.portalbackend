import { MailerModule } from '@nestjs-modules/mailer';
import { EjsAdapter } from '@nestjs-modules/mailer/dist/adapters/ejs.adapter';
import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { join } from 'path';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: false,
        auth: {
            // user: 'info@yallahproperty.ae',
            // pass: 'xonwvdgfushbrgah'
            user: "no-reply@datconsultancy.com",
            pass: "fqbtrpqkyihnuuje"
        },
        tls:{
            rejectUnauthorized: false
        }
      },
      defaults: {
        from: '"DATP Portal" <no-reply@datconsultancy.com>',
      },
      template: {
        dir: process.cwd() + "/dist/views/email-templates",
        adapter: new EjsAdapter(), // or new PugAdapter() or new HandleBarsAdapter()
        options: {
          strict: false,
        },
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController], // 👈 export for DI
})
export class MailModule {}
