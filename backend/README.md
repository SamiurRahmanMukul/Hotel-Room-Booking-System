<!-- social media connecting shield -->

[![Facebook][facebook-shield]][facebook-url]
[![Instagram][instagram-shield]][instagram-url]
[![Twitter][twitter-shield]][twitter-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![Github][github-shield]][github-url]

# Hotel Room Booking System (Backend)

## E-R Diagram

![E-R Diagram](https://raw.githubusercontent.com/SamiurRahmanMukul/Hotel-Room-Booking-System/main/breach-resorts-e-r-diagram.drawio.png)

## Database Relational Schema

![Database Relational Schema](https://raw.githubusercontent.com/SamiurRahmanMukul/Hotel-Room-Booking-System/main/database-relational-schema.png)

## Installing Packages

```sh
# PACKAGES FOR APPLICATION USAGES
npm install express             // web framework for node.js
npm install serve-favicon       // api router favicon sets
npm install mongoose            // mongo-db database schema-based solution to model your application data
npm install dotenv              // environment variables
npm install cors                // allow cors policy
npm install winston             // node app logger for just about everything
npm install helmet              // express apps by setting various HTTP headers
npm install morgan              // HTTP request logger middleware
npm install app-root-path       // simply access the app root path
npm install multer              // node.js 'multipart/form-data' file upload
npm install express-rate-limit  // basic rate-limiting middleware for express.js

# PACKAGES FOR USER AUTHENTICATION
npm install bcryptjs            // password encryption
npm install jsonwebtoken        // generate jwt token
npm install validator           // email and phone number validator
npm install crypto              // data encryption and decryption
npm install cookie-parser       // parse HTTP request cookies
npm install body-parser         // node.js body parsing middleware
npm install @sendgrid/mail      // send emails using sendgrid service
```

## Setup Development Environment

### 1. Vs-Code Extensions

Install the below extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

### 2. Install Global Dependencies

```sh
npm install -g npm@latest
npm install -g nodemon@latest
npx install -g win-node-env@latest
npx install -g jest@latest
```

### 3. Install Dev Dependencies

```sh
npm install -D eslint
npm init @eslint/config
npx install-peerdeps --dev eslint-config-airbnb-base
npm install -D eslint-plugin-node eslint-config-prettier eslint-plugin-prettier
```

### 4. Install Dev Dependencies for App Testing

```sh
npm install -D jest supertest superagent
npm install -D @babel/core @babel/preset-env babel-jest
jest --init // initialize jest for app testing
```

<!-- my social media links -->

[facebook-url]: https://www.facebook.com/SamiurRahmanMukul
[instagram-url]: https://www.instagram.com/samiur_rahman_mukul
[twitter-url]: https://www.twitter.com/SamiurRahMukul
[linkedin-url]: https://www.linkedin.com/in/SamiurRahmanMukul
[github-url]: https://www.github.com/SamiurRahmanMukul

<!-- shield icon links -->

[facebook-shield]: https://img.shields.io/badge/-Facebook-black.svg?style=flat-square&logo=facebook&color=555&logoColor=white
[instagram-shield]: https://img.shields.io/badge/-Instagram-black.svg?style=flat-square&logo=instagram&color=555&logoColor=white
[twitter-shield]: https://img.shields.io/badge/-Twitter-black.svg?style=flat-square&logo=twitter&color=555&logoColor=white
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[github-shield]: https://img.shields.io/badge/-Github-black.svg?style=flat-square&logo=github&color=555&logoColor=white

<p align="center">
  <strong> HAPPY PROGRAMMING & I LOVE DEVELOPING 💞 </strong>
</p>
