import ErrorClass from './error';
import SuccessClass from './success';
const { promisify } = require('util');
const fs = require('fs');
const handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const readFile = promisify(fs.readFile);

class MailerClass {
  transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'mail.omegafox.me',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: `${process.env.MAILER_LOGIN}@omegafox.me`, // generated ethereal user
        pass: process.env.MAILER_PASS // generated ethereal password
      }
    });
  }

  async sendWelcome(username: string, email: string) {
    let html = await readFile('./app/mails/welcome.html', 'utf8');
    let template = handlebars.compile(html);
    let data = {
      username: username
    };
    let htmlToSend = template(data);

    const mailerInfo = {
      from: '"Bolão Copa 2022" <bolao@omegafox.me>', // sender address
      to: email, // list of receivers
      subject: `Bem-vindo, ${username}`, // Subject line
      html: htmlToSend // html body
    };

    return this.transporter.sendMail(mailerInfo);
  }

  async sendPasswordRecovery(username: string, guid: string, email: string) {
    let html = await readFile('./app/mails/forgotPassword.html', 'utf8');
    let template = handlebars.compile(html);
    let data = {
      username: username,
      buttonLink: `https://bolaocopa22.omegafox.me/forgotPassword/${guid}/${email}`
    };
    let htmlToSend = template(data);

    const mailerInfo = {
      from: '"Bolão Copa 2022" <bolao@omegafox.me>', // sender address
      to: email, // list of receivers
      subject: `Esqueceu a senha, ${username}?`, // Subject line
      html: htmlToSend // html body
    };

    return this.transporter.sendMail(mailerInfo);
  }

  async sendPasswordConfirmation(username: string, email: string) {
    let html = await readFile('./app/mails/confirmPasswordChange.html', 'utf8');
    let template = handlebars.compile(html);
    let data = {
      username: username
    };
    let htmlToSend = template(data);

    const mailerInfo = {
      from: '"Bolão Copa 2022" <bolao@omegafox.me>', // sender address
      to: email, // list of receivers
      subject: 'Senha alterada!', // Subject line
      html: htmlToSend // html body
      //   html: '<b>Esqueceu pra caralho em HTML</b>' // html body
    };

    return this.transporter.sendMail(mailerInfo);
  }

  async checkConnection() {
    this.transporter.verify(function (error: any, success: any) {
      if (error) {
        console.log(error);
      } else {
        console.log('Server is ready to take our messages');
      }
    });
  }
}

export default MailerClass;
