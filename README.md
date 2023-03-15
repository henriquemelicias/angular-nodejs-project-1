# A simple angular project

## Before running:
Backend: [settings.js](backend/settings.js)
e frontend: [shared.service.ts](frontend/src/app/_services/shared.service.ts)

Além disso, fazer os seguintes comandos na pasta [backend](/backend) e [frontend](/frontend):

> npm install

> npm install pm2

## Execute [frontend](/frontend)

> ng serve --port 3014 --host 0.0.0.0 --disableHostCheck true

ou

> npm run start

## Execute [backend](/backend)

Com nodemon:
> npm run nodemon-serverstart

> npm run serverstart

## PM2

In [backend](/backend) and [frontend](/frontend):

> ./node_modules/.bin/pm2 start start.sh --name frontend --watch

> ./node_modules/.bin/pm2 start start.sh --name backend --watch

Save process:

> ./node_modules/.bin/pm2 save

Stop process:

> ./node_modules/.bin/pm2 stop _PROCESS-NAME_

Remove process:

> ./node_modules/.bin/pm2 delete _PROCESS-NAME_
